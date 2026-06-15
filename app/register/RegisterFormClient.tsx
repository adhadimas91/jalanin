"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

interface Props {
  whitelist: string;
}

export default function RegisterFormClient({ whitelist }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const allowedDomains = whitelist.split(",").map((d: string) => d.trim().toLowerCase());

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);

    if (!val) {
      setError("");
      return;
    }

    // Basic email format check before domain validation
    if (!val.includes("@")) {
      setError("");
      return;
    }

    const domain = val.split("@")[1]?.toLowerCase();
    if (domain) {
      if (!allowedDomains.includes(domain)) {
        setError(`Domain email "${domain}" tidak diperbolehkan. Gunakan: ${allowedDomains.join(", ")}`);
      } else {
        setError("");
      }
    } else {
      setError("");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const domain = email.split("@")[1]?.toLowerCase();
    trackEvent("register_submit_attempt", { email_domain: domain });
    if (!domain || !allowedDomains.includes(domain)) {
      e.preventDefault();
      trackEvent("register_validation_failed", { reason: "invalid_domain", email_domain: domain });
      setError(`Domain email tidak diperbolehkan. Gunakan: ${allowedDomains.join(", ")}`);
    }
  };

  return (
    <form action="/api/auth/register" method="post" onSubmit={handleSubmit}>
      <label>
        Nama
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <label>
        Email
        <input
          name="email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          required
        />
        {error && (
          <span style={{ color: "#e53e3e", fontSize: "12px", marginTop: "4px", fontWeight: "600" }}>
            {error}
          </span>
        )}
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      <button
        className="primary-button wide"
        type="submit"
        disabled={!!error}
        style={error ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
      >
        Daftar
      </button>
    </form>
  );
}
