type KeysWithOptional<T> = {
  [K in keyof T]-?: {} extends { [P in K]: T[K] } ? K : never;
}[keyof T];

type MergedProperties<L, R, K extends keyof L & keyof R> = {
  [P in K]: L[P] | Exclude<R[P], undefined>;
};

type Identity<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

type MergeImplement<L, R> = Identity<
  Pick<L, Exclude<keyof L, keyof R>> &
    Pick<R, Exclude<keyof R, KeysWithOptional<R>>> &
    Pick<R, Exclude<KeysWithOptional<R>, keyof L>> &
    MergedProperties<L, R, KeysWithOptional<R> & keyof L>
>;

export type Merge<A extends readonly [...any]> = A extends [infer L, ...infer R]
  ? MergeImplement<L, Merge<R>>
  : unknown;

const findObj = <T extends object>(
  objs: T[],
  p: string | number | symbol
): any => objs.find((o) => p in o) || objs[0];

export default function mergeWithProxy<T extends object[]>(
  ...objs: [...T]
): Merge<T> {
  Object.freeze(objs);
  return new Proxy(objs[0], {
    has(_, p) {
      return Boolean(objs.find((o) => p in o));
    },
    get(_, p) {
      return findObj(objs, p)[p];
    },
    set(_, p, v) {
      findObj(objs, p)[p] = v;
      return true;
    },
    deleteProperty(_, p) {
      delete findObj(objs, p)[p];
      return true;
    },
    ownKeys(_) {
      return [...new Set(objs.map((o) => Object.keys(o)).flat())];
    },
    defineProperty(_, p, a) {
      Object.defineProperty(findObj(objs, p), p, a);
      return true;
    },
    getOwnPropertyDescriptor(_, p) {
      return Object.getOwnPropertyDescriptor(findObj(objs, p), p);
    },
  }) as Merge<T>;
}
