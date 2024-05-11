type KeysWithOptional<T> = {
  [K in keyof T]-?: {} extends { [P in K]: T[K] } ? K : never;
}[keyof T];

type MergedProperties<A, B, K extends keyof A & keyof B> = {
  [P in K]: A[P] | Exclude<B[P], undefined>;
};

type Identity<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

type MergeImplement<A, B> = Identity<
  Pick<B, Exclude<keyof B, keyof A>> &
    Pick<A, Exclude<keyof A, KeysWithOptional<A>>> &
    Pick<A, Exclude<KeysWithOptional<A>, keyof B>> &
    MergedProperties<B, A, KeysWithOptional<A> & keyof B>
>;

export type Merge<L extends readonly [...any]> = L extends [infer A, ...infer B]
  ? MergeImplement<A, Merge<B>>
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
