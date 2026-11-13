export function resolveAvatarUrl(avatarUrl?: string | null) {
  if (!avatarUrl) return null;
  // Only uploaded profile photos (Supabase public URLs)
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }
  return null;
}

export function getInitials(label?: string | null) {
  if (!label) return "";
  const cleaned = label.trim();
  if (!cleaned) return "";
  if (cleaned.includes("@")) return cleaned.slice(0, 2).toUpperCase();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
