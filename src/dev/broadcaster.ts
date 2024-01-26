const et = new EventTarget();

class DataEvent<T> extends Event {
  readonly data: T;
  constructor(name: string, data: T) {
    super(name);
    this.data = data as T;
  }
}

export type MessageHandler<T> = (e: DataEvent<T>) => void;

export const subscribe = <T>(name: string, handler: MessageHandler<T>) => {
  if (!handler) return () => void 0;
  et.addEventListener(name, handler as EventListener);
  return () => unsubscribe(name, handler);
}

export const unsubscribe = <T>(name: string, handler: MessageHandler<T>) => {
  et.removeEventListener(name, handler as EventListener);
}

export const broadcast = <T>(name: string, data: T) => {
  et.dispatchEvent(new DataEvent(name, data));
}

export default class Broadcaster<T> {
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  subscribe(handler: (e: DataEvent<T>) => void) {
    return () => subscribe(this.name, handler);
  }

  unsubscribe(handler: (e: DataEvent<T>) => void) {
    return unsubscribe(this.name, handler);
  }

  broadcast(data: T) {
    return broadcast(this.name, data);
  }
}
