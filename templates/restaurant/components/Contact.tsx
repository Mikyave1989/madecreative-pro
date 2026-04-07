"use client";

import React, { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

export interface OpeningHours {
  day: string;
  hours: string;
  closed?: boolean;
}

export interface ContactProps {
  address: string;
  phone: string;
  email: string;
  googleMapsEmbedUrl?: string;
  openingHours?: OpeningHours[];
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    tripadvisor?: string;
  };
  onFormSubmit?: (data: ContactFormData) => Promise<void>;
  colors: {
    primary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  date: string;
  gdpr: boolean;
}

const defaultHours: OpeningHours[] = [
  { day: "Lunedì", hours: "Chiuso", closed: true },
  { day: "Martedì", hours: "12:00 – 15:00 / 19:00 – 23:00" },
  { day: "Mercoledì", hours: "12:00 – 15:00 / 19:00 – 23:00" },
  { day: "Giovedì", hours: "12:00 – 15:00 / 19:00 – 23:00" },
  { day: "Venerdì", hours: "12:00 – 15:00 / 19:00 – 23:30" },
  { day: "Sabato", hours: "12:00 – 15:30 / 19:00 – 23:30" },
  { day: "Domenica", hours: "12:00 – 16:00 / 19:00 – 22:30" },
];

const inputStyle = (focused: boolean, accent: string): React.CSSProperties => ({
  width: "100%",
  background: "transparent",
  border: "none",
  borderBottom: `1px solid ${focused ? accent : "rgba(26,18,8,0.2)"}`,
  borderRadius: 0,
  padding: "0.75rem 0",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "0.9rem",
  color: "#2d2419",
  outline: "none",
  transition: "border-color 0.2s ease",
  boxSizing: "border-box",
});

function InputField({
  label,
  type = "text",
  value,
  onChange,
  required,
  colors,
  textareaRows,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  colors: ContactProps["colors"];
  textareaRows?: number;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ position: "relative", marginBottom: "1.75rem" }}>
      <label
        style={{
          position: "absolute",
          top: focused || value ? "-0.9rem" : "0.75rem",
          left: 0,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: focused || value ? "0.7rem" : "0.85rem",
          color: focused ? colors.accent : "#6b5c42",
          letterSpacing: focused || value ? "0.1em" : "0",
          textTransform: focused || value ? "uppercase" : "none",
          transition: "all 0.2s ease",
          pointerEvents: "none",
        }}
      >
        {label}
        {required && " *"}
      </label>
      {textareaRows ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={textareaRows}
          required={required}
          style={{
            ...inputStyle(focused, colors.accent),
            resize: "none",
            marginTop: "0.25rem",
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          style={{
            ...inputStyle(focused, colors.accent),
            marginTop: "0.25rem",
          }}
        />
      )}
    </div>
  );
}

