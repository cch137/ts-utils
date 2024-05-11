export default function str(value: any) {
  switch (typeof value) {
    case "string":
      return value;
    case "bigint":
    case "boolean":
    case "function":
    case "number":
    case "symbol":
      return value.toString() as string;
    case "undefined":
      return "";
    case "object":
      return JSON.stringify(value);
  }
}
