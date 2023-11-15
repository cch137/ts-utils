import sha3 from 'crypto-js/sha3.js'
import math from '../math'
import str from '../str'

const sha256 = (message: string): string => {
  return sha3(message, { outputLength: 256 }).toString()
}

const binaryStrRegex = /0b[0-1]+/i

export default function toSeed (seed: any): number {
  if (typeof seed === 'number') return Math.round(seed)
  else if (seed instanceof Object) seed = str(seed)
  if (typeof seed === 'string') {
    if (binaryStrRegex.test(seed)) return parseInt(seed.substring(2, seed.length - 1), 2)
    const num = parseInt(seed)
    return Number.isNaN(num)
      ? math.sum(parseInt(sha256(seed), 16))
      : num
  }
  return Date.now()
}
