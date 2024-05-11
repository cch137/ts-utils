import qs from "qs";

const formType = /application\/x-www-form-urlencoded/;
const jsonType = /application\/json/;
const uint8arrayType = /application\/uint8array/;

const parseContentType = (
  contentType?: string
): { type?: "json" | "form" | "uint8array"; charset?: string } => {
  if (!contentType) return {};
  let charset: string | undefined;
  const charsetMatch = contentType.match(/charset=([^\s;]+)/);
  if (charsetMatch && charsetMatch.length > 1) charset = charsetMatch[1];
  if (jsonType.test(contentType)) return { type: "json", charset };
  if (formType.test(contentType)) return { type: "form", charset };
  if (uint8arrayType.test(contentType)) return { type: "uint8array", charset };
  return {};
};

export default async function bodyParser(req: any, res: any, next: any) {
  const chunks: Uint8Array[] = [];
  req.on("data", (chunk: Uint8Array) => {
    chunks.push(chunk);
  });
  const body = await new Promise<Uint8Array>((resolve) => {
    req.on("end", () => {
      const totalLength = chunks.reduce((acc, arr) => acc + arr.length, 0);
      const concatenatedArray = new Uint8Array(totalLength);
      let offset = 0;
      chunks.forEach((chunk) => {
        concatenatedArray.set(chunk, offset);
        offset += chunk.length;
      });
      resolve(concatenatedArray);
    });
  });
  const { type: contentType, charset } = parseContentType(
    req.headers["content-type"]
  );
  switch (contentType) {
    case "form": {
      req.body = qs.parse(new TextDecoder(charset).decode(body));
      break;
    }
    case "json": {
      req.body = JSON.parse(new TextDecoder(charset).decode(body));
      break;
    }
    case "uint8array": {
      req.body = body;
      break;
    }
    default: {
      try {
        req.body = JSON.parse(new TextDecoder(charset).decode(body));
      } catch {
        try {
          req.body = qs.parse(new TextDecoder(charset).decode(body));
        } catch {}
      }
    }
  }
  next();
}
