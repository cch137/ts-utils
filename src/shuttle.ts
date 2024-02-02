import { Random } from "./random"
import hash from "./format/hash"
import type { Algorithm } from "./format/hash"
import { asciiToNumbers, numbersToAscii, convertUintArray } from "./format/binary"
import { binToBigint, hexToBigint } from "./format/number"

// FLAGS
// SPECIAL FLAGS
const flags_UNDF = 0
const flags_NULL = 1
const flags_TRUE = 2
const flags_FALSE = 3
// positive flags are even, negative flags are odd
const flags_INT = 32
const flags_INT_ = 33
const flags_BIGINT = 34
const flags_BIGINT_ = 35
const flags_FLOAT = 36
const flags_FLOAT_ = 37
const flags_INFI = 52
const flags_INFI_ = 53
const flags_NAN = 54
const flags_ZERO = 55
// STRINGS
const flags_STR = 64
const flags_STR_EMPTY = 65
const flags_STR_NUMR = 66
const flags_STR_NUMR_ = 67
const flags_STR_HEX_UP = 68
const flags_STR_HEX_LW = 69
const flags_STR_B64 = 70
const flags_STR_B64_URL = 71
const flags_STR_BIN = 72
const flags_STR_BIN_ = 73
// ITERABLES
const flags_ARR = 96
const flags_SET = 98
const flags_MAP = 100
// OBJECTS
const flags_OBJ = 128
const flags_DATE = 130
const flags_DATE_ = 131
// BUFFERS
const flags_BUF8 = 160
const flags_BUF16 = 162
const flags_BUF32 = 164
// END
const flags_END = 255

class BufferPointer {
  pos: number

  constructor(value: number | bigint = 0) {
    this.pos = Number(value)
  }

  walk(value: number | bigint = 1) {
    const pos = this.pos
    return (this.pos += Number(value), pos)
  }

  walked(value: number | bigint = 1) {
    return this.pos += Number(value)
  }
}

function getBufferBytePerElement(bytes: Uint8Array | Uint16Array | Uint32Array) {
  return bytes instanceof Uint8Array ? 1 : bytes instanceof Uint16Array ? 2 : bytes instanceof Uint32Array ? 4 : 0
}

function throwInvalidFlag(flag: number): never {
  throw new Error(`Invalid flag: ${flag}`)
}

function fillL<T>(arr: T[], fillValue: T, multiples: number = 8) {
  if (arr.length % multiples !== 0) arr.unshift(...new Array(multiples - arr.length % multiples).fill(fillValue))
  return arr
}

function fillR<T>(arr: T[], fillValue: T, multiples: number = 8) {
  if (arr.length % multiples !== 0) arr.push(...new Array(multiples - arr.length % multiples).fill(fillValue))
  return arr
}

function uintToBooleans(n: number | bigint, multiples: number = 8): boolean[] {
  return fillL([...n.toString(2)].map(i => i === '1'), false, multiples)
}

function booleansToUint(b: boolean[]) {
  const bigint2 = BigInt(2)
  return b.reverse().map((v, i) => BigInt(+v) * bigint2 ** BigInt(i)).reduce((a, b) => a + b, BigInt(0))
}

function booleansToUint8Array(b: boolean[]) {
  b = fillL(b, false)
  const x = new Uint8Array(b.length / 8), l = b.length; let i = 0
  while (i < l) x[i / 8] = parseInt(b.slice(i, i += 8).map(v => v ? '1' : '0').join(''), 2)
  return x
}

function packNoflagUint(n: number | bigint) {
  const booleans = fillL(uintToBooleans(n, 1), false, 7).reverse(), l = booleans.length; let i = 0
  const sizeData: boolean[] = []
  while (i < l) sizeData.unshift(true, ...booleans.slice(i, i += 7))
  sizeData[sizeData.length - 8] = false
  return booleansToUint8Array(sizeData)
}

function unpackNoflagUint(bytes: Uint8Array | number[], p = new BufferPointer()) {
  const chunks: boolean[] = []
  while (p.pos < bytes.length) {
    const [next, ...chunk] = uintToBooleans(bytes[p.walk()])
    chunks.push(...chunk.reverse())
    if (!next) break
  }
  return booleansToUint(chunks)
}

function packNumber(n: number | bigint) {
  if (n === 0) return new Uint8Array([flags_ZERO])
  if (Number.isNaN(n)) return new Uint8Array([flags_NAN])
  if (n === Infinity) return new Uint8Array([flags_INFI])
  if (n === -Infinity) return new Uint8Array([flags_INFI_])
  const negative = n < 0; if (negative) n = -n
  const flag = (typeof n === 'bigint' ? flags_BIGINT : Number.isInteger(n) ? flags_INT : flags_FLOAT) + (negative ? 1 : 0)
  if (flag < flags_FLOAT) return new Uint8Array([flag, ...packNoflagUint(n)])
  const decimalUint = booleansToUint(fillR([...(n as number % 1).toString(2).substring(2)].map(i => i === '1'), false))
  return new Uint8Array([flag, ...packNoflagUint(Math.floor(n as number)), ...packNoflagUint(decimalUint)])
}

