export default class Group<T> extends Array<T> {
  constructor(...items: T[]) {
    super(...items);
  }

  add(...items: T[]): this {
    items.forEach((item) => {
      if (!this.has(item)) this.push(item);
    });
    return this;
  }

  delete(item: T): boolean {
    let found = false;
    for (let i = this.length - 1; i > -1; i--) {
      if (this[i] === item) {
        this.splice(i, 1);
        if (!found) found = true;
      }
    }
    return found;
  }

  deleteLast(item: T): boolean {
    for (let i = this.length - 1; i > -1; i--) {
      if (this[i] === item) {
        this.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  deleteOne(item: T): boolean {
    const length = this.length;
    for (let i = 0; i < length; i++) {
      if (this[i] === item) {
        this.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  has(item: T): boolean {
    return this.includes(item);
  }

  clear(): void {
    this.splice(0);
  }
}
