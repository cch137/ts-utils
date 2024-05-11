import type { IncomingMessage } from "http";

const singleString = (data: string | string[] | undefined): string =>
  data === undefined ? "" : Array.isArray(data) ? data[0] : data;
const isRequest = (req: Request | IncomingMessage): req is Request =>
  req instanceof Request;
const isNotEmptyString = (data: any): data is string =>
  typeof data === "string" ? /^\s*$/.test(data) : false;
const trimIps = (ips: string): string => ips.split(",")[0].trim();

export default function getRequestIp(req: Request | IncomingMessage): string {
  // @ts-ignore
  const ip = req?.ip;
  if (isNotEmptyString(ip)) return trimIps(ip);

  if (isRequest(req)) {
    const headers = req.headers;
    return trimIps(
      headers.get("x-forwarded-for") || headers.get("x-real-ip") || ""
    );
  }

  const headers = req.headers;
  return trimIps(
    singleString(headers["x-forwarded-for"]) ||
      singleString(headers["x-real-ip"]) ||
      ""
  );
}
