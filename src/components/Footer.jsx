export default function Footer() {
  return (
    <footer className="px-6 py-5 mt-8 text-[11px] leading-relaxed" style={{ borderTop: "1px solid var(--border)", color: "var(--text-faint)" }}>
      <p>
        This dashboard is provided by Western Health Medical Imaging for internal CPD tracking and event management purposes only.
        While every effort is made to keep information accurate and up to date, Western Health makes no warranties or guarantees
        about the completeness, reliability, or availability of this site or its content, and accepts no liability for any loss
        or damage arising from its use.
      </p>
      <p className="mt-1.5">
        Having a problem or found something that doesn't look right? Email{" "}
        <a href="mailto:whmieducation@wh.org.au" style={{ color: "var(--accent-primary)" }}>whmieducation@wh.org.au</a>.
      </p>
      <p className="mt-1.5">&copy; {new Date().getFullYear()} Western Health Medical Imaging. All rights reserved.</p>
    </footer>
  );
}
