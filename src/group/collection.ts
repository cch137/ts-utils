import Group from "./index.js";

export default class Collection<K = any, V = any> extends Map<K, Group<V>> {
  group(key: K): Group<V> {
    if (super.has(key)) return super.get(key)!;
    const g = new Group<V>();
    return super.set(key, g), g;
  }

  once(key: K): Group<V> | undefined {
    const g = super.get(key);
    return super.delete(key), g;
  }

  trim() {
    [...this].forEach(([k, g]) => {
      if (g.length === 0) this.delete(k);
    });
  }
}

export class WeakCollection<
  K extends WeakKey = object,
  V = any
> extends WeakMap<K, Group<V>> {
  group(key: K): Group<V> {
    if (super.has(key)) return super.get(key)!;
    const g = new Group<V>();
    return super.set(key, g), g;
  }

  once(key: K): Group<V> | undefined {
    const g = super.get(key);
    return super.delete(key), g;
  }
}
