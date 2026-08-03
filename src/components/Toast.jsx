import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

export default function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDone, 2500);
    return () => clearTimeout(id);
  }, [message, onDone]);

  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-[70] whmi-card px-4 py-2.5 flex items-center gap-2 whmi-fade-in" style={{ transform: "translateX(-50%)", boxShadow: "0 8px 24px rgba(0,0,0,.18)" }}>
      <CheckCircle2 size={15} style={{ color: "var(--accent-success)" }} />
      <span className="text-[12.5px] font-semibold">{message}</span>
    </div>
  );
}
