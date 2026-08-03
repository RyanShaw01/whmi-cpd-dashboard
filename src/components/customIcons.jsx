/*
 * Hand-drawn avatar icons that lucide-react doesn't provide (or doesn't provide
 * in the style we want). Props mirror lucide's icon components (size, color) so
 * they're drop-in compatible wherever a CHARACTERS icon is rendered.
 */

export function SkullIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10a5 5 0 0 1 10 0v5l-1 1-1-2-1 2-1-2-1 2-1-2-1 2-1-1z" />
      <circle cx="9.3" cy="10.3" r="1.5" />
      <circle cx="14.7" cy="10.3" r="1.5" />
      <path d="M12 12.2l-.9 1.6h1.8z" fill={color} stroke="none" />
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

export function FootballIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.2l2.6 1.9-1 3H10.4l-1-3z" fill={color} stroke="none" />
      <path d="M12 7.2V4M15 9.1l2.7-1.9M14 12.1l1.8 2.8M10 12.1l-1.8 2.8M9 9.1L6.3 7.2" />
    </svg>
  );
}

export function TacoIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14.5a8 5.5 0 0 1 16 0" />
      <path d="M4 14.5c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5" />
      <path d="M6.5 11.5l.8-2M9.7 10.3l.4-2.2M12.3 10l0-2.3M15 10.3l.6-2.1M17.6 11.5l1-1.9" />
    </svg>
  );
}
