export default function formatBytes (fileSizeByte = 0, toFix = 2, spaceBeforeUnit = true) {
  const d = parseInt(`${Math.log(fileSizeByte) / Math.log(1024)}`) || 0
  return `${(fileSizeByte/Math.pow(1024, d > 5 ? 5 : d)).toFixed(toFix)}${spaceBeforeUnit?' ':''}${['', ...'KMGTP'][d > 5 ? 5 : d]}B`
}
