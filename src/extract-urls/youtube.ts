const ytLinkRegex =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:\S+&)?v=|embed\/|v\/)|youtu\.be\/)([\w-]+)/g;

export function extractYouTubeUrls(text: string) {
  const matches = text.match(ytLinkRegex);
  return matches
    ? matches.filter(
        (link) => link.startsWith("https://") || link.startsWith("http://")
      )
    : [];
}

export function isYouTubeUrl(url: string) {
  return Boolean(extractYouTubeUrls(url).length > 0);
}

export function getYouTubeVideoId(url: string) {
  const match = ytLinkRegex.exec(url);
  if (match !== null) {
    return match[1];
  }
  return null;
}

export default extractYouTubeUrls;
