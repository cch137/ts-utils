export type RestrictedObject<T, AllowedKeys extends keyof T> = {
  [K in AllowedKeys]: T[K];
};
