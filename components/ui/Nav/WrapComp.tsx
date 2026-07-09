"use client";
import { useContextState } from "@/context/GlobalContext";
import Link from "next/link";
import React, { useState } from "react";
import styles from '@/page.module.css';

const routes = [
  { href: "/",            label: "Home" },
  { href: "/mcpserver", label: "MCP Server (API)" },
  { href: "/stream",        label: "stream " },
  { href: "/tool-test",      label: "tool test " },
  // { href: "/ragtool",        label: "rag Flow" },
  // { href: "/ollamanpm",   label: "Models" },
  // { href: "/generate",    label: "Tools" },
  //  { href: "/option",    label: "Your models local" },
];

const NavHeader = ({ children }: { children?: React.ReactNode }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const state = useContextState();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const temp = state.message.messages[state.message.messages.length - 1] as any
  const activeModel = state?.message?.messages?.length > 0
    ? `${temp.model} · sha256:${String(temp.digest)}…`
    : "no model selected";

  return (
    <>
      {/* ── HEADER ───────────────────────────────────────────── */}
      <header className={styles.header}>
        {/* App name */}
        <span style={{
          color: "#00ffff",
          fontSize: "1.4rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          textShadow: "0 0 8px #00ffff",
          fontWeight: 700,
        }}>
          OLLAMAVERSE 💎
        </span>

        {/* State display — active model */}
        <div className={styles.state}>
          ◈ {activeModel}
        </div>
      </header>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav className={styles.nav}>
        {routes.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            onMouseEnter={() => setHovered(href)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "inline-block",
              width: hovered === href ? "200px" : "149px",
              transition: "width 0.25s ease, color 0.2s ease, box-shadow 0.2s ease",
              textAlign: "center",
              padding: "7px 0",
              color: hovered === href ? "#00ffff" : "#00ffff66",
              textDecoration: "none",
              borderRight: "1px solid #00ffff11",
              fontFamily: "'Courier New', monospace",
              fontSize: "0.8rem",
    letterSpacing: "0.002em",
    textTransform: "uppercase",
    fontWeight: 600,
              overflow: "hidden",
              whiteSpace: "nowrap",
              boxShadow: hovered === href
                ? "inset 0 -2px 0 #00ffff, 0 0 12px #00ffff22"
                : "none",
              textShadow: hovered === href ? "0 0 8px #00ffff" : "none",
            }}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* ── CONTENT ──────────────────────────────────────────── */}
      <div style={{
        minHeight: "calc(100vh - 145px)",
        background: "#3a575f",
        padding: '2rem',
         color: "#00ffff",
    fontSize: "1.0rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    textShadow: "0 0 8px #00ffff",
    fontWeight: 900,
        fontFamily: "'Courier New', monospace",
      }}>
        {children}
      </div>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid #00ffff22",
          background: "#0a0a12",
          color: "#67c2c2",
          textAlign: "center",
          padding: "18px 32px",
          fontFamily: "'Courier New', monospace",
          fontSize: "0.72rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        © {new Date().getFullYear()} OLLAMAVERSE · LOCAL AI INTERFACE 💎
      </footer>
    </>
  );
};

export default NavHeader;
