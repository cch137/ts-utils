import type { Partial, None } from '../types';

const CHANGE = 'change';

type StoreListener<T> = (o: T, p: StoreType<T>, k: keyof T, v: any) => any;

type StoreUpdateGetter<T> = () => None | Partial<T> | Promise<None | Partial<T>>;

type StoreType<T> = T & {
  readonly $on: (callback: StoreListener<T>) => () => void;
  readonly $off: (callback: StoreListener<T>) => void;
  readonly $assign: (o?: Partial<T>, dispatch?: boolean) => void;
  readonly $object: T;
}

type StoreExtObject<T> = T & {
  readonly $init: () => Promise<StoreExtType<T>>;
  readonly $update: () => Promise<StoreExtType<T>>;
  readonly $inited: boolean;
  readonly $initing: boolean;
  readonly $updating: boolean;
  readonly $lastUpdated: Date;
  $updateInterval: number;
}

type StoreExtType<T> = StoreType<T> & StoreType<StoreExtObject<T>>;

type StoreOptions = {
  /** Default value of `autoInit` is `true`. */
  autoInit?: boolean;
  /** If the `updateInterval`(ms) is not provided, the store will not update automatically. */
  updateInterval?: number;
}

export type {
  StoreListener,
  StoreUpdateGetter,
  StoreType,
  StoreExtType,
  StoreOptions,
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

/** 
 * If `data` is an array, `$assign` will rewrite the entire store when passed an array.
 * Invoking `$update` and `$init` will also rewrite the store.
 */
function store<T extends Array<I>, I>(data: T): StoreType<T>;
function store<T extends object>(data: T): StoreType<T>;
function store<T extends Array<I>, I>(data: T, updateGetter: StoreUpdateGetter<T>, options?: StoreOptions): StoreExtType<T>;
function store<T extends object>(data: T, updateGetter: StoreUpdateGetter<T>, options?: StoreOptions): StoreExtType<T>;
function store<T extends object>(
  data: T,
  updateGetter?: StoreUpdateGetter<T>,
  options: StoreOptions = {}
) {
  const isArray = Array.isArray(data);
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

  const $assign = (obj?: {[k in keyof T]?: any}, dispatch = true) => {
    if (!obj) return;
    if (Array.isArray(obj) && isArray) {
      data.splice(0, data.length);
      data.push(...obj);
    } else {
      Object.assign(data, obj);
    }
    if (dispatch) et.dispatchEvent(new StoreChangeEvent(proxy));
  }

  const proxy: StoreType<T> = new Proxy(data, {
    get(target, key) {
      switch (key) {
        case '$on': return $on;
        case '$off': return $off;
        case '$assign': return $assign;
        case '$object': return isArray ? [...target as Array<any>] : {...target};
      }
      return (target as T)[key as keyof T];
    },
    set(target, key, value) {
      (target as T)[key as keyof T] = value;
      et.dispatchEvent(new StoreChangeEvent(proxy, key, value));
      return true;
    },
  }) as StoreType<T>;

  if (!updateGetter) return proxy;

  const proxyExt: StoreExtType<T> = proxy as StoreExtType<T>;
  let _timeout: NodeJS.Timeout;
  let _initPromise: Promise<StoreExtType<T>>;

  const $init = async () => {
    if (proxyExt.$inited) return proxyExt;
    if (proxyExt.$initing) return await _initPromise;
    proxyExt.$assign({$initing: true});
    _initPromise = $update();
    await _initPromise;
    proxyExt.$assign({$initing: false, $inited: true});
    return proxyExt;
  }

  const $update = async () => {
    try {
      clearTimeout(_timeout);
      proxyExt.$assign({$updating: true});
      const part = await updateGetter();
      if (part) proxyExt.$assign(part);
    } catch (e) {
      console.error(e)
    } finally {
      proxyExt.$assign({$updating: false, $lastUpdated: new Date});
      if (proxyExt.$updateInterval !== undefined) {
        _timeout = setTimeout($update, proxyExt.$updateInterval);
      }
    }
    return proxyExt;
  }

  proxy.$assign({
    $init,
    $update,
    $inited: false,
    $initing: false,
    $updating: false,
    $lastUpdated: new Date,
    $updateInterval: options.updateInterval,
  } as StoreExtObject<T>, false);

  if (options.autoInit) $init();
  delete options.autoInit;
  delete options.updateInterval;

  return proxyExt;
};

export default store;
