export function sum(...args: number[]) {
  return args.reduce((a, b) => a + b, 0);
}

export function avg(...args: number[]) {
  return sum(...args) / args.length;
}

export function ceil(num: number, digits = 0) {
  digits = digits ** 10;
  return Math.ceil(num * digits) / digits;
}

export function round(num: number, digits = 0) {
  digits = digits ** 10;
  return Math.round(num * digits) / digits;
}

export function floor(num: number, digits = 0) {
  digits = digits ** 10;
  return Math.floor(num * digits) / digits;
}

export const hexToBigint = (s: string) =>
  s
    .toLowerCase()
    .split("")
    .reverse()
    .map(
      (v, i) => BigInt("0123456789abcdef".indexOf(v)) * BigInt(16) ** BigInt(i)
    )
    .reduce((a, b) => a + b);

export const binaryToBigint = (s: string) =>
  s
    .replace("-", "")
    .split("")
    .reverse()
    .map((v, i) => BigInt("01".indexOf(v)) * BigInt(2) ** BigInt(i))
    .reduce((a, b) => a + b) * BigInt(s.startsWith("-") ? -1 : 1);
