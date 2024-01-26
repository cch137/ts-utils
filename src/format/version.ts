type part = string | number;

type VersionLike = string | Version | part[];

export const parse = (s?: VersionLike) => new Version(s);

export class Version {
  static parse = parse;
  static eq = (lhs: VersionLike, rhs: VersionLike) => parse(lhs).eq(parse(rhs));
  static gte = (lhs: VersionLike, rhs: VersionLike) => parse(lhs).gte(parse(rhs));
  static gt = (lhs: VersionLike, rhs: VersionLike) => parse(lhs).gt(parse(rhs));
  static lte = (lhs: VersionLike, rhs: VersionLike) => parse(lhs).lte(parse(rhs));
  static lt = (lhs: VersionLike, rhs: VersionLike) => parse(lhs).lt(parse(rhs));

  readonly length: number;
  major: number;
  minor: number;
  patch: number;
  details: part[];

  constructor(v: VersionLike = '') {
    const parts = Array.isArray(v)
      ? v
      : typeof v === 'string'
        ? v ? [] : v.split('.')
        : [v.major, v.minor, v.patch, ...v.details];
    const [major=0, minor=0, patch=0, ...details] = parts;
    this.length = Array.isArray(v) ? v.length : parts.length;
    this.major = Number(major);
    this.minor = Number(minor);
    this.patch = Number(patch);
    this.details = details;
  }

  toString() {
    if (this.length === 0) return '';
    return [this.major, this.minor, this.patch, ...this.details].map(s => s.toString()).join('.');
  }

  eq(v: VersionLike) {
    const { major, minor, patch } = parse(v);
    if (this.major != major) return false;
    if (this.minor != minor) return false;
    if (this.patch != patch) return false;
    return true;
  }

  gte(v: VersionLike) {
    const { major, minor, patch } = parse(v);
    if (this.major < major) return false;
    if (this.minor < minor) return false;
    if (this.patch < patch) return false;
    return true;
  }

  gt(v: VersionLike) {
    const { major, minor, patch } = parse(v);
    if (this.major <= major) return false;
    if (this.minor <= minor) return false;
    if (this.patch <= patch) return false;
    return true;
  }

  lte(v: VersionLike) {
    const { major, minor, patch } = parse(v);
    if (this.major > major) return false;
    if (this.minor > minor) return false;
    if (this.patch > patch) return false;
    return true;
  }

  lt(v: VersionLike) {
    const { major, minor, patch } = parse(v);
    if (this.major >= major) return false;
    if (this.minor >= minor) return false;
    if (this.patch >= patch) return false;
    return true;
  }
}

export default Version;
