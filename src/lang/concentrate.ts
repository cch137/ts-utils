export default function concentrate(text: string, targetLength: number) {
  const textLength = text.length
  if (textLength <= targetLength) return text
  let step = Math.ceil(textLength / targetLength), j = 0, k: number, l: number
  const selected = Array.from({ length: textLength }).map((v, i) => i % step === 0 ? (j++, true) : false);
  const remainder = targetLength - j;
  if (remainder !== 0) {
    step = Math.ceil(textLength / remainder)
    for (let i = 0; i < remainder; i++) {
      j = i * step + Math.ceil(step / 2), k = 0, l = 0
      while (Math.abs(l) < textLength) {
        if (l >= 0 && !selected[l]) {
          selected[l] = true
          break
        }
        k = k >= 0 ? -(k + 1) : k = -k
        l = j + k
      }
    }
  }
  return text.split('').filter((v, i) => selected[i]).join('')
}