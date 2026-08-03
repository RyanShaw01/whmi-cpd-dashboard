import { AlertTriangle } from "lucide-react";

export default function DuplicateWarnings({ pairs, onMerge, onDismiss }) {
  if (pairs.length === 0) return null;
  return (
    <div className="space-y-1.5 mb-2">
      {pairs.map(({ a, b, reason }) => (
        <div key={`${a.id}::${b.id}`} className="whmi-card p-2.5" style={{ borderColor: "#D9534F" }}>
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: "#D9534F" }} />
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-semibold">Possible duplicate: "{a.name}" and "{b.name}"</div>
              <div className="text-[11px] mb-1.5" style={{ color: "var(--text-faint)" }}>{reason}</div>
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => onMerge(a, b)} className="whmi-btn-ghost !py-1 !px-2 text-[11px]">Merge</button>
                <button onClick={() => onDismiss(a, b)} className="whmi-btn-ghost !py-1 !px-2 text-[11px]">Keep Separate</button>
                <button onClick={() => onDismiss(a, b)} className="whmi-btn-ghost !py-1 !px-2 text-[11px]">Ignore</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
