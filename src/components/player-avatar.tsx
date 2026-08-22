import type { ReactNode } from "react";

export const AVATARS = [
  { id: 0, label: "Fox" },
  { id: 1, label: "Frog" },
  { id: 2, label: "Cat" },
  { id: 3, label: "Robot" },
  { id: 4, label: "Ghost" },
  { id: 5, label: "Banana" },
  { id: 6, label: "Alien" },
  { id: 7, label: "Bear" },
] as const;

type AvatarProps = {
  id: number;
  size?: number;
  title?: string;
};

function Face({
  bg,
  children,
}: {
  bg: string;
  children: ReactNode;
}) {
  return (
    <>
      <circle cx="32" cy="32" r="30" fill={bg} />
      {children}
    </>
  );
}

function Eyes({ x = 22, gap = 20, y = 28 }: { x?: number; gap?: number; y?: number }) {
  return (
    <>
      <circle cx={x} cy={y} r="3.4" fill="#18181b" />
      <circle cx={x + gap} cy={y} r="3.4" fill="#18181b" />
    </>
  );
}

export function PlayerAvatar({ id, size = 72, title }: AvatarProps) {
  const index = ((id % AVATARS.length) + AVATARS.length) % AVATARS.length;
  const label = title ?? AVATARS[index]!.label;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : "presentation"}
      aria-label={title ? label : undefined}
    >
      {index === 0 ? (
        <Face bg="#f97316">
          <polygon points="8,28 4,4 24,16" fill="#ea580c" />
          <polygon points="56,28 60,4 40,16" fill="#ea580c" />
          <polygon points="8,28 10,10 24,18" fill="#fed7aa" />
          <polygon points="56,28 54,10 40,18" fill="#fed7aa" />
          <ellipse cx="32" cy="40" rx="10" ry="7" fill="#fed7aa" />
          <Eyes />
          <path d="M24 46q8 6 16 0" fill="none" stroke="#18181b" strokeWidth="2.4" strokeLinecap="round" />
        </Face>
      ) : null}
      {index === 1 ? (
        <Face bg="#4ade80">
          <ellipse cx="32" cy="22" rx="18" ry="10" fill="#86efac" />
          <Eyes y={30} />
          <ellipse cx="32" cy="44" rx="8" ry="6" fill="#166534" />
          <circle cx="32" cy="44" r="3" fill="#14532d" />
        </Face>
      ) : null}
      {index === 2 ? (
        <Face bg="#fb7185">
          <polygon points="14,22 10,6 26,16" fill="#fb7185" />
          <polygon points="50,22 54,6 38,16" fill="#fb7185" />
          <polygon points="14,22 14,10 26,18" fill="#fecdd3" />
          <polygon points="50,22 50,10 38,18" fill="#fecdd3" />
          <Eyes />
          <path d="M24 42q8 8 16 0" fill="none" stroke="#18181b" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="18" cy="38" r="4" fill="#fda4af" />
          <circle cx="46" cy="38" r="4" fill="#fda4af" />
        </Face>
      ) : null}
      {index === 3 ? (
        <Face bg="#cbd5e1">
          <rect x="18" y="16" width="28" height="10" rx="3" fill="#0f172a" />
          <circle cx="24" cy="21" r="2.5" fill="#22d3ee" />
          <circle cx="40" cy="21" r="2.5" fill="#22d3ee" />
          <rect x="22" y="36" width="20" height="8" rx="2" fill="#334155" />
          <rect x="26" y="38" width="12" height="4" fill="#facc15" />
        </Face>
      ) : null}
      {index === 4 ? (
        <Face bg="#e9d5ff">
          <ellipse cx="32" cy="50" rx="16" ry="8" fill="#c4b5fd" />
          <Eyes y={26} />
          <path d="M24 40q8 5 16 0" fill="none" stroke="#5b21b6" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="20" cy="36" r="3" fill="#ddd6fe" />
        </Face>
      ) : null}
      {index === 5 ? (
        <Face bg="#facc15">
          <path d="M20 8c8 4 12 4 24 0 2 8-2 14-12 16S18 16 20 8z" fill="#65a30d" />
          <Eyes y={30} />
          <path d="M26 44q6 5 12 0" fill="none" stroke="#854d0e" strokeWidth="2.6" strokeLinecap="round" />
        </Face>
      ) : null}
      {index === 6 ? (
        <Face bg="#a3e635">
          <ellipse cx="20" cy="10" rx="4" ry="8" fill="#a3e635" />
          <ellipse cx="44" cy="10" rx="4" ry="8" fill="#a3e635" />
          <circle cx="20" cy="6" r="3" fill="#f97316" />
          <circle cx="44" cy="6" r="3" fill="#f97316" />
          <Eyes />
          <ellipse cx="32" cy="44" rx="9" ry="5" fill="#365314" />
        </Face>
      ) : null}
      {index === 7 ? (
        <Face bg="#b45309">
          <circle cx="14" cy="18" r="8" fill="#92400e" />
          <circle cx="50" cy="18" r="8" fill="#92400e" />
          <ellipse cx="32" cy="40" rx="9" ry="7" fill="#fde68a" />
          <Eyes />
          <path d="M24 48q8 4 16 0" fill="none" stroke="#18181b" strokeWidth="2.4" strokeLinecap="round" />
        </Face>
      ) : null}
    </svg>
  );
}
