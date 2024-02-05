import type { Partial, None } from '../types';

const ON = 'on';
const OFF = 'off';
const CHANGE = 'change';

export type StoreListener<T> = (o: T, p: StoreType<T>, k: keyof T, v: any) => any;

export type StoreAssignSetter<T> = (o: T, p: StoreType<T>) => None | Partial<T>;

export type StoreUpdateGetter<T> = () => None | Partial<T> | Promise<None | Partial<T>>;

export type StoreType<T> = T & {
  readonly $on: (callback: StoreListener<T>) => () => void;
  readonly $off: (callback: StoreListener<T>) => void;
  readonly $assign: (o?: None | Partial<T> | StoreAssignSetter<T>, dispatch?: boolean) => void;
  readonly $object: T;
}

export type StoreExtObject<T> = T & {
  readonly $init: () => Promise<StoreExtType<T>>;
  readonly $update: () => Promise<StoreExtType<T>>;
  readonly $inited: boolean;
  readonly $initing: boolean;
  readonly $updating: boolean;
  readonly $lastUpdated: Date;
  $updateInterval?: number;
}

export type StoreExtType<T> = StoreType<StoreExtObject<T>>;

export type StoreOptions = {
  /** Default value of `autoInit` is `false`. Initialize when the store instance is created. */
  autoInit?: boolean;
  /** Initialize when the `$on` called. */
  initAfterOn?: boolean;
  /** Only check when setter is called, if last updated over update interval, then update. */
  lazyUpdate?: boolean;
  /** If the `updateInterval`(ms) is not provided, the store will not update automatically. */
  updateInterval?: number;
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
    et.dispatchEvent(new Event(ON));
    return () => $off(callback);
  }

  const $off = (callback: StoreListener<T>) => {
    const wrappedCallback = listners.get(callback);
    listners.delete(callback);
    if (wrappedCallback) et.removeEventListener(CHANGE, wrappedCallback);
    et.dispatchEvent(new Event(OFF));
  }

  const $assign = (obj?: Partial<T> | StoreAssignSetter<T>, dispatch = true) => {
    if (!obj) return;
    if (typeof obj === 'function') {
      $assign(obj(proxy.$object, proxy));
      return;
    }
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
  let _initingWait: Promise<StoreExtType<T>>;

  const $init = async () => {
    if (proxyExt.$initing) return await _initingWait;
    if (proxyExt.$inited) return proxyExt;
    proxyExt.$assign({$initing: true});
    _initingWait = $update();
    await _initingWait;
    proxyExt.$assign({$initing: false, $inited: true});
    return proxyExt;
  }

  const $update = async () => {
    try {
      clearTimeout(_timeout);
      proxyExt.$assign({$updating: true});
      const part = await updateGetter();
      if (part) proxy.$assign(part);
    } catch (e) {
      console.error(e)
    } finally {
      proxyExt.$assign({$updating: false, $lastUpdated: new Date});
      if (proxyExt.$updateInterval !== undefined && !lazyUpdate) {
        _timeout = setTimeout($update, proxyExt.$updateInterval);
      }
    }
    return proxyExt;
  }

  proxyExt.$assign({
    $init,
    $update,
    $inited: false,
    $initing: false,
    $updating: false,
    $lastUpdated: new Date,
    $updateInterval: options.updateInterval,
  }, false);

  const {lazyUpdate} = options;
  if (options.autoInit) $init();
  if (options.initAfterOn) et.addEventListener(ON, async () => {
    await $init();
    const {$updateInterval, $lastUpdated, $updating} = proxyExt;
    if (lazyUpdate && !$updating && $updateInterval !== undefined) {
      if (Date.now() - $lastUpdated.getTime() > $updateInterval) {
        $update();
      }
    }
  });
  if (lazyUpdate) et.addEventListener(CHANGE, () => {
    const {$updateInterval, $lastUpdated, $updating} = proxyExt;
    if (!$updating && $updateInterval !== undefined) {
      if (Date.now() - $lastUpdated.getTime() > $updateInterval) {
        $update();
      }
    }
  });
  delete options.autoInit;
  delete options.initAfterOn;
  delete options.updateInterval;
  delete options.lazyUpdate;

  return proxyExt;
};

export { store };
export default store;
