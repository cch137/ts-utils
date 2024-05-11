import isIterable from "../../is-iterable";

export default function safeStringify(obj: any): string {
  try {
    const seenObjects = new Set();
    const reviver = (_: string, value: any) => {
      if (typeof value === "object" && value !== null) {
        if (seenObjects.has(value)) return undefined;
        seenObjects.add(value);
        if (isIterable(value)) value = [...value];
      }
      return value;
    };
    return JSON.stringify(obj, reviver);
  } catch {
    return obj?.toString === undefined ? `${obj}` : (obj.toString() as string);
  }
}
