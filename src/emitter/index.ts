import type Group from "../group/index.js";
import Collection, { WeakCollection } from "../group/collection.js";

type EventMap<T> = Record<keyof T, any[]> | DefaultEventMap;
type DefaultEventMap = [never];
type Args<K, T> = T extends DefaultEventMap
  ? [...args: any[]]
  : K extends keyof T
  ? T[K]
  : never;
type _Key<K, T> = T extends DefaultEventMap
  ? string | symbol | number
  : K | keyof T;
type TListener<K, T, F> = T extends DefaultEventMap
  ? F
  : K extends keyof T
  ? T[K] extends unknown[]
    ? (...args: T[K]) => void
    : never
  : never;
type Listener1<K, T> = TListener<K, T, (...args: any[]) => void>;

export default class Emitter<T extends EventMap<T>> {
  private listeners = new Collection<_Key<any, T>, Function>();
  private onces = new WeakCollection<Group<Function>, Function>();

  on<K>(eventName: _Key<K, T>, listener: Listener1<K, T>): this {
    this.listeners.group(eventName).push(listener);
    return this;
  }

  once<K>(eventName: _Key<K, T>, listener: Listener1<K, T>): this {
    const l = this.listeners.group(eventName);
    this.onces.group((l.push(listener), l)).push(listener);
    return this;
  }

  off<K>(eventName: _Key<K, T>, listener: Listener1<K, T>): this {
    this.listeners.get(eventName)?.deleteOne(listener);
    this.listeners.trim();
    return this;
  }

  emit<K>(eventName: _Key<K, T>, ...args: Args<K, T>): boolean {
    const l = this.listeners.get(eventName);
    l?.forEach(async (i) => i(...args));
    if (l) this.onces.once(l)?.forEach((i) => l.deleteOne(i));
    this.listeners.trim();
    return true;
  }

  clear<K>(eventName: _Key<K, T>, ...args: Args<K, T>): this {
    this.listeners.delete(eventName);
    return this;
  }
}
