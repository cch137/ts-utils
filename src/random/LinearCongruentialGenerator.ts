import type { RandomCore } from "./index.js";

export class LinearCongruentialGenerator implements RandomCore {
  seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  randint() {
    return (this.seed = (this.seed * 1664525 + 1013904223) % 4294967296);
  }

  random() {
    return this.randint() / 4294967296;
  }
}

export const LCG = (seed?: number) => new LinearCongruentialGenerator(seed);
export default LCG;
