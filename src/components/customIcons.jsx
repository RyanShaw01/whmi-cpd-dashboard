/*
 * Hand-drawn avatar icons that lucide-react doesn't provide (or doesn't provide
 * in the style we want). Props mirror lucide's icon components (size, color) so
 * they're drop-in compatible wherever a CHARACTERS icon is rendered.
 */

export function SkullIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* small full-body skeleton */}
      <circle cx="12" cy="4.2" r="2.2" />
      <path d="M9.3 9.5h5.4M12 6.4v5.3M12 11.7l-3.2 2M12 11.7l3.2 2" strokeDasharray="1.3 1.3" />
      <path d="M9 11.7a3 2 0 0 1 6 0" />
      <path d="M12 13.7v3.3" />
      <path d="M12 15.2l-2.6 3.3M12 15.2l2.6 3.3" strokeDasharray="1.3 1.3" />
    </svg>
  );
}

export function HandBonesIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21v-6.5" strokeDasharray="1.6 1.6" />
      <path d="M12 21v-8" strokeDasharray="1.6 1.6" />
      <path d="M15 21v-6.5" strokeDasharray="1.6 1.6" />
      <path d="M17.5 20v-5.5" strokeDasharray="1.6 1.6" />
      <path d="M6.5 20v-5" strokeDasharray="1.6 1.6" />
      <path d="M6.5 15a2.5 2.5 0 0 1 11 0v1.5a4 4 0 0 1-4 4h-3a4 4 0 0 1-4-4z" />
    </svg>
  );
}

export function PlusOutlineIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round">
      <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z" />
    </svg>
  );
}
