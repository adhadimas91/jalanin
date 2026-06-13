"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Icon } from "@/components/icon-sprite";
import { formatRupiah } from "@/lib/format";
import { activityIcon } from "@/lib/activity-types";

type SerializedActivity = {
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
  myLinkId: string | null;
  myLink: {
    actualUrl: string;
    provider: string;
  } | null;
};

type SerializedDay = {
  id: string;
  dayNumber: number;
  title: string;
  activities: SerializedActivity[];
};

type SerializedItinerary = {
  id: string;
  title: string;
  destination: string;
  description: string;
  durationDays: number;
  estimatedBudget: number;
  travelStyle: string;
  coverImageUrl: string;
  notes: string | null;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    email: string;
    avatarUrl: string | null;
    bio: string | null;
    city: string | null;
  };
  days: SerializedDay[];
};

function RouteMap({ activities }: { activities: SerializedActivity[] }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const points = useMemo(() => {
    return activities.filter((activity) => typeof activity.latitude === "number" && typeof activity.longitude === "number") as Array<
      SerializedActivity & { latitude: number; longitude: number }
    >;
  }, [activities]);

  useEffect(() => {
    if (!mapRef.current) return;

    const defaultMapCenter: [number, number] = [106.8272, -6.1754];
    const mapStyleUrl = "https://tiles.openfreemap.org/styles/liberty";

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
          id: "route-line",
          type: "line",
          source: "activity-route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#ee6b5e",
            "line-width": 4.5,
          },
        });

        // Fit map bounds
        const bounds = coordinates.reduce(
          (acc, coord) => acc.extend(coord),
          new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
        );
        map.fitBounds(bounds, { padding: 40 });
      }
    });

    return () => {
      map.remove();
    };
  }, [points]);

  return (
    <div className="route-map-wrap">
      <div className="real-map" ref={mapRef} />
      {!points.length && <div className="map-empty">Belum ada titik koordinat lokasi di hari ini.</div>}
    </div>
  );
}

export function ItineraryInteractiveView({ itinerary }: { itinerary: SerializedItinerary }) {
  const [tab, setTab] = useState<"days" | "map">("days");
  const [dayIndex, setDayIndex] = useState(0);

  const currentDay = itinerary.days[dayIndex] ?? itinerary.days[0];

  return (
    <>
      <section className="tabs" aria-label="Konten itinerary" style={{ marginTop: 18 }}>
        <button className={`tab ${tab === "days" ? "active" : ""}`} onClick={() => setTab("days")}>
          <Icon name="calendar" />
          Hari demi Hari
        </button>
        <button className={`tab ${tab === "map" ? "active" : ""}`} onClick={() => setTab("map")}>
          <Icon name="route" />
          Peta
        </button>
      </section>

      <section className="tab-panel" style={{ marginTop: 14 }}>
        {tab === "days" && currentDay && (
          <>
            <div className="day-title">
              <h2>{currentDay.title}</h2>
              <div className="day-switcher">
                {itinerary.days.map((day, index) => (
                  <button
                    key={day.id}
                    className={index === dayIndex ? "active" : ""}
                    onClick={() => setDayIndex(index)}
                  >
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
                    {activity.myLink && (
                      <div className="activity-mylink-section" style={{ marginTop: "12px" }}>
                        <a
                          href={activity.myLink.actualUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 16px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: 800,
                            color: "white",
                            background: activity.myLink.provider === "Klook" 
                              ? "var(--orange)" 
                              : activity.myLink.provider === "Agoda"
                              ? "var(--blue)"
                              : activity.myLink.provider === "Traveloka"
                              ? "var(--sky)"
                              : activity.myLink.provider === "Tiket.com"
                              ? "var(--yellow)"
                              : "var(--indigo)",
                            textDecoration: "none",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                          }}
                          className="mylink-cta"
                        >
                          <Icon name="route" />
                          <span>Pesan via {activity.myLink.provider}</span>
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="activity-cost">
                    {activity.estimatedCost ? formatRupiah(activity.estimatedCost) : "Gratis"}
                  </div>
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
                {itinerary.days.map((day, index) => (
                  <button
                    key={day.id}
                    className={index === dayIndex ? "active" : ""}
                    onClick={() => setDayIndex(index)}
                  >
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
    </>
  );
}