export function Contact({
  address,
  phone,
  email,
  googleMapsEmbedUrl,
  openingHours = defaultHours,
  socialLinks,
  onFormSubmit,
  colors,
}: ContactProps) {
  const [form, setForm] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    message: "",
    date: "",
    gdpr: false,
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  function validate(): boolean {
    const newErrors: Partial<Record<keyof ContactFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = "Il nome è obbligatorio";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Email non valida";
    if (!form.gdpr) newErrors.gdpr = "Devi accettare la privacy policy";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("sending");

    try {
      if (onFormSubmit) {
        await onFormSubmit(form);
      } else {
        await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setStatus("sent");
      setForm({ name: "", email: "", phone: "", message: "", date: "", gdpr: false });
    } catch {
      setStatus("error");
    }
  }

  const today = new Date().toISOString().split("T")[0] ?? "";

  return (
    <section
      ref={sectionRef}
      id="contatti"
      style={{
        background: colors.background,
        padding: "6rem 0",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.75rem",
              fontWeight: 500,
              color: colors.accent,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            Siamo qui per te
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.7 }}
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              fontWeight: 300,
              color: colors.primary,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Contatti & Prenotazioni
          </motion.h2>
        </div>

        {/* Split layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4rem",
            alignItems: "start",
          }}
        >
          {/* Left: Form */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h3
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.5rem",
                fontWeight: 400,
                color: colors.primary,
                marginBottom: "2rem",
              }}
            >
              Prenota un tavolo
            </h3>

            {status === "sent" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: "2rem",
                  background: `rgba(201,168,76,0.1)`,
                  border: `1px solid ${colors.accent}`,
                  borderRadius: "4px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "1.3rem",
                    color: colors.primary,
                    margin: "0 0 0.5rem",
                  }}
                >
                  Grazie per la tua richiesta!
                </p>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.9rem",
                    color: "#6b5c42",
                    margin: 0,
                  }}
                >
                  Ti contatteremo entro 24 ore per confermare la prenotazione.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <InputField
                  label="Nome e Cognome"
                  value={form.name}
                  onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                  required
                  colors={colors}
                />
                {errors.name && (
                  <p style={{ color: "#c0392b", fontSize: "0.75rem", marginTop: "-1.2rem", marginBottom: "1rem" }}>
                    {errors.name}
                  </p>
                )}

                <InputField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                  required
                  colors={colors}
                />
                {errors.email && (
                  <p style={{ color: "#c0392b", fontSize: "0.75rem", marginTop: "-1.2rem", marginBottom: "1rem" }}>
                    {errors.email}
                  </p>
                )}

                <InputField
                  label="Telefono"
                  type="tel"
                  value={form.phone}
                  onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                  colors={colors}
                />

                <InputField
                  label="Data prenotazione"
                  type="date"
                  value={form.date}
                  onChange={(v) => setForm((f) => ({ ...f, date: v }))}
                  colors={colors}
                />

                <InputField
                  label="Messaggio (n. persone, richieste speciali…)"
                  value={form.message}
                  onChange={(v) => setForm((f) => ({ ...f, message: v }))}
                  colors={colors}
                  textareaRows={3}
                />

                {/* GDPR */}
                <div style={{ marginBottom: "2rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <input
                    type="checkbox"
                    id="gdpr"
                    checked={form.gdpr}
                    onChange={(e) => setForm((f) => ({ ...f, gdpr: e.target.checked }))}
                    style={{ marginTop: "3px", accentColor: colors.accent, cursor: "pointer" }}
                  />
                  <label
                    htmlFor="gdpr"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.78rem",
                      color: "#6b5c42",
                      lineHeight: 1.5,
                      cursor: "pointer",
                    }}
                  >
                    Acconsento al trattamento dei dati personali ai sensi del GDPR (Regolamento EU 2016/679)
                    per la gestione della mia richiesta.{" "}
                    <a href="/privacy-policy" style={{ color: colors.accent, textDecoration: "underline" }}>
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {errors.gdpr && (
                  <p style={{ color: "#c0392b", fontSize: "0.75rem", marginTop: "-1.5rem", marginBottom: "1rem" }}>
                    {errors.gdpr}
                  </p>
                )}

                {status === "error" && (
                  <p style={{ color: "#c0392b", fontSize: "0.85rem", marginBottom: "1rem" }}>
                    Si è verificato un errore. Riprova o chiamaci direttamente.
                  </p>
                )}

                <motion.button
                  type="submit"
                  disabled={status === "sending"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    background: status === "sending" ? "#6b5c42" : colors.primary,
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "2px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    cursor: status === "sending" ? "wait" : "pointer",
                    transition: "background 0.2s ease",
                  }}
                >
                  {status === "sending" ? "Invio in corso…" : "Invia richiesta"}
                </motion.button>
              </form>
            )}
          </motion.div>

          {/* Right: Map + Info */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {/* Map */}
            <div
              style={{
                width: "100%",
                height: "280px",
                borderRadius: "4px",
                overflow: "hidden",
                marginBottom: "2rem",
                background: "#e8e0d0",
              }}
            >
              {googleMapsEmbedUrl ? (
                <iframe
                  src={googleMapsEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: "block" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mappa ristorante"
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    background: "#e8e0d0",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.85rem",
                    color: "#6b5c42",
                  }}
                >
                  Mappa non disponibile
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <InfoRow icon="📍" label="Indirizzo" value={address} colors={colors} />
              <InfoRow icon="📞" label="Telefono" value={phone} colors={colors} isLink={`tel:${phone}`} />
              <InfoRow icon="✉️" label="Email" value={email} colors={colors} isLink={`mailto:${email}`} />
            </div>

            {/* Hours */}
            <div style={{ marginTop: "2rem" }}>
              <h4
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.15rem",
                  fontWeight: 500,
                  color: colors.primary,
                  margin: "0 0 1rem",
                }}
              >
                Orari
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {openingHours.map((h) => (
                  <div
                    key={h.day}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span style={{ color: colors.text, fontWeight: 400 }}>{h.day}</span>
                    <span style={{ color: h.closed ? "#9ca3af" : colors.text, fontStyle: h.closed ? "italic" : "normal" }}>
                      {h.hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            {socialLinks && (
              <div style={{ marginTop: "1.75rem", display: "flex", gap: "1rem" }}>
                {socialLinks.instagram && (
                  <SocialLink href={socialLinks.instagram} label="Instagram" colors={colors} />
                )}
                {socialLinks.facebook && (
                  <SocialLink href={socialLinks.facebook} label="Facebook" colors={colors} />
                )}
                {socialLinks.tripadvisor && (
                  <SocialLink href={socialLinks.tripadvisor} label="TripAdvisor" colors={colors} />
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Mobile override */}
        <style>{`
          @media (max-width: 768px) {
            #contatti > div > div:last-child {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </section>
  );
}

function InfoRow({
  icon,
  label,
  value,
  colors,
  isLink,
}: {
  icon: string;
  label: string;
  value: string;
  colors: ContactProps["colors"];
  isLink?: string;
}) {
  return (
    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
      <span style={{ fontSize: "1.1rem", marginTop: "2px", minWidth: "1.5rem" }}>{icon}</span>
      <div>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.7rem",
            color: "#6b5c42",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: "0 0 0.2rem",
          }}
        >
          {label}
        </p>
        {isLink ? (
          <a
            href={isLink}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.9rem",
              color: colors.primary,
              textDecoration: "none",
              transition: "color 0.2s",
            }}
          >
            {value}
          </a>
        ) : (
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.9rem",
              color: colors.primary,
              margin: 0,
            }}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function SocialLink({
  href,
  label,
  colors,
}: {
  href: string;
  label: string;
  colors: ContactProps["colors"];
}) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.05, color: colors.accent }}
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.78rem",
        color: colors.primary,
        textDecoration: "none",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        border: `1px solid rgba(26,18,8,0.15)`,
        borderRadius: "2px",
        padding: "0.4rem 0.9rem",
        display: "inline-block",
        transition: "border-color 0.2s ease",
      }}
    >
      {label}
    </motion.a>
  );
}

export default Contact;
