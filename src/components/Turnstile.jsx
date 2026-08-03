import { useEffect, useRef } from "react";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
let scriptLoadPromise = null;

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve();
  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return scriptLoadPromise;
}

// Wraps Cloudflare Turnstile's vanilla JS widget (no React SDK dependency;
// just the official script + imperative render/reset API).
export default function Turnstile({ siteKey, onVerify, onExpire, resetKey }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    if (!siteKey) return;
    loadTurnstileScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        "expired-callback": onExpire,
      });
    });
    return () => {
      cancelled = true;
      if (widgetIdRef.current != null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, resetKey]);

  if (!siteKey) {
    return <p className="text-[11px]" style={{ color: "#D9534F" }}>Turnstile isn't configured; set VITE_TURNSTILE_SITE_KEY.</p>;
  }

  return <div className="flex justify-center" ref={containerRef} />;
}
