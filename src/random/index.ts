import { MT, MTX } from "./MersenneTwister.js";
import LCG from "./LinearCongruentialGenerator.js";

const BASE10_CHARSET = "0123456789";
const BASE16_CHARSET = "0123456789abcdef";
const BASE64_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const BASE64URL_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export type RandomCore = {
  randint(): number;
  random(): number;
};

export class Random {
  #core: RandomCore;

  constructor(seed?: RandomCore | number) {
    this.#core = typeof seed === "object" ? seed : MT(seed);
  }

  random(start = 0, end = 1) {
    return start + this.#core.random() * (end - start);
  }

  randint(start?: number, end?: number) {
    if (start === undefined) {
      if (end === undefined) return this.#core.randint();
      start = 0;
    }
    if (end === undefined) {
      (end = start), (start = 0);
    }
    return Math.floor(start + this.#core.random() * (end - start));
  }

  choice<T>(array: T[]): T;
  choice(array: string): string;
  choice<T>(array: T[] | string) {
    return array[this.randint(0, array.length)];
  }

  choices<T>(array: T[], k?: number): T;
  choices(array: string, k?: number): string[];
  choices<T>(array: T[] | string, k = 1) {
    if (typeof array === "string") return this.choices([...array], k);
    const result: T[] = [];
    for (let i = 0; i < k; i++) result.push(this.choice(array));
    return result;
  }

  sample<T>(array: T[], k = 1) {
    if (k > array.length || k < 0)
      throw new Error("Sample larger than population or is negative");
    array = [...array];
    const result: T[] = [];
    for (let i = 0; i < k; i++)
      result.push(array.splice(this.randint(0, array.length), 1)[0]);
    return result;
  }

  shuffle<T>(array: T[]): T[];
  shuffle(array: string): string;
  shuffle<T>(array: T[] | string) {
    return typeof array === "string"
      ? this.sample(array.split(""), array.length).join("")
      : this.sample(array, array.length);
  }

  base10(len = 6) {
    return this.choices(BASE10_CHARSET, len).join("");
  }

  base16(len = 32) {
    return this.choices(BASE16_CHARSET, len).join("");
  }

  base64(len = 32) {
    return this.choices(BASE64_CHARSET, len).join("");
  }

  base64url(len = 32) {
    return this.choices(BASE64URL_CHARSET, len).join("");
  }
}

const random = new Random();

export default random;
export { MT, MTX, LCG };

const _random = random.random.bind(random);
export { _random as random };
export const randint = random.randint.bind(random);
export const choice = random.choice.bind(random);
export const choices = random.choices.bind(random);
export const sample = random.sample.bind(random);
export const shuffle = random.shuffle.bind(random);
export const base10 = random.base10.bind(random);
export const base16 = random.base16.bind(random);
export const base64 = random.base64.bind(random);
export const base64url = random.base64url.bind(random);
