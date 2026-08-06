import { useState } from "react";
import { Mail, ShieldCheck } from "lucide-react";
import Turnstile from "../components/Turnstile";
import MailtoLink from "../components/MailtoLink";
import { supabase } from "../lib/supabaseClient";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export default function LoginScreen({ rootVars }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [step, setStep] = useState("email"); // email | code
  const [status, setStatus] = useState("idle"); // idle | sending | verifying
  const [error, setError] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const sendCode = async (e) => {
    e.preventDefault();
    setError("");
    if (!captchaToken) { setError("Please complete the verification check."); return; }
    setStatus("sending");
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, captchaToken },
    });
    setStatus("idle");
    // Same response shown whether the email is new or existing; no account enumeration.
    if (sendError) {
      const message = sendError.message && sendError.message.trim() && sendError.message.trim() !== "{}"
        ? sendError.message
        : "Something went wrong sending the code. Please try again in a moment.";
      setError(message);
      setCaptchaToken(null); setResetKey(k => k + 1); return;
    }
    setStep("code");
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("verifying");
    const { error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setStatus("idle");
    if (verifyError) { setError(verifyError.message); return; }
    // Success; App.jsx's onAuthStateChange listener picks up the new session from here.
  };

  return (
    <div className="whmi-root light flex items-center justify-center p-4" style={{ minHeight: "100vh", ...rootVars }}>
      <div className="whmi-card w-full max-w-sm p-6 whmi-fade-in">
        <div className="whmi-logo-full mx-auto mb-4" style={{ width: 128, height: 66 }} />
        <h1 className="disp text-[16px] font-extrabold text-center mb-1">Medical Imaging CPD Dashboard</h1>
        <p className="text-[12px] text-center mb-5" style={{ color: "var(--text-faint)" }}>
          {step === "email" ? "Sign in with your email, no password needed" : "Enter the code we sent you"}
        </p>

        {step === "email" ? (
          <form onSubmit={sendCode} className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="whmi-input w-full px-3 py-2 mt-1" placeholder="you@wh.org.au" />
            </div>
            <Turnstile siteKey={TURNSTILE_SITE_KEY} onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} resetKey={resetKey} />
            {error && <div className="text-[12px] font-semibold" style={{ color: "#D9534F" }}>{error}</div>}
            <button type="submit" disabled={status === "sending"} className="whmi-btn-primary w-full flex items-center justify-center gap-1.5" style={{ opacity: status === "sending" ? 0.7 : 1 }}>
              <Mail size={14} />{status === "sending" ? "Sending…" : "Send Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-3">
            <p className="text-[12px]" style={{ color: "var(--text-dim)" }}>We sent a verification code to <strong>{email}</strong>.</p>
            <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>It can take a minute or two to arrive; if you don't see it, check your junk/spam folder.</p>
            <div>
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Code</label>
              <input required value={code} onChange={e => setCode(e.target.value)} className="whmi-input w-full px-3 py-2 mt-1 text-center tracking-[0.3em] text-[16px]" placeholder="000000" maxLength={10} autoFocus />
            </div>
            {error && <div className="text-[12px] font-semibold" style={{ color: "#D9534F" }}>{error}</div>}
            <button type="submit" disabled={status === "verifying"} className="whmi-btn-primary w-full flex items-center justify-center gap-1.5" style={{ opacity: status === "verifying" ? 0.7 : 1 }}>
              <ShieldCheck size={14} />{status === "verifying" ? "Verifying…" : "Verify & Sign In"}
            </button>
            <button type="button" onClick={() => { setStep("email"); setCode(""); setError(""); setCaptchaToken(null); setResetKey(k => k + 1); }} className="whmi-btn-ghost w-full text-[12px]">
              Use a different email
            </button>
          </form>
        )}

        <div className="mt-4 pt-4 text-[10.5px] leading-relaxed" style={{ borderTop: "1px solid var(--border)", color: "var(--text-faint)" }}>
          Western Health staff (@wh.org.au) are recognised automatically. Anyone else can still sign in; external accounts are flagged for admin review.
        </div>
        <div className="mt-3 text-[10.5px] leading-relaxed text-center" style={{ color: "var(--text-faint)" }}>
          Having a problem? Email <MailtoLink email="whmieducation@wh.org.au" style={{ color: "var(--accent-primary)" }} />.
        </div>
      </div>
    </div>
  );
}
