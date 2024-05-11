import store from "../store";

type ErrorHandler = (e: any) => void;

export default function wrapStreamResponse(
  res: Response,
  {
    controller = new AbortController(),
    maxErrorCount = 128,
    handleError = (e) => console.error(e),
  }: {
    controller?: AbortController;
    maxErrorCount?: number;
    handleError?: ErrorHandler;
  } = {}
) {
  const t0 = Date.now();
  const getDtms = () => Date.now() - t0;
  const chunks = store([] as string[]);
  const decoder = new TextDecoder("utf8");
  let readTimeout: NodeJS.Timeout;
  const extendTimeout = () => {
    clearTimeout(readTimeout);
    return setTimeout(() => handleError("Response Timeout"), 60000);
  };
  if (!res.body) throw new Error("Failed to request");
  const reader = res.body.getReader();
  const promise = new Promise<{ dtms: number }>(async (resolve) => {
    readTimeout = extendTimeout();
    let errCount = 0;
    while (errCount < maxErrorCount) {
      try {
        const { value, done } = await reader.read();
        if (done) break;
        const chunkText = decoder.decode(value);
        chunks.push(chunkText);
        readTimeout = extendTimeout();
      } catch (e) {
        if (controller && controller.signal.aborted) break;
        errCount++;
        console.error(
          `Failed to read response${e instanceof Error ? ": " + e.message : ""}`
        );
      }
    }
    clearTimeout(readTimeout);
    resolve({ dtms: getDtms() });
  });
  const value = {
    get answer() {
      return chunks.join("");
    },
    get dtms() {
      return getDtms();
    },
    chunks,
    promise,
    controller,
  };
  return value;
}
