export default function formatDuration(timeMs: number): string {
  if (timeMs < 1000) {
    return `1 second`;
  } else if (timeMs < 60000) {
    const seconds = Math.floor(timeMs / 1000);
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  } else if (timeMs < 3600000) {
    const minutes = Math.floor(timeMs / 60000);
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else {
    const hours = Math.floor(timeMs / 3600000);
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  }
}
