import random, { Random } from "../../random";
import toSeed from "./to-seed";
import baseConverter, { getCharset } from "../../str/base-converter";

const randint = (start: number, end: number) => random.randint(start, end);

const maskingCharsetGenerator = (
  _charset: string,
  randomer: Random = random
) => {
  const charset = randomer.shuffle(_charset).split("");
  return () => {
    charset.push(charset.shift() as string);
    return charset;
  };
};

const mask = (
  _string: string | string[],
  charset: number | string = 16,
  level = 1,
  seed?: any
): string => {
  const charsetNum = Number.isNaN(+charset) ? 64 : +charset;
  const realCharset = getCharset(charset);
  const seed1 = toSeed(seed !== undefined ? seed : randint(0, charsetNum));
  const rd1 = new Random(seed1);
  const generator = maskingCharsetGenerator(
    realCharset,
    new Random(rd1.randint(0, 1000000))
  );
  const characters = typeof _string === "string" ? _string.split("") : _string;
  const result = [
    seed !== undefined
      ? realCharset[randint(0, charsetNum)]
      : baseConverter(seed1, 10, charset),
    ...characters.map((char) => generator()[realCharset.indexOf(char)]),
  ] as string[];
  return --level < 1 ? result.join("") : mask(result, charset, level, seed);
};

const unmask = (
  string: string | string[],
  charset: number | string = 16,
  level = 1,
  seed?: any
): any => {
  const realCharset = getCharset(charset);
  const seed1 = toSeed(
    seed !== undefined ? seed : +baseConverter(string[0], charset, 10)
  );
  const rd1 = new Random(seed1);
  const generator = maskingCharsetGenerator(
    realCharset,
    new Random(rd1.randint(0, 1000000))
  );
  const characters = (
    typeof string === "string" ? string.split("") : string
  ).slice(1, string.length);
  const result = characters.map(
    (char) => realCharset[generator().indexOf(char)]
  );
  return --level < 1 ? result.join("") : unmask(result, charset, level, seed);
};

export { mask, unmask };
