const CHANGE = 'change';

type StoreListener<T> = (o: T, p: StoreType<T>, k: keyof T, v: any) => any;

type StoreType<T> = T & {
  readonly $on: (callback: StoreListener<T>) => () => void;
  readonly $off: (callback: StoreListener<T>) => void;
  readonly $assign: (o: {[key in keyof T]: any}) => void;
  readonly $object: T;
}

class StoreChangeEvent<T, K = keyof T, V = any> extends Event {
  readonly store: StoreType<T>;
  readonly object: T;
  readonly key?: K;
  readonly value?: V;
  constructor(store: StoreType<T>, key?: K, value?: V) {
    super(CHANGE);
    this.store = store;
    this.object = store.$object;
    this.key = key;
    this.value = value;
  }
}

const store = <T extends object>(data: T): StoreType<T> => {
  const et = new EventTarget();
  const listners = new Map<StoreListener<T>, (e: Event) => Promise<void>>();
  const $on = (callback: StoreListener<T>) => {
    const wrappedCallback = async (e: Event | StoreChangeEvent<T>) => {
      if (!(e instanceof StoreChangeEvent)) throw new Error(`Dispatched event is not a instance of ${StoreChangeEvent}`);
      callback(e.object, e.store, e.key, e.value);
    }
    listners.set(callback, wrappedCallback);
    et.addEventListener(CHANGE, wrappedCallback);
    return () => $off(callback);
  }
  const $off = (callback: StoreListener<T>) => {
    const wrappedCallback = listners.get(callback);
    listners.delete(callback);
    if (wrappedCallback) et.removeEventListener(CHANGE, wrappedCallback);
  }
  const $assign = (obj: {[key in keyof T]: any}) => {
    Object.assign(data, obj);
    et.dispatchEvent(new StoreChangeEvent(proxy));
  }
  const proxy: StoreType<T> = new Proxy(data, {
    get(target, key) {
      switch (key) {
        case '$on': return $on;
        case '$off': return $off;
        case '$assign': return $assign;
        case '$object': return {...target};
      }
      return (target as T)[key as keyof T];
    },
    set(target, key, value) {
      (target as T)[key as keyof T] = value;
      et.dispatchEvent(new StoreChangeEvent(proxy, key, value));
      return true;
    },
  }) as any;
  return proxy;
};

export type {
  StoreType,
  StoreListener,
  store,
}

export default store;
