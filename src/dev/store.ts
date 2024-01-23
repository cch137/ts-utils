const CHANGE = 'change';

type StoreListener<T> = (o: T, k: keyof T, v: any) => any;

type StoreType<T> = T & {
  $on: (callback: StoreListener<T>) => () => void;
  $off: (callback: StoreListener<T>) => void;
  readonly $object: T;
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
  for (const reserved of ['$on', '$off', '$object']) {
    if (keys.includes('$on')) throw new Error(`Store original object cannot have "${reserved}" key`);
  }
}

const store = <T extends object>(data: T): StoreType<T> => {
  checkStoreOriginalObject(data);
  const et = new EventTarget();
  const listners = new Map<StoreListener<T>, (e: Event) => Promise<void>>();
  const proxy: StoreType<T> = new Proxy(data, {
    get(target, key) {
      if (key === '$on') return $on;
      if (key === '$off') return $off;
      if (key === '$object') return {...target};
      return (target as T)[key as keyof T];
    },
    set(target, key, value) {
      (target as T)[key as keyof T] = value;
      et.dispatchEvent(new StoreChangeEvent(proxy.$object, key, value));
      return true;
    },
  }) as any;
  const $on = (callback: StoreListener<T>) => {
    const wrappedCallback = async (e: Event | StoreChangeEvent<T>) => {
      if (!(e instanceof StoreChangeEvent)) throw new Error(`Dispatched event is not a instance of ${StoreChangeEvent}`);
      callback(e.object, e.key, e.value);
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
  return proxy;
};

export type {
  StoreType,
  StoreListener,
  store,
}

export default store;
