function uint8ArrayToNumbers(array: Uint8Array | (number | bigint)[]) {
  return [...(array as (number | bigint)[])].map(i => Number(i))
}

function numbersToAscii(array: Uint8Array | (number | bigint)[]) {
  return btoa(String.fromCharCode.apply(null, uint8ArrayToNumbers(array))).replace(/[=]+$/, '')
}

function asciiToNumbers(array: string) {
  return Array.from(atob(array)).map(c => c.charCodeAt(0))
}

export {
  uint8ArrayToNumbers,
  numbersToAscii,
  asciiToNumbers,
}