function unpackNumber(bytes: Uint8Array | number[], p = new BufferPointer(), customFlag?: number) {
  // if customFlag is given, p does not walk
  const flag = customFlag || bytes[p.walk()]
  switch (flag) {
    case flags_ZERO: return 0
    case flags_NAN: return NaN
    case flags_INFI: return Infinity
    case flags_INFI_: return -Infinity
    case flags_INT: case flags_INT_: case flags_FLOAT: case flags_FLOAT_: case flags_BIGINT: case flags_BIGINT_: break
    default: throwInvalidFlag(flag)
  }
  const sign = flag % 2 === 0 ? 1 : -1
  const intValue = unpackNoflagUint(bytes, p)
  const isBigInt = flag === flags_BIGINT || flag === flags_BIGINT_
  if (isBigInt) return BigInt(sign) * intValue
  const isInt = flag === flags_INT || flag === flags_INT_
  if (isInt) return sign * Number(intValue)
  const floatValue = Number(unpackNoflagUint(bytes, p))
  const floatBooleans = uintToBooleans(floatValue)
  return sign * (Number(intValue) + (floatValue / 2 ** floatBooleans.length))
}

function packString(s: string) {
  if (s === '') return new Uint8Array([flags_STR_EMPTY])
  if (/^-?[0-1]+$/.test(s)) {
    const flag = s.startsWith('-') ? flags_STR_BIN_ : flags_STR_BIN
    return new Uint8Array([flag, ...packNumber(binToBigint(s)).slice(1)])
  }
  if (/^-?[0-9]+$/.test(s)) {
    const n = BigInt(s), flag = s.startsWith('-') ? flags_STR_NUMR_ : flags_STR_NUMR
    if (n.toString() === s) return new Uint8Array([flag, ...packNumber(n).slice(1)])
  }
  if (/^[0-9a-f]+$/.test(s)) {
    const n = hexToBigint(s)
    if (n.toString(16) === s) return new Uint8Array([flags_STR_HEX_LW, ...packNumber(n).slice(1)])
  }
  if (/^[0-9A-F]+$/.test(s)) {
    const n = hexToBigint(s)
    if (n.toString(16).toUpperCase() === s) return new Uint8Array([flags_STR_HEX_UP, ...packNumber(n).slice(1)])
  }
  const array = new TextEncoder().encode(s)
  return new Uint8Array([flags_STR, ...packNoflagUint(array.length), ...array])
}

function unpackString(bytes: Uint8Array, p = new BufferPointer()) {
  const flag = bytes[p.walk()]
  switch (flag) {
    case flags_STR_EMPTY: return ''
    case flags_STR_NUMR: return unpackNumber(bytes, p, flags_BIGINT).toString()
    case flags_STR_NUMR_: return unpackNumber(bytes, p, flags_BIGINT_).toString()
    case flags_STR_HEX_LW: return unpackNumber(bytes, p, flags_BIGINT).toString(16)
    case flags_STR_HEX_UP: return unpackNumber(bytes, p, flags_BIGINT).toString(16).toUpperCase()
    case flags_STR_BIN: return unpackNumber(bytes, p, flags_BIGINT).toString(2)
    case flags_STR_BIN_: return unpackNumber(bytes, p, flags_BIGINT_).toString(2)
    default:
      const stringLength = unpackNoflagUint(bytes, p)
      return new TextDecoder().decode(bytes.slice(p.pos, p.walked(stringLength)))
  }
}

function packSpecial(b: boolean | null | undefined) {
  switch (b) {
    case true: return new Uint8Array([flags_TRUE])
    case false: return new Uint8Array([flags_FALSE])
    case null: return new Uint8Array([flags_NULL])
    default: return new Uint8Array([flags_UNDF])
  }
}

function unpackSpecial(bytes: Uint8Array | number[], p = new BufferPointer()) {
  switch (bytes[p.walk()]) {
    case flags_TRUE: return true
    case flags_FALSE: return false
    case flags_NULL: return null
    default: return undefined
  }
}

function packArray(value: any[] | Set<any> | Map<any,any>) {
  const flag = value instanceof Set ? flags_SET : value instanceof Map ? flags_MAP : flags_ARR
  if (flag === flags_MAP) value = [...value.entries()].flat()
  else if (flag === flags_SET) value = [...value]
  return new Uint8Array([flag, ...(value as any[]).map(v => [..._packData(v)]).flat(), flags_END])
}

