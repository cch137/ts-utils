function uint8ArrayToNumbers(array: Uint8Array | (number | bigint)[]) {
  return [...(array as (number | bigint)[])].map(i => Number(i))
}

function numbersToAscii(array: Uint8Array | (number | bigint)[]) {
  return btoa(String.fromCharCode.apply(null, uint8ArrayToNumbers(array)))
}

function asciiToNumbers(array: string) {
  return atob(array).split('').map(c => c.charCodeAt(0))
}

export {
  uint8ArrayToNumbers,
  numbersToAscii,
  asciiToNumbers,
}