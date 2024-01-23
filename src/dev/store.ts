const CHANGE = 'change';

type StoreListener<T> = (o: T, k?: keyof T, v?: any) => any;

type StoreType<T> = T & {
  $on: (callback: StoreListener<T>) => void;
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
    // @ts-ignore
    get(target: T, key: keyof StoreType<T>) {
      if (key === '$on') return $on;
      if (key === '$off') return $off;
      if (key === '$object') return {...target};
      return target[key];
    },
    // @ts-ignore
    set(target: T, key: keyof T, value) {
      data = {...target, key: value};
      et.dispatchEvent(new StoreChangeEvent(proxy, key, value));
      return true;
    },
  }) as any;
  const $on = (callback: StoreListener<T>) => {
    const wrappedCallback = async (e: Event | StoreChangeEvent<T>) => {
      if (e instanceof StoreChangeEvent) callback(data, e.key, e.value);
      else callback(data);
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
  store,
}

export default store;