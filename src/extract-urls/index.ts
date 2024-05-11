export default function extractUrls(text: string, nonRepeated = true) {
  const urlRegex =
    /((?:https?:\/\/)(?:www\.)?[a-zA-Z0-9\u4e00-\u9fa5-]+(?:\.[a-zA-Z0-9\u4e00-\u9fa5-]+)+(?:\/[^\s]*)?)/g;
  const matches = text.match(urlRegex);
  if (matches) {
    const urls = matches.map((url) =>
      /^https?:\/\//i.test(url) ? url : `http://${url}`
    );
    return nonRepeated ? [...new Set(urls)] : urls;
  }
  return [];
}
