type part = string | number;

export const parse = (s: string) => new Version(s);

export class Version {
  major?: part;
  minor?: part;
  patch?: part;
  details: part[];
  constructor(s: string) {
    const [major, minor, patch, ...details] = s.split('.');
    this.major = major;
    this.minor = minor;
    this.patch = patch;
    this.details = details;
  }
  toString() {
    if (!this.major && !this.minor && !this.patch) return '';
    return [this.major, this.minor, this.patch, ...this.details].map(s => s ? s.toString(): '').join('.');
  }
  static parse = parse;
}

export default Version;
