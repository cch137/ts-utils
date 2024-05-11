import str from "../../str";
import {
  textToBase64,
  base64ToText,
  secureBase64,
} from "../../str/base-converter";
import { mask, unmask } from "./masker";
import hash from "../../hash";

/** Encode 加密 */
function e(input: any, maskLevel = 1, seed?: any): string {
  return mask(secureBase64(textToBase64(str(input))), 64, maskLevel, seed);
}

/** Decode 解密 */
function d(input: string, maskLevel = 1, seed?: any, tryParseJSON = true): any {
  input = base64ToText(unmask(input, 64, maskLevel, seed));
  if (!tryParseJSON) {
    return input;
  }
  try {
    return JSON.parse(input);
  } catch (err) {
    return input;
  }
}

/** Hash 散列運算 */
function hx(
  input: any,
  algorithm: "MD5" | 224 | 256 | 384 | 512 = 512,
  seed?: any
) {
  const encrypted = e(input, 1, seed).substring(1);
  return hash(encrypted, algorithm);
}

export { e, d, hx };
export default { e, d, hx };
