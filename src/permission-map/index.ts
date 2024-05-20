const trues = <K extends string | number | symbol>(
  obj: Partial<{
    [k in K]: boolean;
  }>
) => Object.keys(obj).filter((k) => obj[k as K]) as K[];
const lock = <O>(obj: O) => Object.freeze(obj);
const mix = <O1 extends object, O2>(obj1: O1, obj2: O2) =>
  Object.assign(obj1, obj2);

export class PropMap<Key extends string, Prop extends string> {
  readonly #map: Map<Key, Partial<{ [p in Prop]: boolean }>>;
  readonly #template: { [p in Prop]: boolean };

  constructor(
    iterable: readonly [Key, Partial<{ [p in Prop]: boolean }>][],
    _template?: { [p in Prop]: boolean }
  ) {
    this.#map = lock(new Map(iterable.map(([k, p]) => [k, lock({ ...p })])));
    this.#template = lock(
      _template
        ? { ..._template }
        : iterable.reduce((p, [_, c]) => {
            for (const k in c) p[k] = false;
            return p;
          }, {} as { [p in Prop]: boolean })
    );
  }

  get(
    keys: Key | Key[] | Partial<{ [k in Key]: boolean }>
  ): Readonly<Readonly<Prop[]> & Readonly<{ [p in Prop]: boolean }>> {
    if (typeof keys === "string") keys = [keys];
    else if (!Array.isArray(keys)) keys = trues(keys);
    const obj = { ...this.#template };
    for (const k of keys) mix(obj, this.#map.get(k));
    return lock(mix(trues(obj), obj));
  }
}

export class FlagSet<Flag extends string | symbol | number> {
  readonly flags: readonly Flag[];

  constructor(keys: readonly Flag[]) {
    this.flags = lock([...keys]);
  }

  parse(
    num: bigint
  ): Readonly<Readonly<Flag[]> & Readonly<{ [f in Flag]: boolean }>> {
    const length = Math.ceil(Math.log2(Number(num) + 1));
    const obj = {} as { [key in Flag]: boolean };
    this.flags.forEach(
      (k, i) => (obj[k] = (num & (1n << BigInt(length - i - 2))) !== 0n)
    );
    return lock(mix(trues(obj), obj));
  }

  serialize(record: Flag | Flag[] | Partial<{ [f in Flag]: boolean }>) {
    if (!Array.isArray(record) && typeof record !== "object") record = [record];
    let num = 1n << BigInt(this.flags.length);
    const flags = new Set(Array.isArray(record) ? record : trues(record));
    this.flags.forEach((k, i, arr) => {
      if (flags.has(k)) num |= 1n << BigInt(arr.length - i - 1);
    });
    return num;
  }
}

export default class PermissionMap<
  Role extends string,
  Permission extends string
> extends PropMap<Role, Permission> {
  private readonly roleSet: FlagSet<Role>;

  constructor(
    rules: readonly [Role, Partial<{ [p in Permission]: boolean }>][],
    defaultPermissions?: { [key in Permission]: boolean }
  ) {
    super(rules, defaultPermissions);
    this.roleSet = new FlagSet(rules.map(([r]) => r));
  }

  get roles() {
    return this.roleSet.flags;
  }

  parse(auth: bigint | Role | Role[] | Partial<{ [r in Role]: boolean }>) {
    const roles = this.roleSet.parse(
      typeof auth === "bigint" ? auth : this.roleSet.serialize(auth)
    );
    return lock({
      roles,
      permissions: this.get(roles),
    });
  }

  getRoles(auth: bigint) {
    return this.roleSet.parse(auth);
  }

  getPermissions(
    auth: bigint | Role | Role[] | Partial<{ [r in Role]: boolean }>
  ) {
    return this.get(typeof auth === "bigint" ? this.roleSet.parse(auth) : auth);
  }

  serializeRoles(roles: Role | Role[] | Partial<{ [r in Role]: boolean }>) {
    return this.roleSet.serialize(roles);
  }
}
