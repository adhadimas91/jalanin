"use client";

import { useState } from "react";
import Link from "next/link";
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
    label?: string;
  } | null;
  myLinks?: Array<{
    id?: string;
    actualUrl: string;
    provider: string;
    label?: string;
  }>;
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

import { ItineraryRouteBoard } from "@/components/itinerary-route-board";

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
                    {(() => {
                      const links =
                        activity.myLinks && activity.myLinks.length > 0
                          ? activity.myLinks
                          : activity.myLink
                            ? [activity.myLink]
                            : [];
                      if (!links.length) return null;
                      return (
                        <div
                          className="activity-mylink-section"
                          style={{
                            marginTop: "12px",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          {links.map((link, linkIdx) => {
                            const providerColor =
                              link.provider === "Klook"
                                ? "var(--orange)"
                                : link.provider === "Agoda"
                                  ? "var(--blue)"
                                  : link.provider === "Traveloka"
                                    ? "var(--sky)"
                                    : link.provider === "Tiket.com"
                                      ? "var(--yellow)"
                                      : "var(--indigo)";
                            const labelText = link.label
                              ? link.label.toLowerCase().includes((link.provider || "").toLowerCase())
                                ? link.label
                                : `${link.label} (${link.provider})`
                              : `Pesan via ${link.provider}`;
                            return (
                              <a
                                key={(link as any).id || linkIdx}
                                href={link.actualUrl}
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
                                  background: providerColor,
                                  textDecoration: "none",
                                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                                }}
                                className="mylink-cta"
                                title={link.label || `Pesan via ${link.provider}`}
                              >
                                <Icon name="route" />
                                <span>{labelText}</span>
                              </a>
                            );
                          })}
                        </div>
                      );
                    })()}
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
            <ItineraryRouteBoard activities={currentDay.activities} />
          </>
        )}
      </section>
    </>
  );
}