function unpackArray(bytes: Uint8Array, p = new BufferPointer()): any[] | Set<any> | Map<any,any> {
  const flag = bytes[p.walk()]
  const arr: any[] = []
  while (bytes[p.pos] !== flags_END) arr.push(_unpackData(bytes, p))
  p.walk()
  if (flag === flags_MAP) return new Map(arr.map((v, i, a) => i % 2 === 0 ? [v, a[i + 1]] : undefined).filter(i => i !== undefined) as [any, any][])
  return flag === flags_SET ? new Set(arr) : arr
}

function packObject(value: any) {
  if (value instanceof Date) {
    const t = value.getTime()
    return new Uint8Array([t < 0 ? flags_DATE_ : flags_DATE, ...packNoflagUint(Math.abs(t))])
  }
  return new Uint8Array([flags_OBJ, ...Object.keys(value).map((k) => [..._packData(isNaN(Number(k)) ? k : +k), ..._packData(value[k])]).flat(), flags_END])
}

function unpackObject(bytes: Uint8Array, p = new BufferPointer()): object {
  switch (bytes[p.walk()]) {
    case flags_DATE: return new Date(Number(unpackNoflagUint(bytes, p)))
    case flags_DATE_: return new Date(-Number(unpackNoflagUint(bytes, p)))
  }
  const obj: any = {}
  while (bytes[p.pos] !== flags_END) {
    const k = _unpackData(bytes, p) as string, v = _unpackData(bytes, p)
    obj[k] = v
  }
  p.walk()
  return obj
}

function packBuffer(bytes: Uint8Array | Uint16Array | Uint32Array) {
  const bytePerElement = getBufferBytePerElement(bytes)
  const flag = [flags_BUF8, flags_BUF16, 0, flags_BUF32][bytePerElement - 1]
  return new Uint8Array([flag, ...packNoflagUint(bytes.length), ...(bytePerElement === 1 ? bytes : convertUintArray(bytes, 8))])
}

function unpackBuffer(bytes: Uint8Array, p = new BufferPointer) {
  const flag = bytes[p.walk()]
  const bytePerElement = [0, flags_BUF8, flags_BUF16, 0, flags_BUF32].indexOf(flag) as 1 | 2 | 4
  const bufferLength = unpackNoflagUint(bytes, p) * BigInt(bytePerElement)
  const buffer = bytes.slice(p.pos, p.walked(bufferLength))
  return convertUintArray(buffer, bytePerElement * 8 as 8 | 16 | 32)
}

function _packData(value: any): Uint8Array {
  const dataType = typeof value
  switch (dataType) {
    case 'bigint':
    case 'number':
      return packNumber(value)
    case 'string':
      return packString(value)
    case 'boolean':
    case 'undefined':
      return packSpecial(value)
    case 'object':
      if (value === null) return packSpecial(value)
      if (value instanceof Date) return packObject(value)
      if (getBufferBytePerElement(value) !== 0) return packBuffer(value)
      if (typeof value[Symbol?.iterator] === 'function') return packArray(value)
      return packObject(value)
  }
  if (!Shuttle.ignoreUnsupportedTypes) {
    throw new Error(`Unsupported Data Type: ${dataType}`)
  }
  return packSpecial(undefined);
}

function _unpackData(value: Uint8Array | number[], p = new BufferPointer()) {
  if (!(value instanceof Uint8Array)) return _unpackData(new Uint8Array(value))
  const flag = value[p.pos]
  switch (Math.floor(flag / 32)) {
    case 0: return unpackSpecial(value, p)  // < 32
    case 1: return unpackNumber(value, p)   // < 64
    case 2: return unpackString(value, p)   // < 96
    case 3: return unpackArray(value, p)    // < 128
    case 4: return unpackObject(value, p)   // < 160
    case 5: return unpackBuffer(value, p)   // < 192
    default: throwInvalidFlag(flag)
  }
}

function arrayLeftShift(array: Uint8Array) {
  const firstBit = array[0] & 0x80
  return array.map((value, index) => {
    if (index === array.length - 1) {
      value <<= 1
      value |= (firstBit >> 7)
    } else {
      value = (value << 1) | ((array[index + 1] & 0x80) >> 7)
    }
    return value
  })
}

function arrayRightShift(array: Uint8Array) {
  const lastBit = array[array.length - 1] & 0x01
  return array.map((value, index) => {
    if (index === 0) {
      value >>= 1
      value |= (lastBit << 7)
    } else {
      value = (value >> 1) | ((array[index - 1] & 0x01) << 7)
    }
    return value
  })
}

function encryptBuffer(array: Uint8Array | number[], ...salts: number[]) {
  if (salts.length > 1) return encryptBuffer(encryptBuffer(array, salts[0]), ...salts.slice(1))
  if (salts.length === 0) return array instanceof Uint8Array ? array : new Uint8Array(array)
  const shuffledIndexes = new Random(salts[0]).shuffle(new Array(array.length).fill(0).map((v, i) => i))
  return arrayRightShift(new Uint8Array(array.length).map((v, i) => array[shuffledIndexes[i]]))
}

