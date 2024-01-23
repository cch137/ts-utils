const CHANGE = 'change';

type StoreListener<T> = (o: StoreType<T>, k?: keyof T, v?: any) => any;

type StoreType<T> = T & {
  $on: (callback: StoreListener<T>) => void;
  $off: (callback: StoreListener<T>) => void;
}

class StoreChangeEvent<T, K = keyof T, V = any> extends Event {
  readonly object: T;
  readonly key: K;
  readonly value: V;
  constructor(object: T, key: K, value: V) {
    super(CHANGE);
    this.object = object;
    this.key = key;
    this.value = value;
  }
}

const checkStoreOriginalObject = (data: object) => {
  const keys = Object.keys(data);
  if (keys.includes('$on')) throw new Error('Store original object cannot have "$on" key')
  if (keys.includes('$off')) throw new Error('Store original object cannot have "$off" key')
}

const store = <T extends object>(data: T): StoreType<T> => {
  checkStoreOriginalObject(data);
  const et = new EventTarget();
  const listners = new Map<StoreListener<T>, (e: Event) => Promise<void>>();
  const proxy: StoreType<T> = new Proxy(data, {
    // @ts-ignore
    get(target: T, key: keyof T) {
      if (key === '$on') return $on;
      if (key === '$off') return $off;
      return target[key];
    },
    // @ts-ignore
    set(target: T, key: keyof T, value) {
      target[key] = value;
      et.dispatchEvent(new StoreChangeEvent(proxy, key, value));
      return true;
    },
  }) as any;
  const $on = (callback: StoreListener<T>) => {
    const wrappedCallback = async (e: Event | StoreChangeEvent<T>) => {
      if (e instanceof StoreChangeEvent) callback(proxy, e.key, e.value);
      else callback(proxy);
    }
    listners.set(callback, wrappedCallback);
    et.addEventListener(CHANGE, wrappedCallback);
  }
  const $off = (callback: StoreListener<T>) => {
    const wrappedCallback = listners.get(callback);
    listners.delete(callback);
    if (wrappedCallback) et.removeEventListener(CHANGE, wrappedCallback);
  }
  return proxy;
};

export type {
  StoreType,
  StoreListener,
}

export default store;
