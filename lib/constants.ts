/**
 * Shared constants used across the application
 */

/**
 * List of retirement village locations
 */
export const LOCATIONS = [
  "Sunrise Village",
  "Oakwood Gardens",
  "Meadow Creek",
  "Lakeside Manor",
  "Hillcrest Retirement",
] as const;

export type Location = (typeof LOCATIONS)[number];

/**
 * Color schemes for each village location
 */
export const VILLAGE_COLORS: Record<
  string,
  { bg: string; text: string; border: string; hover: string }
> = {
  "Sunrise Village": {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
    hover: "hover:bg-amber-200",
  },
  "Oakwood Gardens": {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-300",
    hover: "hover:bg-emerald-200",
  },
  "Meadow Creek": {
    bg: "bg-sky-100",
    text: "text-sky-700",
    border: "border-sky-300",
    hover: "hover:bg-sky-200",
  },
  "Lakeside Manor": {
    bg: "bg-violet-100",
    text: "text-violet-700",
    border: "border-violet-300",
    hover: "hover:bg-violet-200",
  },
  "Hillcrest Retirement": {
    bg: "bg-rose-100",
    text: "text-rose-700",
    border: "border-rose-300",
    hover: "hover:bg-rose-200",
  },
};

/**
 * Default village colors (used when location not specified)
 */
export const DEFAULT_VILLAGE_COLOR = {
  bg: "bg-violet-100",
  text: "text-violet-700",
  border: "border-violet-300",
  hover: "hover:bg-violet-200",
};

/**
 * Get color scheme for a village (with fallback)
 */
export function getVillageColor(village?: string) {
  if (!village) return DEFAULT_VILLAGE_COLOR;
  return VILLAGE_COLORS[village] || DEFAULT_VILLAGE_COLOR;
}

/**
 * Avatar colors for attendee display (26 distinct colors)
 */
export const AVATAR_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
  "bg-red-600",
  "bg-orange-600",
  "bg-green-600",
  "bg-teal-600",
  "bg-blue-600",
  "bg-indigo-600",
  "bg-purple-600",
  "bg-pink-600",
  "bg-slate-500",
] as const;

/**
 * Get a consistent color for an attendee based on their ID
 */
export function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Get initials from a name (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * App name and branding
 */
export const APP_NAME = "Daphstar Fitness";
export const APP_TAGLINE = "Class Schedule";
