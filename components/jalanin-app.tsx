"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import maplibregl from "maplibre-gl";
import { Icon, IconSprite } from "./icon-sprite";
import { PriceInput } from "./price-input";
import { TimeInput } from "./time-input";
import { ACTIVITY_TYPE_COLORS, ACTIVITY_TYPES, activityIcon, computeTripInsights, DEFAULT_ACTIVITY_TYPE, isKnownActivityType } from "@/lib/activity-types";
import { formatCompact, formatRupiah } from "@/lib/format";
import { isGoogleMapsUrl, type ParsedLocation } from "@/lib/maps-parser";

export type JalaninUser = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  role: string;
  isPro?: boolean;
};

export type JalaninActivity = {
  id: string;
  time: string;
  title: string;
  locationName: string;
  formattedAddress: string;
  latitude: number | null;
  longitude: number | null;
  mapProvider: string;
  mapPlaceId: string;
  customLocation: boolean;
  estimatedCost: number;
  category: string;
  orderIndex: number;
  affiliateLinkId: string | null;
  affiliateLink?: { actualUrl: string; provider: string } | null;
};

export type JalaninDay = {
  id: string;
  dayNumber: number;
  title: string;
  activities: JalaninActivity[];
};

export type JalaninItinerary = {
  id: string;
  title: string;
  destination: string;
  description: string;
  durationDays: number;
  estimatedBudget: number;
  travelStyle: string;
  coverImageUrl: string;
  notes: string;
  isPublished: boolean;
  author: JalaninUser;
  days: JalaninDay[];
  savesCount: number;
  likesCount: number;
  copiesCount: number;
  originalItinerary?: {
    id: string;
    title: string;
    author: {
      id: string;
      name: string | null;
      username: string | null;
    };
  } | null;
};

type Props = {
  itineraries: JalaninItinerary[];
  currentUser: JalaninUser | null;
  savedIds: string[];
  likedIds: string[];
};

const filters = ["Semua", "Random", "Budget trip", "Kuliner", "Nature", "Family", "City tour"];

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
  affiliateLinkId: string | null;
};

type DayDraft = {
  title: string;
  activities: ActivityDraft[];
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
    affiliateLinkId: null,
  };
}

function createBlankDay(index: number): DayDraft {
  return {
    title: `Hari ${index + 1}`,
    activities: [createBlankActivity(0)],
  };
}

function fromActivity(activity: JalaninActivity): ActivityDraft {
  return {
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
    affiliateLinkId: activity.affiliateLinkId || null,
  };
}

function fromDay(day: JalaninDay): DayDraft {
  return {
    title: day.title || `Hari ${day.dayNumber}`,
    activities: day.activities.length ? day.activities.map(fromActivity) : [createBlankActivity(0)],
  };
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

function activityPoints(activities: Array<JalaninActivity | ActivityDraft>) {
  return activities.filter((activity) => typeof activity.latitude === "number" && typeof activity.longitude === "number") as Array<
    (JalaninActivity | ActivityDraft) & { latitude: number; longitude: number }
  >;
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

function RouteMap({ activities }: { activities: Array<JalaninActivity | ActivityDraft> }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const points = useMemo(() => activityPoints(activities), [activities]);

  useEffect(() => {
    if (!mapRef.current) return;

    const center: [number, number] = points[0] ? [points[0].longitude, points[0].latitude] : defaultMapCenter;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: mapStyleUrl,
      center,
      zoom: points.length ? 12 : 10,
      scrollZoom: false,
    });
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    map.on("load", () => {
      points.forEach((point, index) => {
        const marker = document.createElement("div");
        marker.className = "route-marker";
        marker.textContent = String(index + 1);
        new maplibregl.Marker({ element: marker }).setLngLat([point.longitude, point.latitude]).addTo(map);
      });

      if (points.length > 1) {
        const coordinates: [number, number][] = points.map((point) => [point.longitude, point.latitude]);
        map.addSource("activity-route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates,
            },
          },
        });
        map.addLayer({
          id: "activity-route-line",
          type: "line",
          source: "activity-route",
          paint: {
            "line-color": "#e85d75",
            "line-width": 4,
            "line-opacity": 0.85,
          },
        });
        const bounds = coordinates.reduce((box, coordinate) => box.extend(coordinate as [number, number]), new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
        map.fitBounds(bounds, { padding: 48, maxZoom: 14 });
      }
    });

    return () => map.remove();
  }, [points]);

  return (
    <div className="route-map-wrap">
      <div className="large-map real-map" ref={mapRef} />
      {!points.length ? <div className="map-empty">Tambahkan koordinat aktivitas untuk melihat rute.</div> : null}
    </div>
  );
}

