import type { RandomCore } from "./index.js";

const N = 624;
const M = 397;
const MATRIX_A = 0x9908b0df;
const UPPER_MASK = 0x80000000;
const LOWER_MASK = 0x7fffffff;

const initSeed = (m: MersenneTwister, s: number) => {
  m.mt[0] = s >>> 0;
  for (m.i = 1; m.i < N; m.i++) {
    s = m.mt[m.i - 1] ^ (m.mt[m.i - 1] >>> 30);
    m.mt[m.i] =
      ((((s & 0xffff0000) >>> 16) * 1812433253) << 16) +
      (s & 0x0000ffff) * 1812433253 +
      m.i;
    m.mt[m.i] >>>= 0;
  }
};

const initByArray = (
  m: MersenneTwister,
  initKey: number[],
  keyLength: number
) => {
  initSeed(m, 19650218);
  let i = 1;
  let j = 0;
  let k = N > keyLength ? N : keyLength;
  for (; k !== 0; k--) {
    const s = m.mt[i - 1] ^ (m.mt[i - 1] >>> 30);
    m.mt[i] =
      (m.mt[i] ^
        (((((s & 0xffff0000) >>> 16) * 1664525) << 16) +
          (s & 0x0000ffff) * 1664525)) +
      initKey[j] +
      j;
    m.mt[i] >>>= 0;
    i++;
    j++;
    if (i >= N) {
      m.mt[0] = m.mt[N - 1];
      i = 1;
    }
    if (j >= keyLength) {
      j = 0;
    }
  }
  for (k = N - 1; k !== 0; k--) {
    const s = m.mt[i - 1] ^ (m.mt[i - 1] >>> 30);
    m.mt[i] =
      (m.mt[i] ^
        (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) +
          (s & 0x0000ffff) * 1566083941)) -
      i;
    m.mt[i] >>>= 0;
    i++;
    if (i >= N) {
      m.mt[0] = m.mt[N - 1];
      i = 1;
    }
  }
  m.mt[0] = 0x80000000;
};

export class MersenneTwister implements RandomCore {
  mt = new Array(N);
  i = N + 1;

  constructor(seed: number | number[] = Date.now()) {
    if (Array.isArray(seed)) initByArray(this, seed, seed.length);
    else initSeed(this, seed);
  }

  randint() {
    let y: number;
    const mag01 = new Array<number>(0x0, MATRIX_A);
    if (this.i >= N) {
      let kk: number;
      if (this.i === N + 1) {
        initSeed(this, 5489);
      }
      for (kk = 0; kk < N - M; kk++) {
        y = (this.mt[kk] & UPPER_MASK) | (this.mt[kk + 1] & LOWER_MASK);
        this.mt[kk] = this.mt[kk + M] ^ (y >>> 1) ^ mag01[y & 0x1];
      }
      for (; kk < N - 1; kk++) {
        y = (this.mt[kk] & UPPER_MASK) | (this.mt[kk + 1] & LOWER_MASK);
        this.mt[kk] = this.mt[kk + (M - N)] ^ (y >>> 1) ^ mag01[y & 0x1];
      }
      y = (this.mt[N - 1] & UPPER_MASK) | (this.mt[0] & LOWER_MASK);
      this.mt[N - 1] = this.mt[M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];
      this.i = 0;
    }
    y = this.mt[this.i++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  }

  random() {
    return this.randint() * (1.0 / 4294967296.0);
  }
}

export class MersenneTwisterExtended extends MersenneTwister {
  randomInt31() {
    return this.randint() >>> 1;
  }

  randomIncl() {
    return this.randint() * (1.0 / 4294967295.0);
  }

  randomExcl() {
    return (this.randint() + 0.5) * (1.0 / 4294967296.0);
  }

  randomLong() {
    return (
      ((this.randint() >>> 5) * 67108864 + (this.randint() >>> 6)) *
      (1.0 / 9007199254740992.0)
    );
  }
}

export const MT = (seed?: number) => new MersenneTwister(seed);
export const MTX = (seed?: number) => new MersenneTwisterExtended(seed);
export default MT;
