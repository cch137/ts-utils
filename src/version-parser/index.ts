type part = string | number;

export type VersionLike = string | VersionBaseObject | VersionObject | part[];

export type VersionBaseObject = {
  major: number;
  minor: number;
  patch: number;
  details?: part[];
};

export type VersionObject = VersionBaseObject & {
  details: part[];
  readonly eq: (v: VersionLike) => boolean;
  readonly gt: (v: VersionLike) => boolean;
  readonly gte: (v: VersionLike) => boolean;
  readonly lt: (v: VersionLike) => boolean;
  readonly lte: (v: VersionLike) => boolean;
  readonly toString: () => string;
  readonly parse: (v: VersionLike) => VersionObject;
};

export const parse = (v?: VersionLike): VersionObject => {
  const parts = Array.isArray(v)
    ? v
    : typeof v === "string"
    ? v
      ? v.split(".")
      : []
    : v
    ? [v.major, v.minor, v.patch, ...(v.details || [])]
    : [];
  const [_major = 0, _minor = 0, _patch = 0, ...details] = parts;
  const length = Array.isArray(v) ? v.length : parts.length;
  const major = Number(_major);
  const minor = Number(_minor);
  const patch = Number(_patch);

  const toString = () => {
    if (length === 0) return "";
    return [major, minor, patch, ...details].map((s) => s.toString()).join(".");
  };

  const eq = (v: VersionLike) => {
    const { major: _1, minor: _2, patch: _3 } = parse(v);
    if (major != _1) return false;
    if (minor != _2) return false;
    if (patch != _3) return false;
    return true;
  };

  const gte = (v: VersionLike) => {
    const { major: _1, minor: _2, patch: _3 } = parse(v);
    if (major > _1) return true;
    if (major < _1) return false;
    if (minor > _2) return true;
    if (minor < _2) return false;
    if (patch >= _3) return true;
    return false;
  };

  const gt = (v: VersionLike) => {
    const { major: _1, minor: _2, patch: _3 } = parse(v);
    if (major > _1) return true;
    if (major < _1) return false;
    if (minor > _2) return true;
    if (minor < _2) return false;
    if (patch > _3) return true;
    return false;
  };

  const lte = (v: VersionLike) => {
    const { major: _1, minor: _2, patch: _3 } = parse(v);
    if (major < _1) return true;
    if (major > _1) return false;
    if (minor < _2) return true;
    if (minor > _2) return false;
    if (patch <= _3) return true;
    return false;
  };

  const lt = (v: VersionLike) => {
    const { major: _1, minor: _2, patch: _3 } = parse(v);
    if (major < _1) return true;
    if (major > _1) return false;
    if (minor < _2) return true;
    if (minor > _2) return false;
    if (patch < _3) return true;
    return false;
  };

  return Object.freeze({
    major,
    minor,
    patch,
    details,
    eq,
    gt,
    gte,
    lt,
    lte,
    toString,
    parse,
  });
};

export const serialize = (v: VersionLike) => parse(v).toString();
