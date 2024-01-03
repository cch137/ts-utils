import safeStringify from "./safe-stringify"

function str(obj: any) {
  switch (typeof obj) {
    case 'string':
      return obj
    case 'bigint':
    case 'boolean':
    case 'function':
    case 'number':
    case 'symbol':
      return obj.toString() as string
    case 'undefined':
      return 'null'
    case 'object':
      return safeStringify(obj)
  }
}

function lower(o: any) {
  return str(o).toLowerCase()
}

function upper(o: any) {
  return str(o).toUpperCase()
}

export {
  lower
}

export default str
