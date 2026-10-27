"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Icon } from "@/components/icon-sprite";
import { formatRupiah } from "@/lib/format";

export type RouteActivityItem = {
  id: string;
  time: string;
  title: string;
  locationName?: string | null;
  formattedAddress?: string | null;
  latitude: number | null;
  longitude: number | null;
  category: string;
  estimatedCost?: number | null;
  myLink?: {
    actualUrl: string;
    provider: string;
  } | null;
};

interface ItineraryRouteBoardProps {
  activities: RouteActivityItem[];
}

const defaultMapCenter: [number, number] = [106.8272, -6.1754];
const mapStyleUrl = "https://tiles.openfreemap.org/styles/liberty";

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildPopupHtml(activity: RouteActivityItem, stepNumber: number): string {
  const title = escapeHtml(activity.title);
  const time = escapeHtml(activity.time);
  const category = escapeHtml(activity.category);
  const location = escapeHtml(activity.locationName || activity.formattedAddress || "");
  const cost =
    typeof activity.estimatedCost === "number" && activity.estimatedCost > 0
      ? formatRupiah(activity.estimatedCost)
      : "Gratis";

  let myLinkHtml = "";
  if (activity.myLink && activity.myLink.actualUrl) {
    const provider = escapeHtml(activity.myLink.provider || "Partner");
    const bg =
      activity.myLink.provider === "Klook"
        ? "#ee6b5e"
        : activity.myLink.provider === "Agoda"
        ? "#2563eb"
        : activity.myLink.provider === "Traveloka"
        ? "#0284c7"
        : activity.myLink.provider === "Tiket.com"
        ? "#f59e0b"
        : "#6366f1";
    myLinkHtml = `
      <a href="${escapeHtml(activity.myLink.actualUrl)}" target="_blank" rel="noopener noreferrer nofollow" class="map-popup-btn-booking" style="background: ${bg};">
        Pesan via ${provider}
      </a>
    `;
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${activity.latitude},${activity.longitude}`;

  return `
    <div class="map-popup-card">
      <div class="map-popup-header">
        <span class="map-popup-badge">${stepNumber}</span>
        ${time ? `<span class="map-popup-time">⏰ ${time}</span>` : ""}
        ${category ? `<span class="map-popup-category">${category}</span>` : ""}
      </div>
      <h4 class="map-popup-title">${title}</h4>
      ${
        location
          ? `
        <div class="map-popup-location">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>${location}</span>
        </div>
      `
          : ""
      }
      <div class="map-popup-footer">
        <span class="map-popup-cost">${cost}</span>
        <div class="map-popup-actions">
          ${myLinkHtml}
          <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="map-popup-btn-maps" title="Buka di Google Maps">
            Maps ↗
          </a>
        </div>
      </div>
    </div>
  `;
}

export function ItineraryRouteBoard({ activities }: ItineraryRouteBoardProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLElement }>>(new Map());
  const popupsRef = useRef<Map<string, maplibregl.Popup>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filter activities that have valid latitude & longitude, paired with their 1-based order in the day
  const pointsWithIndex = useMemo(() => {
    return activities
      .map((activity, index) => ({
        activity,
        stepNumber: index + 1,
      }))
      .filter(
        (
          item
        ): item is {
          activity: RouteActivityItem & { latitude: number; longitude: number };
          stepNumber: number;
        } =>
          typeof item.activity.latitude === "number" &&
          typeof item.activity.longitude === "number"
      );
  }, [activities]);

  const fitAllBounds = () => {
    const map = mapInstanceRef.current;
    if (!map || pointsWithIndex.length === 0) return;

    if (pointsWithIndex.length === 1) {
      map.flyTo({
        center: [pointsWithIndex[0].activity.longitude, pointsWithIndex[0].activity.latitude],
        zoom: 14,
        essential: true,
      });
      return;
    }

    const coordinates: [number, number][] = pointsWithIndex.map((p) => [
      p.activity.longitude,
      p.activity.latitude,
    ]);
    const bounds = coordinates.reduce(
      (acc, coord) => acc.extend(coord),
      new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
    );
    map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    setSelectedId(null);
    markersRef.current.clear();
    popupsRef.current.clear();

    const center: [number, number] = pointsWithIndex[0]
      ? [pointsWithIndex[0].activity.longitude, pointsWithIndex[0].activity.latitude]
      : defaultMapCenter;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyleUrl,
      center,
      zoom: pointsWithIndex.length ? 12 : 10,
      scrollZoom: true,
    });

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    // Zoom controls: NavigationControl adds zoom in (+) and zoom out (-) buttons
    const navControl = new maplibregl.NavigationControl({
      showCompass: true,
      showZoom: true,
      visualizePitch: false,
    });
    map.addControl(navControl, "top-right");

    mapInstanceRef.current = map;

    map.on("load", () => {
      // 1. Create markers & popups
      pointsWithIndex.forEach(({ activity, stepNumber }) => {
        const markerEl = document.createElement("button");
        markerEl.type = "button";
        markerEl.className = "route-marker";
        markerEl.textContent = String(stepNumber);
        markerEl.setAttribute("aria-label", `Titik ${stepNumber}: ${activity.title}`);

        const popup = new maplibregl.Popup({
          offset: 20,
          closeButton: true,
          closeOnClick: false,
          className: "itinerary-map-popup",
          maxWidth: "300px",
        })
          .setLngLat([activity.longitude, activity.latitude])
          .setHTML(buildPopupHtml(activity, stepNumber));

        popup.on("close", () => {
          markerEl.classList.remove("active");
          setSelectedId((prev) => (prev === activity.id ? null : prev));
        });

        // Add marker to map
        const marker = new maplibregl.Marker({ element: markerEl })
          .setLngLat([activity.longitude, activity.latitude])
          .addTo(map);

        markersRef.current.set(activity.id, { marker, el: markerEl });
        popupsRef.current.set(activity.id, popup);

        // Marker click event: toggle popup, close other popups, and highlight/scroll list
        markerEl.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();

          const isAlreadyOpen = popup.isOpen();

          // Close all open popups
          popupsRef.current.forEach((otherPopup) => {
            if (otherPopup.isOpen()) {
              otherPopup.remove();
            }
          });

          if (isAlreadyOpen) {
            setSelectedId(null);
          } else {
            popup.setLngLat([activity.longitude, activity.latitude]).addTo(map);
            setSelectedId(activity.id);

            const itemEl = document.getElementById(`route-step-${activity.id}`);
            itemEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        });
      });

      // Map canvas click closes popups
      map.on("click", (e) => {
        const target = e.originalEvent.target as HTMLElement | null;
        if (target && (target.tagName === "CANVAS" || target.classList.contains("maplibregl-canvas"))) {
          popupsRef.current.forEach((p) => {
            if (p.isOpen()) p.remove();
          });
          setSelectedId(null);
        }
      });

      // 2. Add route line if 2 or more points
      if (pointsWithIndex.length > 1) {
        const coordinates: [number, number][] = pointsWithIndex.map((p) => [
          p.activity.longitude,
          p.activity.latitude,
        ]);

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
            "line-opacity": 0.85,
          },
        });

        // Fit map bounds to view all route points
        const bounds = coordinates.reduce(
          (acc, coord) => acc.extend(coord),
          new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
        );
        map.fitBounds(bounds, { padding: 48, maxZoom: 15 });
      }
    });

    return () => {
      mapInstanceRef.current = null;
      map.remove();
    };
  }, [pointsWithIndex]);

  // Sync selectedId with marker active classes
  useEffect(() => {
    markersRef.current.forEach(({ el }, id) => {
      if (id === selectedId) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });
  }, [selectedId]);

  // Click on list item: map auto focuses to the item, opens popup, and sets active
  const handleSelectActivity = (activity: RouteActivityItem) => {
    setSelectedId(activity.id);

    if (typeof activity.latitude === "number" && typeof activity.longitude === "number") {
      const map = mapInstanceRef.current;
      if (map) {
        map.flyTo({
          center: [activity.longitude, activity.latitude],
          zoom: Math.max(map.getZoom(), 15),
          essential: true,
          duration: 800,
        });

        // Close other popups
        popupsRef.current.forEach((popup, id) => {
          if (id !== activity.id && popup.isOpen()) {
            popup.remove();
          }
        });

        // Open this activity's popup
        const targetPopup = popupsRef.current.get(activity.id);
        if (targetPopup) {
          targetPopup.setLngLat([activity.longitude, activity.latitude]);
          if (!targetPopup.isOpen()) {
            targetPopup.addTo(map);
          }
        }
      }

      // If mobile screen, bring map into view smoothly
      if (typeof window !== "undefined" && window.innerWidth <= 768) {
        mapContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  };

  return (
    <div className="route-board">
      <div className="route-map-wrap">
        <div className="real-map" ref={mapContainerRef} />
        {pointsWithIndex.length > 1 && (
          <button
            type="button"
            className="map-fit-bounds-btn"
            title="Lihat semua titik rute hari ini"
            onClick={fitAllBounds}
          >
            <Icon name="route" />
            <span>Lihat Semua</span>
          </button>
        )}
        {!pointsWithIndex.length && (
          <div className="map-empty">Belum ada titik koordinat lokasi di hari ini.</div>
        )}
      </div>

      <div className="route-list" role="list" aria-label="Daftar rute aktivitas">
        {activities.map((activity, index) => {
          const hasCoords =
            typeof activity.latitude === "number" && typeof activity.longitude === "number";
          const isSelected = selectedId === activity.id;

          return (
            <button
              key={activity.id}
              id={`route-step-${activity.id}`}
              type="button"
              className={`route-step route-step-btn ${isSelected ? "active" : ""}`}
              onClick={() => handleSelectActivity(activity)}
              title={hasCoords ? "Klik untuk fokus pada peta" : "Aktivitas belum memiliki koordinat"}
            >
              <span className="step-number">{index + 1}</span>
              <div className="step-content">
                <div className="step-title-row">
                  <strong>{activity.title}</strong>
                  {hasCoords && (
                    <span className="route-step-pin-indicator" title="Tersedia di peta">
                      <Icon name="route" />
                    </span>
                  )}
                </div>
                <small>
                  {activity.time ? `${activity.time} · ` : ""}
                  {activity.locationName || activity.formattedAddress || activity.category}
                </small>
                {activity.estimatedCost ? (
                  <div className="step-cost">{formatRupiah(activity.estimatedCost)}</div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
