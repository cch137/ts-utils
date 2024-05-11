export type PartialObject<T> = { [key in keyof T]?: any };
export type None = void | undefined | null;
