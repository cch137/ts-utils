import Group from "../group";

type EventMap<T> = Record<keyof T, any[]> | DefaultEventMap;
type DefaultEventMap = [never];
type Args<K, T> = T extends DefaultEventMap
  ? [...args: any[]]
  : K extends keyof T
  ? T[K]
  : never;
type Key<K, T> = T extends DefaultEventMap ? string | symbol : K | keyof T;
type TListener<K, T, F> = T extends DefaultEventMap
  ? F
  : K extends keyof T
  ? T[K] extends unknown[]
    ? (...args: T[K]) => void
    : never
  : never;
type Listener1<K, T> = TListener<K, T, (...args: any[]) => void>;

class Listener {
  readonly item: Function;
  readonly once: boolean;
  constructor(listener: Function, isOnce = false) {
    this.item = listener;
    this.once = isOnce;
  }
}

export default class Emitter<T extends EventMap<T>> {
  private listenerMap = new Map<any, Group<Listener>>();

  on<K>(eventName: Key<K, T>, listener: Listener1<K, T>, once = false): this {
    if (!this.listenerMap.has(eventName))
      this.listenerMap.set(eventName, new Group());
    this.listenerMap.get(eventName)?.push(new Listener(listener, once));
    return this;
  }

  once<K>(eventName: Key<K, T>, listener: Listener1<K, T>): this {
    return this.on(eventName, listener, true);
  }

  off<K>(eventName: Key<K, T>, listener: Listener1<K, T>): this {
    const listeners = this.listenerMap.get(eventName);
    if (listeners) {
      const length = listeners.length;
      for (let i = 0; i < length; i++) {
        const l = listeners[i];
        const { item } = l;
        if (item === listener) {
          listeners.delete(l);
          break;
        }
      }
    }
    return this;
  }

  emit<K>(eventName: Key<K, T>, ...args: Args<K, T>): boolean {
    const listeners = this.listenerMap.get(eventName);
    if (listeners) {
      listeners
        .filter((i) => i.once)
        .map((i) => (listeners.deleteOne(i), i))
        .forEach(async (i) => i?.item(...args));
      listeners.forEach(async (i) => i.item(...args));
    }
    return true;
  }
}
