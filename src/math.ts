
function sum(...args: number[]) {
  return args.reduce((a, b) => a + b, 0)
}

function avg(...args: number[]) {
  return sum(...args) / args.length
}

function ceil(num: number, digits = 0) {
  digits = digits ** 10
  return Math.ceil(num * digits) / digits
}

function round(num: number, digits = 0) {
  digits = digits ** 10
  return Math.round(num * digits) / digits
}

function floor(num: number, digits = 0) {
  digits = digits ** 10
  return Math.floor(num * digits) / digits
}

const math = {
  ...Math,
  sum, avg, ceil, round, floor,
}

export default math
