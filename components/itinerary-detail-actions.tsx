"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import maplibregl from "maplibre-gl";
import { Icon } from "./icon-sprite";
import { PriceInput } from "./price-input";
import { TimeInput } from "./time-input";
import type { JalaninItinerary } from "./jalanin-app";
import { ACTIVITY_TYPES, DEFAULT_ACTIVITY_TYPE, isKnownActivityType } from "@/lib/activity-types";
import { isGoogleMapsUrl, type ParsedLocation } from "@/lib/maps-parser";

type ActivityDraft = {
  time: string;
  title: string;
  locationName: string;
  formattedAddress: string;
  latitude: number | null;
  longitude: number | null;
  mapProvider: string;
  mapPlaceId: string;
  customLocation: boolean;
  category: string;
  estimatedCost: number;
  myLinkId: string | null;
};

type DayDraft = {
  title: string;
  activities: ActivityDraft[];
};

type Props = {
  itinerary: JalaninItinerary;
};

type LocationResult = {
  placeId: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  provider: string;
};

const mapStyleUrl = "https://tiles.openfreemap.org/styles/liberty";
const defaultMapCenter: [number, number] = [106.8272, -6.1754];

function createBlankActivity(index: number): ActivityDraft {
  return {
    time: `${9 + index}.00`,
    title: "",
    locationName: "",
    formattedAddress: "",
    latitude: null,
    longitude: null,
    mapProvider: "",
    mapPlaceId: "",
    customLocation: false,
    category: DEFAULT_ACTIVITY_TYPE,
    estimatedCost: 0,
    myLinkId: null,
  };
}

function createBlankDay(index: number): DayDraft {
  return {
    title: `Hari ${index + 1}`,
    activities: [createBlankActivity(0)],
  };
}

function createDrafts(itinerary: JalaninItinerary): DayDraft[] {
  return itinerary.days.length
    ? itinerary.days.map((day) => ({
        title: day.title || `Hari ${day.dayNumber}`,
        activities: day.activities.length
          ? day.activities.map((activity) => ({
              time: activity.time,
              title: activity.title,
              locationName: activity.locationName,
              formattedAddress: activity.formattedAddress,
              latitude: activity.latitude,
              longitude: activity.longitude,
              mapProvider: activity.mapProvider,
              mapPlaceId: activity.mapPlaceId,
              customLocation: activity.customLocation,
              category: activity.category,
              estimatedCost: activity.estimatedCost,
              myLinkId: activity.myLinkId || null,
            }))
          : [createBlankActivity(0)],
      }))
    : [createBlankDay(0)];
}

function draftKey(dayIndex: number, activityIndex: number) {
  return `${dayIndex}-${activityIndex}`;
}

function createLocationQueryMap(days: DayDraft[]) {
  return Object.fromEntries(
    days.flatMap((day, dayIndex) =>
      day.activities.map((activity, activityIndex) => [draftKey(dayIndex, activityIndex), activity.locationName || activity.title]),
    ),
  );
}

function PointPicker({
  value,
  onPick,
}: {
  value: { latitude: number | null; longitude: number | null };
  onPick: (point: { latitude: number; longitude: number }) => void;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!mapRef.current) return;

    const center: [number, number] =
      typeof value.longitude === "number" && typeof value.latitude === "number" ? [value.longitude, value.latitude] : defaultMapCenter;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: mapStyleUrl,
      center,
      zoom: typeof value.longitude === "number" ? 14 : 11,
      scrollZoom: false,
    });
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    mapInstanceRef.current = map;

    markerRef.current = new maplibregl.Marker({ color: "#e85d75" }).setLngLat(center).addTo(map);
    map.on("click", (event) => {
      const point = {
        latitude: Number(event.lngLat.lat.toFixed(7)),
        longitude: Number(event.lngLat.lng.toFixed(7)),
      };
      markerRef.current?.setLngLat([point.longitude, point.latitude]);
      onPickRef.current(point);
    });

    return () => {
      mapInstanceRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (typeof value.longitude !== "number" || typeof value.latitude !== "number") return;

    const nextCenter: [number, number] = [value.longitude, value.latitude];
    markerRef.current?.setLngLat(nextCenter);
    mapInstanceRef.current?.jumpTo({ center: nextCenter, zoom: 14 });
  }, [value.latitude, value.longitude]);

  return <div className="activity-map-picker" ref={mapRef} />;
}

