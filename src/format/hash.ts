import sha3 from 'crypto-js/sha3.js'
import md5 from 'crypto-js/md5.js'

export default function hash(text: string, algorithm: 'MD5' | 224 | 256 | 384 | 512) {
  if (algorithm === 'MD5') return md5(text).toString()
  return sha3(text, { outputLength: algorithm }).toString()
}
