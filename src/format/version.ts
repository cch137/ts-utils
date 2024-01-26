type part = string | number;

export const parse = (s?: string) => new Version(s);

export class Version {
  readonly length: number;
  major: number;
  minor: number;
  patch: number;
  details: part[];
  constructor(s: string = '') {
    const parts = s.split('.');
    const [major=0, minor=0, patch=0, ...details] = parts;
    this.length = parts.length;
    this.major = Number(major);
    this.minor = Number(minor);
    this.patch = Number(patch);
    this.details = details;
  }
  toString() {
    if (this.length === 0) return '';
    return [this.major, this.minor, this.patch, ...this.details].map(s => s ? s.toString(): '').join('.');
  }
  static parse = parse;
}

export default Version;
