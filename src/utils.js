/**
 * Normalizes a content section's media to the new array format.
 * Old format: { media_url, media_type, title, content }
 * New format: { media: [{ url, type }], title, content }
 */
export function normalizeSectionMedia(section) {
  if (section.media) return section;
  const media = [];
  if (section.media_url) {
    media.push({ url: section.media_url, type: section.media_type || 'image' });
  }
  return { ...section, media, media_url: undefined, media_type: undefined };
}
