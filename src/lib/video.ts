export function getVideoEmbed(url: string): { src: string; type: "youtube" | "external" } | null {
  if (!url) return null;

  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return { src: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`, type: "youtube" };

  // Veo and other external platforms block iframe - return external link
  return { src: url, type: "external" };
}
