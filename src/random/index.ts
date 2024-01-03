import toSeed from './to-seed'
import baseConverter from '../format/base-converter'
import MT, { MersenneTwister } from './MersenneTwister'

const {
  BASE10_CHARSET,
  BASE16_CHARSET,
  BASE64WEB_CHARSET
} = baseConverter

class Random {
  #mt: MersenneTwister

  constructor(seed?: any) {
    this.#mt = MT(seed)
  }

  public random() {
    return this.#mt.random()
  }

  /** start 會包括，end 不會包括 */
  public randInt(start: number, end: number) {
    if (end === undefined || end === 0) {
      end = start
      start = 0
    }
    return Math.floor(start + this.random() * end)
  }
  
  public choice(array: any[] | string) {
    return array[this.randInt(0, array.length)]
  }
  
  public choices(array: any[] | string, amount = 1) {
    const result: any[] = []
    const options: any[] = []
    for (let i = 0; i < amount; i++) {
      if (options.length === 0) {
        options.push(...array)
      }
      result.push(options.splice(this.randInt(0, options.length), 1)[0])
    }
    return result
  }
  
  public shuffle(array: any[] | string) {
    return this.choices(array, array.length)
  }
  
  public charset(charset: any | string[], len = 8) {
    return new Array(len).fill(0).map(_ => this.choice(charset)).join('')
  }

  public base10(len = 6) {
    return this.charset(BASE10_CHARSET, len)
  }

  public base16(len = 32) {
    return this.charset(BASE16_CHARSET, len)
  }

  public base64(len = 32) {
    return this.charset(BASE64WEB_CHARSET, len)
  }

  public lcg (_seed?: any) {
    let seed = toSeed(_seed)
    return () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296
  }
}

const random = new Random()

export default random
export {
  Random,
  MT,
  MersenneTwister
}