export function ItineraryDetailActions({ itinerary }: Props) {
  const router = useRouter();
  const initialDrafts = useMemo(() => createDrafts(itinerary), [itinerary]);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [limitError, setLimitError] = useState<string | null>(null);
  const [dayDrafts, setDayDrafts] = useState(initialDrafts);
  const [estimatedBudget, setEstimatedBudget] = useState(itinerary.estimatedBudget);
  const [locationQueries, setLocationQueries] = useState<Record<string, string>>(createLocationQueryMap(initialDrafts));
  const [locationResults, setLocationResults] = useState<Record<string, LocationResult[]>>({});
  const [searchingLocation, setSearchingLocation] = useState<string | null>(null);
  const [pickerKey, setPickerKey] = useState<string | null>(null);
  const [userMyLinks, setUserMyLinks] = useState<{ id: string; label: string; provider: string; actualUrl: string }[]>([]);

  useEffect(() => {
    fetch("/api/mylink/links")
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => setUserMyLinks(data))
      .catch((err) => console.error("Gagal mengambil MyLinks:", err));
  }, []);

  function resetEditor() {
    setDayDrafts(initialDrafts);
    setEstimatedBudget(itinerary.estimatedBudget);
    setLocationQueries(createLocationQueryMap(initialDrafts));
    setLocationResults({});
    setPickerKey(null);
    setMessage("");
  }

  function updateDay(dayIndex: number, title: string) {
    setDayDrafts((previous) => previous.map((day, index) => (index === dayIndex ? { ...day, title } : day)));
  }

  function updateActivity(dayIndex: number, activityIndex: number, patch: Partial<ActivityDraft>) {
    setDayDrafts((previous) =>
      previous.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              activities: day.activities.map((activity, currentIndex) => (currentIndex === activityIndex ? { ...activity, ...patch } : activity)),
            }
          : day,
      ),
    );
  }

  function addDay() {
    setDayDrafts((previous) => {
      if (previous.length >= 5) {
        setMessage("Batas maksimal durasi itinerary adalah 5 hari.");
        return previous;
      }
      const next = [...previous, createBlankDay(previous.length)];
      setLocationQueries(createLocationQueryMap(next));
      setLocationResults({});
      setPickerKey(null);
      return next;
    });
  }

  function removeDay(dayIndex: number) {
    setDayDrafts((previous) => {
      if (previous.length === 1) return previous;
      const next = previous.filter((_, index) => index !== dayIndex);
      setLocationQueries(createLocationQueryMap(next));
      setLocationResults({});
      setPickerKey(null);
      return next;
    });
  }

  function addActivity(dayIndex: number) {
    setDayDrafts((previous) => {
      const day = previous[dayIndex];
      if (day && day.activities.length >= 10) {
        setMessage("Batas maksimal aktivitas per hari adalah 10 aktivitas.");
        return previous;
      }
      const next = previous.map((day, index) =>
        index === dayIndex ? { ...day, activities: [...day.activities, createBlankActivity(day.activities.length)] } : day,
      );
      setLocationQueries(createLocationQueryMap(next));
      return next;
    });
  }

  function removeActivity(dayIndex: number, activityIndex: number) {
    setDayDrafts((previous) => {
      const next = previous.map((day, index) =>
        index === dayIndex && day.activities.length > 1
          ? { ...day, activities: day.activities.filter((_, currentIndex) => currentIndex !== activityIndex) }
          : day,
      );
      setLocationQueries(createLocationQueryMap(next));
      setLocationResults({});
      setPickerKey(null);
      return next;
    });
  }

  async function parseGoogleMapsLocation(dayIndex: number, activityIndex: number, url: string) {
    const key = draftKey(dayIndex, activityIndex);
    setSearchingLocation(key);
    setMessage("");
    try {
      const response = await fetch("/api/parse-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const payload = (await response.json()) as ParsedLocation & { error?: string };
      if (!response.ok || !payload.success || payload.lat === null || payload.lng === null) {
        setMessage(payload.error ?? "Tidak bisa membaca koordinat dari link Google Maps.");
        return;
      }

      const locationName = payload.name || "Lokasi Google Maps";
      const activityTitle = locationName.split(",")[0]?.trim() || locationName;
      const currentActivity = dayDrafts[dayIndex]?.activities[activityIndex];
      updateActivity(dayIndex, activityIndex, {
        locationName,
        formattedAddress: payload.finalUrl,
        latitude: payload.lat,
        longitude: payload.lng,
        mapProvider: "google_maps",
        mapPlaceId: "",
        customLocation: false,
        ...(!currentActivity?.title.trim() ? { title: activityTitle } : {}),
      });
      setLocationQueries((previous) => ({ ...previous, [key]: payload.name || url }));
      setLocationResults((previous) => ({ ...previous, [key]: [] }));
      setMessage("Lokasi dari Google Maps berhasil diambil.");
    } finally {
      setSearchingLocation(null);
    }
  }

  async function searchLocation(dayIndex: number, activityIndex: number) {
    const key = draftKey(dayIndex, activityIndex);
    const query = locationQueries[key]?.trim();
    if (!query) {
      setMessage("Masukkan nama lokasi atau tempel link Google Maps.");
      return;
    }

    if (isGoogleMapsUrl(query)) {
      await parseGoogleMapsLocation(dayIndex, activityIndex, query);
      return;
    }

    if (query.length < 2) {
      setMessage("Ketik minimal 2 karakter untuk cari lokasi.");
      return;
    }

    setSearchingLocation(key);
    setMessage("");
    try {
      const response = await fetch(`/api/maps/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        setMessage(await response.text());
        return;
      }

      const payload = (await response.json()) as { results: LocationResult[] };
      setLocationResults((previous) => ({ ...previous, [key]: payload.results }));
      if (!payload.results.length) {
        setMessage("Lokasi tidak ditemukan. Pilih titik manual di peta.");
      }
    } finally {
      setSearchingLocation(null);
    }
  }

  function selectLocation(dayIndex: number, activityIndex: number, result: LocationResult) {
    const key = draftKey(dayIndex, activityIndex);
    updateActivity(dayIndex, activityIndex, {
      locationName: result.name,
      formattedAddress: result.formattedAddress,
      latitude: result.latitude,
      longitude: result.longitude,
      mapProvider: result.provider,
      mapPlaceId: result.placeId,
      customLocation: false,
    });
    setLocationQueries((previous) => ({ ...previous, [key]: result.name }));
    setLocationResults((previous) => ({ ...previous, [key]: [] }));
  }

  function pickManualPoint(dayIndex: number, activityIndex: number, point: { latitude: number; longitude: number }) {
    const key = draftKey(dayIndex, activityIndex);
    const activity = dayDrafts[dayIndex]?.activities[activityIndex];
    updateActivity(dayIndex, activityIndex, {
      latitude: point.latitude,
      longitude: point.longitude,
      mapProvider: "custom",
      mapPlaceId: "",
      customLocation: true,
      locationName: activity?.locationName || locationQueries[key] || activity?.title || "Lokasi custom",
      formattedAddress: `${point.latitude}, ${point.longitude}`,
    });
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const days = dayDrafts
      .map((day, index) => ({
        title: day.title.trim() || `Hari ${index + 1}`,
        activities: day.activities
          .map((activity) => ({
            ...activity,
            title: activity.title.trim(),
            locationName: activity.locationName.trim(),
            estimatedCost: Number(activity.estimatedCost) || 0,
          }))
          .filter((activity) => activity.title),
      }))
      .filter((day) => day.activities.length);

    formData.set("daysJson", JSON.stringify(days));
    formData.set("durationDays", String(Math.max(Number(formData.get("durationDays") ?? 1), days.length || 1)));

    const response = await fetch(`/api/itineraries/${itinerary.id}`, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      if (errText.startsWith("Batas maksimal")) {
        setLimitError(errText);
      } else {
        setMessage(errText);
      }
      return;
    }

    setIsEditing(false);
    router.refresh();
  }

  async function deleteItinerary() {
    if (!window.confirm("Hapus itinerary ini secara permanen?")) return;

    setIsDeleting(true);
    setMessage("");

    const response = await fetch(`/api/itineraries/${itinerary.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setMessage(await response.text());
      setIsDeleting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <>
      <div className="detail-actions">
        <button className="ghost-chip" type="button" onClick={() => setIsEditing(true)}>
          <Icon name="grid" />
          <span>Edit</span>
        </button>
        <button className="ghost-chip danger" type="button" onClick={deleteItinerary} disabled={isDeleting}>
          <Icon name="x" />
          <span>{isDeleting ? "Menghapus..." : "Delete"}</span>
        </button>
      </div>
      {message ? <p className="error-text detail-error">{message}</p> : null}

      <section className={`drawer ${isEditing ? "open" : ""}`} aria-hidden={!isEditing} aria-label="Edit itinerary detail">
        <div
          className="drawer-backdrop"
          onClick={() => {
            resetEditor();
            setIsEditing(false);
          }}
        />
        <div className="drawer-panel detail-editor" role="dialog" aria-modal="true" aria-labelledby="detailEditorTitle">
          <div className="drawer-header">
            <div>
              <p>Itinerary pribadi</p>
              <h2 id="detailEditorTitle">Edit Itinerary</h2>
            </div>
            <button
              className="tool-button"
              type="button"
              onClick={() => {
                resetEditor();
                setIsEditing(false);
              }}
              aria-label="Tutup"
            >
              <Icon name="x" />
            </button>
          </div>

          <form className="itinerary-form" onSubmit={submitEdit}>
            <label>
              <span>Judul itinerary</span>
              <input name="title" required defaultValue={itinerary.title} />
            </label>
            <div className="form-grid">
              <label>
                <span>Destinasi utama</span>
                <input name="destination" required defaultValue={itinerary.destination} />
              </label>
              <label>
                <span>Durasi</span>
                <input name="durationDays" type="number" min="1" max="5" required defaultValue={itinerary.durationDays} />
              </label>
            </div>
            <label>
              <span>Cover image upload</span>
              <input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" />
            </label>
            <input type="hidden" name="coverImageUrl" defaultValue={itinerary.coverImageUrl} />
            <div className="form-grid">
              <label>
                <span>Estimasi budget</span>
                <PriceInput
                  name="estimatedBudget"
                  required
                  value={estimatedBudget}
                  onChange={setEstimatedBudget}
                  placeholder="1.500.000"
                />
              </label>
              <label>
                <span>Travel style</span>
                <select name="travelStyle" defaultValue={itinerary.travelStyle}>
                  <option>Budget trip</option>
                  <option>Kuliner</option>
                  <option>Couple</option>
                  <option>Nature</option>
                  <option>City tour</option>
                  <option>Family</option>
                </select>
              </label>
            </div>
            <label>
              <span>Status Visibilitas</span>
              <select name="isPublished" defaultValue={String(itinerary.isPublished)}>
                <option value="true">Publik (Bisa dilihat semua orang, batas maks 5)</option>
                <option value="false">Privat (Hanya bisa dilihat oleh Anda, batas maks 2)</option>
              </select>
            </label>
            <label>
              <span>Deskripsi singkat</span>
              <textarea name="description" rows={4} required defaultValue={itinerary.description} />
            </label>
            <label>
              <span>Catatan tambahan</span>
              <textarea name="notes" rows={3} defaultValue={itinerary.notes} />
            </label>

            <section className="detail-days-editor">
              <div className="activity-builder-head">
                <div>
                  <span>Hari dan aktivitas</span>
                  <strong>
                    {dayDrafts.length} hari · {dayDrafts.reduce((total, day) => total + day.activities.length, 0)} stop
                  </strong>
                </div>
                <button className="mini-button" type="button" onClick={addDay}>
                  <Icon name="plus" />
                  <span>Hari</span>
                </button>
              </div>

              {dayDrafts.map((day, dayIndex) => (
                <article className="detail-day-editor" key={dayIndex}>
                  <div className="detail-day-head">
                    <label>
                      <span>Nama hari</span>
                      <input value={day.title} onChange={(event) => updateDay(dayIndex, event.target.value)} />
                    </label>
                    {dayDrafts.length > 1 ? (
                      <button className="mini-button muted" type="button" onClick={() => removeDay(dayIndex)}>
                        Hapus hari
                      </button>
                    ) : null}
                  </div>

                  {day.activities.map((activity, activityIndex) => (
                    <div className="detail-activity-editor" key={activityIndex}>
                      {(() => {
                        const key = draftKey(dayIndex, activityIndex);
                        return (
                          <>
                      <div className="form-grid compact">
                        <label>
                          <span>Waktu</span>
                          <TimeInput value={activity.time} onChange={(time) => updateActivity(dayIndex, activityIndex, { time })} />
                        </label>
                        <label>
                          <span>Aktivitas</span>
                          <input
                            value={activity.title}
                            onChange={(event) => updateActivity(dayIndex, activityIndex, { title: event.target.value })}
                            placeholder="Nama aktivitas"
                          />
                        </label>
                      </div>
                      <label>
                        <span>Lokasi</span>
                        <div className="location-search-row">
                          <input
                            value={locationQueries[key] ?? ""}
                            onChange={(event) => setLocationQueries((previous) => ({ ...previous, [key]: event.target.value }))}
                            placeholder="Cari lokasi atau tempel link Google Maps"
                          />
                          <button className="mini-button" type="button" onClick={() => searchLocation(dayIndex, activityIndex)} disabled={searchingLocation === key}>
                            <Icon name="search" />
                            <span>{searchingLocation === key ? "Cari..." : "Cari"}</span>
                          </button>
                        </div>
                      </label>
                      {locationResults[key]?.length ? (
                        <div className="location-results">
                          {locationResults[key].map((result) => (
                            <button key={`${result.placeId}-${result.latitude}-${result.longitude}`} type="button" onClick={() => selectLocation(dayIndex, activityIndex, result)}>
                              <strong>{result.name}</strong>
                              <span>{result.formattedAddress}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                      <div className="location-summary">
                        <Icon name="map-pin" />
                        <span>
                          {activity.locationName || "Belum ada lokasi"}
                          {typeof activity.latitude === "number" && typeof activity.longitude === "number" ? ` · ${activity.latitude.toFixed(5)}, ${activity.longitude.toFixed(5)}` : ""}
                        </span>
                        <button className="mini-button muted" type="button" onClick={() => setPickerKey(pickerKey === key ? null : key)}>
                          Pilih titik
                        </button>
                      </div>
                      {pickerKey === key ? (
                        <PointPicker value={{ latitude: activity.latitude, longitude: activity.longitude }} onPick={(point) => pickManualPoint(dayIndex, activityIndex, point)} />
                      ) : null}
                      <div className="form-grid compact">
                        <label>
                          <span>Tipe aktivitas</span>
                          <select value={activity.category} onChange={(event) => updateActivity(dayIndex, activityIndex, { category: event.target.value })}>
                            {!isKnownActivityType(activity.category) && activity.category ? (
                              <option value={activity.category}>{activity.category}</option>
                            ) : null}
                            {ACTIVITY_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>Harga</span>
                          <PriceInput
                            value={activity.estimatedCost}
                            onChange={(estimatedCost) => updateActivity(dayIndex, activityIndex, { estimatedCost })}
                            placeholder="350.000"
                          />
                        </label>
                      </div>
                      <label style={{ display: "grid", gap: "6px", marginTop: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>Sematkan Link MyLink</span>
                          <a href="/settings/mylink" target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "var(--blue)", fontWeight: 700 }}>
                            Kelola
                          </a>
                        </div>
                        <select
                          value={activity.myLinkId || ""}
                          onChange={(event) => updateActivity(dayIndex, activityIndex, { myLinkId: event.target.value || null })}
                          style={{
                            width: "100%",
                            padding: "10px",
                            color: "var(--text)",
                            background: "var(--surface-soft)",
                            border: "1px solid var(--line-strong)",
                            borderRadius: "var(--radius)",
                            outline: 0
                          }}
                        >
                          <option value="">-- Tanpa Link MyLink --</option>
                          {userMyLinks.map((link) => (
                            <option key={link.id} value={link.id}>
                              {link.label} ({link.provider})
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="detail-activity-tools">
                        {day.activities.length > 1 ? (
                          <button className="tool-button" type="button" onClick={() => removeActivity(dayIndex, activityIndex)} aria-label="Hapus aktivitas">
                            <Icon name="x" />
                          </button>
                        ) : null}
                      </div>
                          </>
                        );
                      })()}
                    </div>
                  ))}

                  <button className="mini-button muted" type="button" onClick={() => addActivity(dayIndex)}>
                    <Icon name="plus" />
                    <span>Tambah aktivitas</span>
                  </button>
                </article>
              ))}
            </section>

            {message ? <p className="error-text">{message}</p> : null}
            <button className="primary-button wide" type="submit">
              Simpan perubahan
            </button>
          </form>
        </div>
      </section>

      {limitError && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(8px)",
          padding: "20px"
        }} onClick={() => setLimitError(null)}>
          <div style={{
            background: "rgba(255, 255, 255, 0.96)",
            border: "1px solid var(--line-strong)",
            borderRadius: "28px",
            boxShadow: "var(--shadow-pop)",
            width: "100%",
            maxWidth: "400px",
            padding: "32px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: "40px" }}>🚀</div>
            <h3 style={{ fontSize: "18px", fontWeight: 850, color: "var(--ink)", margin: 0 }}>Limit Kuota Tercapai</h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
              {limitError}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "8px" }}>
              <Link
                href="/settings/profile#upgrade"
                className="primary-button"
                style={{ justifyContent: "center", textDecoration: "none", display: "flex", width: "100%", padding: "14px", boxSizing: "border-box" }}
                onClick={() => setLimitError(null)}
              >
                Upgrade ke PRO
              </Link>
              <button 
                type="button"
                className="ghost-chip"
                style={{ justifyContent: "center", display: "flex", width: "100%", padding: "12px", boxSizing: "border-box", cursor: "pointer" }}
                onClick={() => setLimitError(null)}
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
