import { sum } from "../../number";
import str from "../../str";
import hash from "../../hash";

export default function toSeed(seed: any): number {
  if (typeof seed === "number") return Math.round(seed);
  if (seed instanceof Object) seed = str(seed);
  if (typeof seed === "string") {
    if (/0b[0-1]+/i.test(seed))
      return parseInt(seed.substring(2, seed.length - 1), 2);
    const num = parseInt(seed);
    return Number.isNaN(num) ? sum(parseInt(hash(seed, 256), 16)) : num;
  }
  return Date.now();
}