export function JalaninApp({ itineraries, currentUser, savedIds, likedIds }: Props) {
  const [items, setItems] = useState(itineraries);
  const [currentId, setCurrentId] = useState(itineraries[0]?.id ?? "");
  const [tab, setTab] = useState<"days" | "calendar" | "Hari demi Hari" | "map">("days");
  const [dayIndex, setDayIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Semua");
  const [saved, setSaved] = useState(savedIds);
  const [liked, setLiked] = useState(likedIds);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cloneSource, setCloneSource] = useState<JalaninItinerary | null>(null);
  const [editSource, setEditSource] = useState<JalaninItinerary | null>(null);
  const [toast, setToast] = useState("");
  const [limitError, setLimitError] = useState<string | null>(null);
  const [dayDrafts, setDayDrafts] = useState<DayDraft[]>([createBlankDay(0)]);
  const [estimatedBudgetDraft, setEstimatedBudgetDraft] = useState(1_500_000);
  const [activeDraftDayIndex, setActiveDraftDayIndex] = useState(0);
  const [locationQueries, setLocationQueries] = useState<Record<string, string>>(createLocationQueryMap([createBlankDay(0)]));
  const [locationResults, setLocationResults] = useState<Record<string, LocationResult[]>>({});
  const [searchingLocation, setSearchingLocation] = useState<string | null>(null);
  const [pickerKey, setPickerKey] = useState<string | null>(null);
  const [userAffiliateLinks, setUserAffiliateLinks] = useState<{ id: string; label: string; provider: string; actualUrl: string }[]>([]);

  useEffect(() => {
    if (!currentUser || !drawerOpen) return;
    fetch("/api/affiliate/links")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setUserAffiliateLinks(data))
      .catch((err) => console.error("Gagal mengambil affiliate links:", err));
  }, [currentUser, drawerOpen]);

  const current = items.find((item) => item.id === currentId) ?? items[0];
  const formSource = editSource ?? cloneSource;
  const isEditing = Boolean(editSource);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return items.filter((item) => {
      const isNotOwn = !currentUser || item.author.id !== currentUser.id;
      const matchesFilter = filter === "Semua" || item.travelStyle === filter;
      const haystack = `${item.title} ${item.destination} ${item.travelStyle}`.toLowerCase();
      return isNotOwn && matchesFilter && (!normalized || haystack.includes(normalized));
    });
  }, [currentUser, filter, items, query]);

  const tripInsights = useMemo(() => (current ? computeTripInsights(current.days) : null), [current]);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  useEffect(() => {
    if (!current?.days.length) return;
    setDayIndex((previous) => Math.min(previous, current.days.length - 1));
  }, [current?.id, current?.days.length]);

  useEffect(() => {
    if (!drawerOpen) return;

    const nextDrafts = formSource?.days.length ? formSource.days.map(fromDay) : [createBlankDay(0)];
    setDayDrafts(nextDrafts);
    setEstimatedBudgetDraft(formSource?.estimatedBudget ?? 0);
    setActiveDraftDayIndex(0);
    setLocationQueries(createLocationQueryMap(nextDrafts));
    setLocationResults({});
    setPickerKey(null);
  }, [formSource, drawerOpen]);

  function openCreateDrawer() {
    setCloneSource(null);
    setEditSource(null);
    setDrawerOpen(true);
  }

  function openRemixDrawer(source: JalaninItinerary) {
    setEditSource(null);
    setCloneSource(source);
    setDrawerOpen(true);
  }

  function openEditDrawer(source: JalaninItinerary) {
    setCloneSource(null);
    setEditSource(source);
    setDrawerOpen(true);
  }

  async function mutate(url: string, init?: RequestInit) {
    const response = await fetch(url, init);

    if (response.status === 401) {
      flash("Login dulu untuk memakai fitur ini.");
      return null;
    }

    if (!response.ok) {
      const errText = await response.text();
      if (errText.startsWith("Batas maksimal")) {
        setLimitError(errText);
      } else {
        flash(errText);
      }
      return null;
    }

    return response.json();
  }

  async function toggleSave() {
    if (!current) return;

    const isSaved = saved.includes(current.id);
    const result = await mutate(`/api/itineraries/${current.id}/save`, {
      method: isSaved ? "DELETE" : "POST",
    });

    if (!result) return;
    setSaved((previous) => (isSaved ? previous.filter((id) => id !== current.id) : [...previous, current.id]));
    setItems((previous) =>
      previous.map((item) =>
        item.id === current.id
          ? {
            ...item,
            savesCount: Math.max(0, item.savesCount + (isSaved ? -1 : 1)),
          }
          : item,
      ),
    );
    flash(isSaved ? "Rute dihapus dari koleksi." : "Rute berhasil disimpan.");
  }

  async function toggleLike() {
    if (!current) return;

    const isLiked = liked.includes(current.id);
    const result = await mutate(`/api/itineraries/${current.id}/like`, {
      method: isLiked ? "DELETE" : "POST",
    });

    if (!result) return;
    setLiked((previous) => (isLiked ? previous.filter((id) => id !== current.id) : [...previous, current.id]));
    setItems((previous) =>
      previous.map((item) =>
        item.id === current.id
          ? {
            ...item,
            likesCount: Math.max(0, item.likesCount + (isLiked ? -1 : 1)),
          }
          : item,
      ),
    );
  }

  async function cloneItinerary() {
    if (!current) return;

    const result = await mutate(`/api/itineraries/${current.id}/clone`, {
      method: "POST",
    });

    if (!result) return;
    window.location.href = `/itinerary/${result.id}`;
  }

  function updateDayTitle(dayIndex: number, title: string) {
    setDayDrafts((previous) => previous.map((day, currentIndex) => (currentIndex === dayIndex ? { ...day, title } : day)));
  }

  function updateActivity(dayIndex: number, activityIndex: number, patch: Partial<ActivityDraft>) {
    setDayDrafts((previous) =>
      previous.map((day, currentDayIndex) =>
        currentDayIndex === dayIndex
          ? {
            ...day,
            activities: day.activities.map((activity, currentActivityIndex) =>
              currentActivityIndex === activityIndex ? { ...activity, ...patch } : activity,
            ),
          }
          : day,
      ),
    );
  }

  function addDay() {
    setDayDrafts((previous) => {
      if (previous.length >= 5) {
        flash("Batas maksimal durasi itinerary adalah 5 hari.");
        return previous;
      }
      const next = [...previous, createBlankDay(previous.length)];
      setActiveDraftDayIndex(next.length - 1);
      setLocationQueries(createLocationQueryMap(next));
      setLocationResults({});
      setPickerKey(null);
      return next;
    });
  }

  function removeDay(dayIndex: number) {
    setDayDrafts((previous) => {
      if (previous.length === 1) return previous;
      const next = previous.filter((_, currentIndex) => currentIndex !== dayIndex).map((day, index) => ({ ...day, title: day.title || `Hari ${index + 1}` }));
      setActiveDraftDayIndex((current) => Math.min(current, next.length - 1));
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
        flash("Batas maksimal aktivitas per hari adalah 10 aktivitas.");
        return previous;
      }
      const next = previous.map((day, currentDayIndex) =>
        currentDayIndex === dayIndex ? { ...day, activities: [...day.activities, createBlankActivity(day.activities.length)] } : day,
      );
      setLocationQueries(createLocationQueryMap(next));
      return next;
    });
  }

  function removeActivity(dayIndex: number, activityIndex: number) {
    setDayDrafts((previous) => {
      const next = previous.map((day, currentDayIndex) =>
        currentDayIndex === dayIndex && day.activities.length > 1
          ? { ...day, activities: day.activities.filter((_, currentActivityIndex) => currentActivityIndex !== activityIndex) }
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
    try {
      const response = await fetch("/api/parse-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const payload = (await response.json()) as ParsedLocation & { error?: string };
      if (!response.ok || !payload.success || payload.lat === null || payload.lng === null) {
        flash(payload.error ?? "Tidak bisa membaca koordinat dari link Google Maps.");
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
      flash("Lokasi dari Google Maps berhasil diambil.");
    } finally {
      setSearchingLocation(null);
    }
  }

  async function searchLocation(dayIndex: number, activityIndex: number) {
    const key = draftKey(dayIndex, activityIndex);
    const query = locationQueries[key]?.trim();
    if (!query) {
      flash("Tempel link Google Maps.");
      return;
    }

    if (isGoogleMapsUrl(query)) {
      await parseGoogleMapsLocation(dayIndex, activityIndex, query);
      return;
    }

    if (query.length < 2) {
      flash("Ketik minimal 2 karakter untuk cari lokasi.");
      return;
    }

    setSearchingLocation(key);
    try {
      const response = await fetch(`/api/maps/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        flash(await response.text());
        return;
      }

      const payload = (await response.json()) as { results: LocationResult[] };
      setLocationResults((previous) => ({ ...previous, [key]: payload.results }));
      if (!payload.results.length) {
        flash("Lokasi tidak ditemukan. Pilih titik manual di peta.");
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

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const days = dayDrafts
      .map((day, index) => ({
        title: day.title.trim() || `Hari ${index + 1}`,
        activities: day.activities
          .map((activity) => ({
            ...activity,
            title: activity.title.trim(),
            locationName: activity.locationName.trim(),
          }))
          .filter((activity) => activity.title),
      }))
      .filter((day) => day.activities.length);

    formData.set("daysJson", JSON.stringify(days));
    formData.set("durationDays", String(Math.max(Number(formData.get("durationDays") ?? 1), days.length || 1)));

    const result = await mutate(isEditing ? `/api/itineraries/${editSource?.id}` : "/api/itineraries", {
      method: isEditing ? "PUT" : "POST",
      body: formData,
    });

    if (!result) return;
    setItems((previous) => (isEditing ? previous.map((item) => (item.id === result.id ? result : item)) : [result, ...previous]));
    setCurrentId(result.id);
    setDrawerOpen(false);
    setCloneSource(null);
    setEditSource(null);
    setDayDrafts([createBlankDay(0)]);
    setActiveDraftDayIndex(0);
    setLocationQueries(createLocationQueryMap([createBlankDay(0)]));
    flash(isEditing ? "Itinerary berhasil diperbarui." : "Itinerary berhasil dipublish.");
    form.reset();
  }

  const currentDay = current?.days[dayIndex] ?? current?.days[0];
  const savedItems = items.filter((item) => saved.includes(item.id));
  const createdItems = items.filter((item) => item.author.id === currentUser?.id);
  const activeDraftDay = dayDrafts[activeDraftDayIndex] ?? dayDrafts[0];

  return (
    <>
      <IconSprite />
      <div className="app-shell">
        <header className="topbar">
          <button className="brand" onClick={() => setCurrentId(items[0]?.id ?? "")} aria-label="Jalanin home">
            <span className="brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>Jalanin</span>
          </button>

          <label className="searchbox">
            <Icon name="search" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Cari Bali 3 hari, Jogja kuliner..." />
          </label>

          <nav className="top-actions" aria-label="Navigasi utama">
            {currentUser?.role === "ADMIN" ? (
              <Link className="tool-button" href="/admin" data-tooltip="Admin panel">
                <Icon name="shield" />
              </Link>
            ) : null}
            <Link className="tool-button" href="/saved" data-tooltip="Rute tersimpan">
              <Icon name="bookmark" />
            </Link>
            <button className="primary-button" onClick={openCreateDrawer}>
              <Icon name="plus" />
              <span>Buat Itinerary</span>
            </button>
            {currentUser ? (
              <>
                <form action="/api/auth/logout" method="post">
                  <button className="ghost-chip" type="submit">
                    Logout
                  </button>
                </form>
                <Link className="avatar-button" href={`/profile/${currentUser.username ?? currentUser.id}`} aria-label="Profil" style={{ display: "inline-flex", position: "relative", overflow: "visible", border: currentUser.isPro ? "2px solid #ffb700" : "2px solid #fff" }}>
                  <img src={currentUser.avatarUrl ?? "/uploads/default-avatar.svg"} alt={currentUser.name ?? currentUser.email} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  {currentUser.isPro && (
                    <span className="pro-badge" style={{
                      fontSize: "7px",
                      fontWeight: 950,
                      color: "#111",
                      background: "linear-gradient(135deg, #ffd700, #ffa500)",
                      padding: "1px 4px",
                      borderRadius: "3px",
                      border: "1px solid #ffb700",
                      textTransform: "uppercase",
                      position: "absolute",
                      bottom: "-4px",
                      right: "-6px",
                      lineHeight: "1",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
                    }}>
                      PRO
                    </span>
                  )}
                </Link>
              </>
            ) : (
              <Link className="mini-button" href="/login">
                Login
              </Link>
            )}
          </nav>
        </header>

        {current ? (
          <main className="workspace">
            <section className="main-column">


              <section className="post-card">
                <div className="post-header">
                  <div className="post-user">
                    <img src={current.author.avatarUrl ?? "/uploads/default-avatar.svg"} alt={current.author.name ?? current.author.email} />
                    <div>
                      <strong style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        {current.author.name ?? current.author.username ?? current.author.email}
                        {current.author.isPro && (
                          <span className="pro-badge" style={{
                            fontSize: "9px",
                            fontWeight: 850,
                            color: "#111",
                            background: "linear-gradient(135deg, #ffd700, #ffa500)",
                            padding: "1px 6px",
                            borderRadius: "999px",
                            border: "1px solid #ffb700",
                            textTransform: "uppercase",
                            display: "inline-flex",
                            alignItems: "center",
                            lineHeight: "1.2"
                          }}>
                            PRO
                          </span>
                        )}
                      </strong>
                      <span>
                        {current.destination} · {current.travelStyle}
                      </span>
                    </div>
                  </div>
                  <div className="post-tools">
                    {currentUser && (current.author.id === currentUser.id || currentUser.role === "ADMIN") ? (
                      <button className="ghost-chip" onClick={() => openEditDrawer(current)}>
                        <Icon name="grid" />
                        <span>Edit</span>
                      </button>
                    ) : null}
                    <button className="ghost-chip" onClick={() => openRemixDrawer(current)}>
                      <Icon name="plus" />
                      <span>Remix</span>
                    </button>
                  </div>
                </div>

                <section className="hero-card">
                  <img src={current.coverImageUrl} alt={current.destination} />
                  <div className="hero-overlay">
                    <p>{current.destination}</p>
                    <h1>{current.title}</h1>
                    <div className="creator-line" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <img src={current.author.avatarUrl ?? "/uploads/default-avatar.svg"} alt={current.author.name ?? current.author.email} />
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        {current.author.name ?? current.author.username ?? current.author.email}
                        {current.author.isPro && (
                          <span className="pro-badge" style={{
                            fontSize: "9px",
                            fontWeight: 850,
                            color: "#111",
                            background: "linear-gradient(135deg, #ffd700, #ffa500)",
                            padding: "1px 6px",
                            borderRadius: "999px",
                            border: "1px solid #ffb700",
                            textTransform: "uppercase",
                            display: "inline-flex",
                            alignItems: "center",
                            lineHeight: "1.2"
                          }}>
                            PRO
                          </span>
                        )}
                      </span>
                    </div>
                    {!current.isPublished && (
                      <div className="remix-badge" style={{ marginTop: "12px", display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(229, 62, 62, 0.85)", padding: "5px 12px", borderRadius: "12px", fontSize: "11px", color: "#ffffff", fontWeight: 700, border: "1px solid rgba(255, 255, 255, 0.15)", marginRight: "8px" }}>
                        <Icon name="shield" />
                        <span>Itinerary Privat</span>
                      </div>
                    )}
                    {current.originalItinerary && (
                      <div className="remix-badge" style={{ marginTop: "12px", display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(23, 33, 43, 0.82)", padding: "5px 12px", borderRadius: "12px", fontSize: "11px", color: "#f7fafc", fontWeight: 700, border: "1px solid rgba(255, 255, 255, 0.15)" }}>
                        <Icon name="copy" />
                        <span>
                          Remix dari <Link href={`/itinerary/${current.originalItinerary.id}`} style={{ color: "#ffffff", textDecoration: "underline", fontWeight: 800 }}>{current.originalItinerary.title}</Link> oleh <Link href={`/profile/${current.originalItinerary.author.username ?? current.originalItinerary.author.id}`} style={{ color: "#ffffff", textDecoration: "underline", fontWeight: 800 }}>@{current.originalItinerary.author.username ?? "creator"}</Link>
                        </span>
                      </div>
                    )}
                  </div>
                </section>

                <section className="action-row" aria-label="Aksi itinerary">
                  <div className="action-cluster">
                     {currentUser && (current.author.id === currentUser.id || currentUser.role === "ADMIN") ? (
                    null
                  ) : <div><button className={`icon-action ${liked.includes(current.id) ? "active" : ""}`} onClick={toggleLike} aria-label="Suka itinerary">
                      <Icon name="heart" />
                    </button>
                    <button className={`icon-action ${saved.includes(current.id) ? "active" : ""}`} onClick={toggleSave} aria-label="Simpan itinerary">
                      <Icon name="bookmark" />
                    </button>
                    <button className="icon-action" onClick={cloneItinerary} aria-label="Clone itinerary">
                      <Icon name="copy" />
                    </button>
                    </div>}
                   
                    <button
                      className="icon-action"
                      onClick={() => {
                        navigator.clipboard?.writeText(`${location.origin}/itinerary/${current.id}`);
                        flash("Tautan itinerary berhasil disalin.");
                      }}
                      aria-label="Bagikan itinerary"
                    >
                      <Icon name="share" />
                    </button>
                  </div>

                  {currentUser && (current.author.id === currentUser.id || currentUser.role === "ADMIN") ? (
                    null
                  ) : <button className="ghost-chip" onClick={cloneItinerary}>
                    <span>Jalanin Rute Ini</span>
                  </button>}

                </section>

                <section className="engagement-bar" aria-label="Stat interaksi">
                  <strong>
                    {formatCompact(current.likesCount)} suka · {formatCompact(current.savesCount)} simpan · {formatCompact(current.copiesCount)} remix
                  </strong>
                  <span>
                    {current.durationDays} hari · {formatRupiah(current.estimatedBudget)}
                  </span>
                </section>

                <section className="caption-block">
                  <p>
                    <strong>{current.author.username ?? "jalanin"}</strong> {current.description}
                  </p>
                  <div className="caption-tags">
                    {[current.travelStyle, current.destination.split(",")[0], `${current.durationDays} hari`].map((tag) => (
                      <span key={tag}>#{tag.replaceAll(" ", "").toLowerCase()}</span>
                    ))}
                  </div>
                </section>

                <section className="quick-meta" aria-label="Ringkasan itinerary">
                  <span className="meta-item">
                    <Icon name="calendar" />
                    <span>
                      Durasi <strong>{current.durationDays} hari</strong>
                    </span>
                  </span>
                  <span className="meta-item">
                    <Icon name="wallet" />
                    <span>
                      Estimasi <strong>{formatRupiah(current.estimatedBudget)}</strong>
                    </span>
                  </span>
                  <span className="meta-item">
                    <Icon name="route" />
                    <span>
                      Per hari <strong>{formatRupiah(Math.round(current.estimatedBudget / current.durationDays))}</strong>
                    </span>
                  </span>
                  <span className="meta-item">
                    <Icon name="star" />
                    <span>
                      Style <strong>{current.travelStyle}</strong>
                    </span>
                  </span>
                </section>
              </section>

              <section className="tabs" aria-label="Konten itinerary">
                {[
                  ["days", "calendar", "Hari demi Hari"],
                  ["map", "route", "Peta"],
                ].map(([value, icon, label]) => (
                  <button key={value} className={`tab ${tab === value ? "active" : ""}`} onClick={() => setTab(value as typeof tab)}>
                    <Icon name={icon} />
                    {label}
                  </button>
                ))}
              </section>

              <section className="tab-panel">

                {tab === "days" && currentDay && (
                  <>
                    <div className="day-title">
                      <h2>{currentDay.title}</h2>
                      <div className="day-switcher">
                        {current.days.map((day, index) => (
                          <button key={day.id} className={index === dayIndex ? "active" : ""} onClick={() => setDayIndex(index)}>
                            {day.dayNumber}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="timeline">
                      {currentDay.activities.map((activity) => (
                        <article className="activity-card" key={activity.id}>
                          <div className="activity-time">{activity.time}</div>
                          <div className="activity-icon">
                            <Icon name={activityIcon(activity.category)} />
                          </div>
                          <div className="activity-main">
                            <strong>{activity.title}</strong>
                            <span>
                              {activity.category}
                              {activity.locationName ? ` · ${activity.locationName}` : ""}
                            </span>
                            {activity.affiliateLink && (
                              <div style={{ marginTop: "8px" }}>
                                <a
                                  href={activity.affiliateLink.actualUrl}
                                  target="_blank"
                                  rel="noopener noreferrer nofollow"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "6px 12px",
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    color: "#fff",
                                    background: activity.affiliateLink.provider === "Klook"
                                      ? "#ff5e00"
                                      : activity.affiliateLink.provider === "Agoda"
                                        ? "#0096ff"
                                        : activity.affiliateLink.provider === "Traveloka"
                                          ? "#0194f3"
                                          : activity.affiliateLink.provider === "Tiket.com"
                                            ? "#0053b3"
                                            : "var(--text, #111)",
                                    borderRadius: "16px",
                                    textDecoration: "none",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                                  }}
                                  className="affiliate-cta"
                                >
                                  <Icon name="link" />
                                  <span>Pesan via {activity.affiliateLink.provider}</span>
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="activity-cost">{activity.estimatedCost ? formatRupiah(activity.estimatedCost) : "Gratis"}</div>
                        </article>
                      ))}
                    </div>
                  </>
                )}

                {tab === "map" && currentDay && (
                  <>
                    <div className="day-title">
                      <h2>Peta {currentDay.title}</h2>
                      <div className="day-switcher">
                        {current.days.map((day, index) => (
                          <button key={day.id} className={index === dayIndex ? "active" : ""} onClick={() => setDayIndex(index)}>
                            {day.dayNumber}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="route-board">
                      <RouteMap activities={currentDay.activities} />
                      <div className="route-list">
                        {currentDay.activities.map((activity, index) => (
                          <article className="route-step" key={activity.id}>
                            <span>{index + 1}</span>
                            <div>
                              <strong>{activity.title}</strong>
                              <small>
                                {activity.time} - {activity.locationName || activity.category}
                              </small>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </section>
            </section>

            <aside className="sidebar">


              <section className="side-card budget-card">
                <div className="side-heading">
                  <h2>Trip Insights</h2>
                  <span>{current.travelStyle}</span>
                </div>
                <div className="budget-total">
                  <span>{tripInsights?.activityTotal ? "Total aktivitas" : "Estimasi budget"}</span>
                  <strong>{formatRupiah(tripInsights?.activityTotal ? tripInsights.activityTotal : current.estimatedBudget)}</strong>
                </div>
                {tripInsights?.activityTotal && tripInsights.activityTotal !== current.estimatedBudget ? (
                  <p className="budget-note">Estimasi creator {formatRupiah(current.estimatedBudget)}</p>
                ) : null}
                <div className="budget-meter">
                  {tripInsights?.activityTotal ? (
                    tripInsights.lines
                      .filter((line) => line.total > 0)
                      .map((line) => (
                        <span
                          key={line.type}
                          style={{
                            width: `${(line.total / tripInsights.activityTotal) * 100}%`,
                            background: ACTIVITY_TYPE_COLORS[line.type],
                          }}
                        />
                      ))
                  ) : (
                    <span />
                  )}
                </div>
                <div className="budget-lines">
                  {ACTIVITY_TYPES.map((label) => {
                    const line = tripInsights?.lines.find((entry) => entry.type === label);
                    const total = line?.total ?? 0;
                    return (
                      <div className="budget-line" key={label}>
                        <Icon name={activityIcon(label)} />
                        <span>{label}</span>
                        <strong>{total ? formatRupiah(total) : "—"}</strong>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="side-card">
                <div className="side-heading">
                  <h2>Tag Trip</h2>
                </div>
                <div className="tag-list">
                  {[current.travelStyle, current.destination.split(",")[0], `${current.durationDays} hari`].map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </section>

              <section className="side-card author-card">
                <div className="side-heading">
                  <h2>Creator</h2>
                </div>
                <div className="author-row">
                  <img src={current.author.avatarUrl ?? "/uploads/default-avatar.svg"} alt={current.author.name ?? current.author.email} />
                  <div>
                    <strong style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      {current.author.name ?? current.author.username ?? current.author.email}
                      {current.author.isPro && (
                        <span className="pro-badge" style={{
                          fontSize: "9px",
                          fontWeight: 850,
                          color: "#111",
                          background: "linear-gradient(135deg, #ffd700, #ffa500)",
                          padding: "1px 6px",
                          borderRadius: "999px",
                          border: "1px solid #ffb700",
                          textTransform: "uppercase",
                          display: "inline-flex",
                          alignItems: "center",
                          lineHeight: "1.2"
                        }}>
                          PRO
                        </span>
                      )}
                    </strong>
                    <span>{current.author.bio ?? "Traveler Jalanin"}</span>
                  </div>
                  <Link className="mini-button" href={`/profile/${current.author.username ?? current.author.id}`}>
                    Profil
                  </Link>
                </div>
              </section>


              <section className="side-card saved-card">
                <div className="side-heading">
                  <h2>Itinerary Kamu</h2>
                  <span>{createdItems.length}</span>
                </div>
                <div className="compact-list">
                  {createdItems.length ? (
                    createdItems.map((item) => (
                      <button key={item.id} className="compact-item" onClick={() => setCurrentId(item.id)}>
                        <img src={item.coverImageUrl} alt={item.destination} />
                        <span>
                          <strong style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                            {item.title}
                            {!item.isPublished && (
                              <span style={{ fontSize: "9px", padding: "1px 5px", background: "rgba(229, 62, 62, 0.15)", color: "#e53e3e", borderRadius: "4px", fontWeight: 800 }}>Privat</span>
                            )}
                          </strong>
                          <span>
                            {item.durationDays} hari - {formatRupiah(item.estimatedBudget)}
                          </span>
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="empty-state">Belum ada itinerary yang dibuat. Buat itinerary pertamamu sekarang.</div>
                  )}
                </div>
              </section>
            </aside>

            <section className="feed-section" id="exploreSection">
              <div className="section-heading">
                <div>
                  <p>Jelajah itinerary</p>
                  <h2>Rute populer minggu ini</h2>
                </div>
                <div className="filter-chips">
                  {filters.map((category) => (
                    <button
                      key={category}
                      className={`chip ${filter === category ? "active" : ""}`}
                      onClick={() => setFilter(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="feed-grid">
                {filteredItems.length ? (
                  filteredItems.map((item, index) => {
                    const isLarge = index % 10 === 2 || index % 10 === 7;
                    return (
                      <article key={item.id} className={`feed-card ${isLarge ? "large" : ""}`}>
                        <button onClick={() => {
                          setCurrentId(item.id);
                          setDayIndex(0);
                          setTab("days");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}>
                          <img src={item.coverImageUrl} alt={item.destination} />
                          <div className="feed-card-overlay">
                            <div className="feed-card-overlay-top">
                              <p className="feed-card-destination">{item.destination}</p>
                              <h3 className="feed-card-title">{item.title}</h3>
                            </div>
                            <div className="feed-card-overlay-bottom">
                              <div className="feed-card-metrics-main">
                                <span>
                                  <Icon name="calendar" /> {item.durationDays} hari
                                </span>
                                <span>
                                  <Icon name="wallet" /> {formatRupiah(item.estimatedBudget)}
                                </span>
                              </div>
                              <div className="feed-card-engagement-stats">
                                <span>
                                  <Icon name="heart" /> {formatCompact(item.likesCount)}
                                </span>
                                <span>
                                  <Icon name="bookmark" /> {formatCompact(item.savesCount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      </article>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    Tidak ada itinerary yang cocok dengan pencarian ini.
                  </div>
                )}
              </div>
            </section>
          </main>
        ) : (
          <main className="workspace empty-workspace">
            <section className="empty-itinerary-panel">
              <span className="summary-icon">
                <Icon name="route" />
              </span>
              <h1>Belum ada itinerary.</h1>
              <p>{currentUser ? "Buat itinerary pertama supaya traveler lain bisa mulai menjelajah." : "Login untuk membuat itinerary pertama."}</p>
              <div className="empty-itinerary-actions">
                {currentUser ? (
                  <button className="primary-button" onClick={openCreateDrawer}>
                    <Icon name="plus" />
                    <span>Buat Itinerary</span>
                  </button>
                ) : (
                  <Link className="primary-button" href="/login">
                    Login
                  </Link>
                )}
                <Link className="mini-button muted" href="/">
                  Kembali ke beranda
                </Link>
              </div>
            </section>
          </main>
        )}
      </div>

      <section className={`drawer ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen} aria-label="Form itinerary">
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
        <div className="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="drawerTitle">
          <div className="drawer-header">
            <div>
              <p>Itinerary pribadi</p>
              <h2 id="drawerTitle">{isEditing ? "Edit Itinerary" : cloneSource ? "Remix Itinerary" : "Buat Itinerary"}</h2>
            </div>
            <button className="tool-button" onClick={() => setDrawerOpen(false)} aria-label="Tutup">
              <Icon name="x" />
            </button>
          </div>
          <form className="itinerary-form" onSubmit={submitCreate} key={`${isEditing ? "edit" : cloneSource ? "remix" : "create"}-${formSource?.id ?? "new"}`}>
            <label>
              <span>Judul itinerary</span>
              <input name="title" required defaultValue={isEditing ? editSource?.title : cloneSource ? `${cloneSource.title} (Versi Saya)` : ""} />
            </label>
            <div className="form-grid">
              <label>
                <span>Destinasi utama</span>
                <input name="destination" required defaultValue={formSource?.destination ?? ""} />
              </label>
              <label>
                <span>Durasi</span>
                <input name="durationDays" type="number" min="1" max="5" required defaultValue={formSource?.durationDays ?? 1} />
              </label>
            </div>
            <label>
              <span>Cover image upload</span>
              <input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" />
            </label>
            <input type="hidden" name="coverImageUrl" defaultValue={isEditing ? editSource?.coverImageUrl : "/uploads/default-cover.svg"} />
            {cloneSource && (
              <input type="hidden" name="originalItineraryId" defaultValue={cloneSource.id} />
            )}
            <div className="form-grid">
              <label>
                <span>Estimasi budget</span>
                <PriceInput
                  name="estimatedBudget"
                  required
                  value={estimatedBudgetDraft}
                  onChange={setEstimatedBudgetDraft}
                  placeholder="1.500.000"
                />
              </label>
              <label>
                <span>Travel style</span>
                <select name="travelStyle" defaultValue={formSource?.travelStyle ?? "Choose your style"} required>
                  <option value="Choose your style" disabled>
                    Choose your style
                  </option>
                  <option>Random</option>
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
              <select name="isPublished" defaultValue={formSource ? String(formSource.isPublished) : "true"}>
                <option value="true">Publik (Bisa dilihat semua orang, batas maks 5)</option>
                <option value="false">Privat (Hanya bisa dilihat oleh Anda, batas maks 2)</option>
              </select>
            </label>
            <label>
              <span>Deskripsi singkat</span>
              <textarea name="description" rows={4} required defaultValue={formSource?.description ?? ""} />
            </label>
            <label>
              <span>Catatan tambahan</span>
              <textarea name="notes" rows={3} defaultValue={formSource?.notes ?? ""} />
            </label>
            <input type="hidden" name="daysJson" value={JSON.stringify(dayDrafts)} readOnly />
            <section className="activity-builder">
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
              <div className="draft-day-tabs">
                {dayDrafts.map((day, index) => (
                  <button key={index} type="button" className={index === activeDraftDayIndex ? "active" : ""} onClick={() => setActiveDraftDayIndex(index)}>
                    {index + 1}
                    <span>{day.activities.length}</span>
                  </button>
                ))}
              </div>
              {activeDraftDay ? (
                <section className="draft-day-panel">
                  <div className="draft-day-header">
                    <label>
                      <span>Nama hari</span>
                      <input value={activeDraftDay.title} onChange={(event) => updateDayTitle(activeDraftDayIndex, event.target.value)} placeholder={`Hari ${activeDraftDayIndex + 1}`} />
                    </label>
                    {dayDrafts.length > 1 ? (
                      <button className="mini-button muted" type="button" onClick={() => removeDay(activeDraftDayIndex)}>
                        Hapus hari
                      </button>
                    ) : null}
                  </div>
                  <div className="activity-builder-head-white-text compact-head ">
                    <span>Aktivitas {activeDraftDay.title || `Hari ${activeDraftDayIndex + 1}`}</span>
                    <button className="mini-button" type="button" onClick={() => addActivity(activeDraftDayIndex)}>
                      <Icon name="plus" />
                      <span className="">Aktivitas</span>
                    </button>
                  </div>
                  {activeDraftDay.activities.map((activity, index) => {
                    const key = draftKey(activeDraftDayIndex, index);
                    return (
                      <article className="activity-input-card" key={key}>
                        <div className="activity-input-top">
                          <span>{index + 1}</span>
                          {activeDraftDay.activities.length > 1 ? (
                            <button className="tool-button" type="button" onClick={() => removeActivity(activeDraftDayIndex, index)} aria-label="Hapus aktivitas">
                              <Icon name="x" />
                            </button>
                          ) : null}
                        </div>
                        <div className="form-grid compact">
                          <label>
                            <span>Waktu</span>
                            <TimeInput value={activity.time} onChange={(time) => updateActivity(activeDraftDayIndex, index, { time })} />
                          </label>
                          <label>
                            <span>Nama aktivitas</span>
                            <input value={activity.title} onChange={(event) => updateActivity(activeDraftDayIndex, index, { title: event.target.value })} placeholder="Makan siang lokal" />
                          </label>
                        </div>
                        <div className="form-grid compact">
                          <label>
                            <span>Tipe aktivitas</span>
                            <select value={activity.category} onChange={(event) => updateActivity(activeDraftDayIndex, index, { category: event.target.value })}>
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
                              onChange={(estimatedCost) => updateActivity(activeDraftDayIndex, index, { estimatedCost })}
                              placeholder="350.000"
                            />
                          </label>
                        </div>
                        <label>
                          <span>Lokasi</span>
                          <div className="location-search-row">
                            <input
                              value={locationQueries[key] ?? ""}
                              onChange={(event) => setLocationQueries((previous) => ({ ...previous, [key]: event.target.value }))}
                              placeholder="Tempel link Google Maps"
                            />
                            <button className="mini-button" type="button" onClick={() => searchLocation(activeDraftDayIndex, index)} disabled={searchingLocation === key}>
                              <Icon name="search" />
                              <span>{searchingLocation === key ? "Cari..." : "Cari"}</span>
                            </button>
                          </div>
                        </label>
                        {locationResults[key]?.length ? (
                          <div className="location-results">
                            {locationResults[key].map((result) => (
                              <button key={`${result.placeId}-${result.latitude}-${result.longitude}`} type="button" onClick={() => selectLocation(activeDraftDayIndex, index, result)}>
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
                          <PointPicker value={{ latitude: activity.latitude, longitude: activity.longitude }} onPick={(point) => pickManualPoint(activeDraftDayIndex, index, point)} />
                        ) : null}
                        <label style={{ marginTop: "12px", display: "block" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span>Sematkan Link Affiliate</span>
                            <a href="/settings/affiliate" target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "var(--blue)", fontWeight: 700 }}>
                              Kelola Link &rarr;
                            </a>
                          </div>
                          <select
                            value={activity.affiliateLinkId || ""}
                            onChange={(event) => updateActivity(activeDraftDayIndex, index, { affiliateLinkId: event.target.value || null })}
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface)" }}
                          >
                            <option value="">-- Tidak Ada --</option>
                            {userAffiliateLinks.map((link) => (
                              <option key={link.id} value={link.id}>
                                [{link.provider}] {link.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        {activity.affiliateLinkId && (
                          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px", wordBreak: "break-all" }}>
                            Tautan terpilih: <strong>{userAffiliateLinks.find(l => l.id === activity.affiliateLinkId)?.label || "Memuat..."}</strong>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </section>
              ) : null}
            </section>
            <button className="primary-button wide" type="submit">
              <Icon name="plus" />
              <span>{isEditing ? "Simpan Perubahan" : "Publish Itinerary"}</span>
            </button>
          </form>
        </div>
      </section>

      <nav className="mobile-nav" aria-label="Navigasi mobile">
        <button onClick={() => document.querySelector(".feed-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          <Icon name="compass" />
          <span>Jelajah</span>
        </button>
        <Link href="/saved">
          <Icon name="bookmark" />
          <span>Simpan</span>
        </Link>
        <button onClick={openCreateDrawer}>
          <Icon name="plus" />
          <span>Buat</span>
        </button>
        <Link href={currentUser ? `/profile/${currentUser.username ?? currentUser.id}` : "/login"}>
          <Icon name="user" />
          <span>Profil</span>
        </Link>
        {currentUser ? (
          <form action="/api/auth/logout" method="post" className="mobile-logout-form">
            <button type="submit">
              <Icon name="x" />
              <span>Logout</span>
            </button>
          </form>
        ) : null}
      </nav>

      <div className={`toast ${toast ? "show" : ""}`} role="status">
        {toast}
      </div>

      {showCoverModal && (
        <div className="modal-overlay" onClick={() => setShowCoverModal(false)}>
          <div className="modal-content cover-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCoverModal(false)} aria-label="Tutup">
              <Icon name="x" />
            </button>
            <img src={current.coverImageUrl} alt={current.destination} className="modal-image" />
          </div>
        </div>
      )}

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
