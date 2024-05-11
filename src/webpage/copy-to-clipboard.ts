export default async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const txArea = document.createElement("textarea");
    txArea.value = text;
    document.body.appendChild(txArea);
    txArea.select();
    document.execCommand("copy");
    txArea.remove();
  }
}
