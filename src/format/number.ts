const hexToBigint = (s: string) =>
  s
    .toLowerCase()
    .split("")
    .reverse()
    .map(
      (v, i) => BigInt("0123456789abcdef".indexOf(v)) * BigInt(16) ** BigInt(i)
    )
    .reduce((a, b) => a + b);

const binToBigint = (s: string) =>
  s
    .replace("-", "")
    .split("")
    .reverse()
    .map((v, i) => BigInt("01".indexOf(v)) * BigInt(2) ** BigInt(i))
    .reduce((a, b) => a + b) * BigInt(s.startsWith("-") ? -1 : 1);

export { hexToBigint, binToBigint };
