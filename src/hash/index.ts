import sha3 from "crypto-js/sha3.js";
import md5 from "crypto-js/md5.js";

type Algorithm = "MD5" | 224 | 256 | 384 | 512;

export type { Algorithm };

export default function hash(text: string, algorithm: Algorithm) {
  if (algorithm === "MD5") return md5(text).toString();
  return sha3(text, { outputLength: algorithm }).toString();
}
