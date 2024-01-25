function parse(s: string) {
  const [major, minor, patch, ...details] = s.split('.');
  return {
    major,
    minor,
    patch,
    details,
  }
}

type part = string | number;

function serialize(major?: part, minor?: part, patch?: part, ...details: part[]) {
  return [major, minor, patch, ...details].map(s => s ? s.toString(): '').join('.');
}

const version = {
  parse,
  serialize,
}

export {
  parse,
  serialize,
}

export default version;
