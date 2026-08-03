import { useEffect, useState } from "react";
import { X } from "lucide-react";

const PAD = 8;

// Spotlight overlay: a red-bordered cutout (via oversized box-shadow) around the current
// step's target element, plus a callout with Next/Skip. Steps whose target isn't currently
// in the DOM (e.g. the notification bell, admin/owner only) are dropped up front.
export default function OnboardingTour({ steps, onFinish }) {
  const [activeSteps, setActiveSteps] = useState(null);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    setActiveSteps(steps.filter(s => document.querySelector(s.selector)));
  }, [steps]);

  useEffect(() => {
    if (!activeSteps || !activeSteps[i]) return;
    const measure = () => {
      const el = document.querySelector(activeSteps[i].selector);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => { window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); };
  }, [activeSteps, i]);

  if (!activeSteps || activeSteps.length === 0) return null;
  const step = activeSteps[i];
  const last = i === activeSteps.length - 1;
  const next = () => (last ? onFinish() : setI(x => x + 1));

  const box = rect ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 } : null;
  const tooltipTop = box
    ? (box.top + box.height + 12 <= window.innerHeight - 150 ? box.top + box.height + 12 : Math.max(12, box.top - 150))
    : window.innerHeight / 2 - 70;
  const tooltipLeft = box ? Math.min(Math.max(box.left, 16), window.innerWidth - 316) : window.innerWidth / 2 - 150;

  return (
    <div className="fixed inset-0" style={{ zIndex: 200 }}>
      {box ? (
        <div className="fixed rounded-xl pointer-events-none" style={{ top: box.top, left: box.left, width: box.width, height: box.height, boxShadow: "0 0 0 9999px rgba(15,15,20,0.65)", border: "2px solid #D9534F", transition: "all 0.2s ease" }} />
      ) : (
        <div className="fixed inset-0" style={{ background: "rgba(15,15,20,0.65)" }} />
      )}

      <div className="whmi-card fixed p-4" style={{ top: tooltipTop, left: tooltipLeft, width: 300, zIndex: 201, border: "2px solid #D9534F" }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10.5px] font-bold" style={{ color: "#D9534F" }}>STEP {i + 1} OF {activeSteps.length}</span>
          <button onClick={onFinish} className="whmi-btn-ghost !p-1"><X size={13} /></button>
        </div>
        <div className="font-semibold text-[13.5px] mb-1">{step.title}</div>
        <p className="text-[12px] mb-3" style={{ color: "var(--text-dim)" }}>{step.body}</p>
        <div className="flex items-center justify-between">
          <button onClick={onFinish} className="whmi-btn-ghost text-[11.5px]">Skip tour</button>
          <button onClick={next} className="whmi-btn-primary text-[12px]">{last ? "Done" : "Next"}</button>
        </div>
      </div>
    </div>
  );
}
