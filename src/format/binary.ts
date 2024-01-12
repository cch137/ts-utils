function uint8ArrayToNumbers(array: Uint8Array | (number | bigint)[]) {
  return [...(array as (number | bigint)[])].map(i => Number(i))
}

function numbersToAscii(array: Uint8Array | (number | bigint)[]) {
  return btoa(String.fromCharCode.apply(null, uint8ArrayToNumbers(array))).replace(/[=]+$/, '')
}

function asciiToNumbers(array: string) {
  return Array.from(atob(array)).map(c => c.charCodeAt(0))
}

function convertUintArray(array: Uint8Array | Uint16Array | Uint32Array, toUint: 8 | 16 | 32): Uint8Array | Uint16Array | Uint32Array
function convertUintArray(array: Uint8Array | Uint16Array | Uint32Array, toUint: 8): Uint8Array
function convertUintArray(array: Uint8Array | Uint16Array | Uint32Array, toUint: 16): Uint16Array
function convertUintArray(array: Uint8Array | Uint16Array | Uint32Array, toUint: 32): Uint32Array
function convertUintArray(array: Uint8Array | Uint16Array | Uint32Array, toUint: 8 | 16 | 32) {
  switch (toUint) {
    case 8:
      if (array instanceof Uint16Array) return new Uint8Array(array.buffer)
      if (array instanceof Uint32Array) return new Uint8Array(array.buffer)
      return array
    case 16:
      if (array instanceof Uint8Array) return new Uint16Array(array.buffer)
      if (array instanceof Uint32Array) return new Uint16Array(array.buffer)
      return array
    case 32:
      if (array instanceof Uint8Array) return new Uint32Array(array.buffer)
      if (array instanceof Uint16Array) return new Uint32Array(array.buffer)
      return array
  }
}

export {
  uint8ArrayToNumbers,
  numbersToAscii,
  asciiToNumbers,
  convertUintArray,
}