function decryptBuffer(array: Uint8Array | number[], ...salts: number[]) {
  if (salts.length > 1) return decryptBuffer(decryptBuffer(array, ...salts.slice(1)), salts[0])
  if (salts.length === 0) return array instanceof Uint8Array ? array : new Uint8Array(array)
  const shuffledIndexes = new Random(salts[0]).shuffle(new Array(array.length).fill(0).map((v, i) => i))
  const buffer = new Uint8Array(array.length)
  arrayLeftShift(array instanceof Uint8Array ? array : new Uint8Array(array)).forEach((v, i) => buffer[shuffledIndexes[i]] = v)
  return buffer
}

function packData<T>(data: T, salts: number[]): Shuttle<T>
function packData<T>(data: T, ...salts: number[]): Shuttle<T>
function packData<T>(data: T, ...salts: (number | number[])[]) {
  return new Shuttle(encryptBuffer(_packData(data), ...salts.flat()))
}

function unpackData<T>(array: Shuttle<T> | Uint8Array | number[] | string, salts: number[]): T
function unpackData<T>(array: Shuttle<T> | Uint8Array | number[] | string, ...salts: number[]): T
function unpackData<T>(array: Shuttle<T> | Uint8Array | number[] | string, ...salts: (number | number[])[]) {
  return _unpackData(decryptBuffer(typeof array === 'string' ? asciiToNumbers(array) : array, ...salts.flat()))
}

function hashData<T>(array: Shuttle<T> | Uint8Array | number[] | string, algorithm: Algorithm): string {
  if (array instanceof Shuttle) return hashData(array.toBase64(), algorithm)
  if (typeof array !== 'string') return hashData(Shuttle.load(array), algorithm)
  return hash(array, algorithm)
}

function packDataWithHash<T>(data: T, algorithm: Algorithm, salts: number[]): HashedShuttle<T>
function packDataWithHash<T>(data: T, algorithm: Algorithm, ...salts: number[]): HashedShuttle<T>
function packDataWithHash<T>(data: T, algorithm: Algorithm, ...salts: (number | number[])[]) {
  const array = packData(data)
  const hash = hashData(array, algorithm)
  return packData<ShuttleWithHash<T>>([hash, array], salts.flat())
}

function unpackDataWithHash<T>(array: HashedShuttle<T> | Uint8Array | number[] | string, algorithm: Algorithm, salts: number[]): T
function unpackDataWithHash<T>(array: HashedShuttle<T> | Uint8Array | number[] | string, algorithm: Algorithm, ...salts: number[]): T
function unpackDataWithHash<T>(array: HashedShuttle<T> | Uint8Array | number[] | string, algorithm: Algorithm, ...salts: (number | number[])[]) {
  const [hash, _array] = unpackData<ShuttleWithHash<T>>(array, salts.flat())
  const correctHash = hashData(_array, algorithm)
  if (hash !== correctHash) throw new Error(`Hash Mismatch: "${hash}" !== "${correctHash}"`)
  return unpackData(_array)
}

export type ShuttleWithHash<T> = [string, Shuttle<T>]
export type HashedShuttle<T> = Shuttle<[string, Shuttle<T>]>

class Shuttle<T> extends Uint8Array {
  static load<T>(data: Shuttle<T> | Uint8Array | number[] | string) {
    return new Shuttle<T>(typeof data === 'string' ? asciiToNumbers(data) : data)
  }

  static ignoreUnsupportedTypes = false
  static pack = packData
  static unpack = unpackData
  static packWithHash = packDataWithHash
  static unpackWithHash = unpackDataWithHash
  static hash = hashData
  static packUint = packNoflagUint
  static unpackUint = unpackNoflagUint
  static decrypt = decryptBuffer
  static encrypt = encryptBuffer

  unpack(salts: number[]): T
  unpack(...salts: number[]): T
  unpack(...salts: (number | number[])[]) {
    return unpackData(this, salts.flat())
  }

  unpackWithHash(algorithm: Algorithm, salts: number[]): T
  unpackWithHash(algorithm: Algorithm, ...salts: number[]): T
  unpackWithHash(algorithm: Algorithm, ...salts: (number | number[])[]) {
    return unpackDataWithHash(this, algorithm, salts.flat())
  }

  toBase64(): string {
    return numbersToAscii(this)
  }
}

export default Shuttle

export {
  Shuttle,
  packData,
  unpackData,
  packDataWithHash,
  unpackDataWithHash,
  hashData,
  packNoflagUint,
  unpackNoflagUint,
  encryptBuffer,
  decryptBuffer,
}
