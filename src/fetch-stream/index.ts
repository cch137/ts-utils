import Emitter from "../emitter";
import merge from "../merge";

type FetchStreamOptions<
  T = Uint8Array,
  Encoding extends string | undefined = undefined,
  ChunkHandler extends
    | ((chunk: Encoding extends string ? string : Uint8Array) => T)
    | undefined = undefined,
  KeepChunks extends boolean = false
> = Partial<{
  encoding: Encoding;
  chunkHandler: ChunkHandler;
  keepChunks: KeepChunks;
}>;

type StreamResponseEmitter<T = any> = Emitter<{
  data: [chunk: T];
  error: [err: any];
  end: [];
}>;

type StreamResponse<T = Uint8Array> = Response &
  StreamResponseEmitter<T> & {
    chunks: T[];
    readonly done: boolean;
    process: Promise<void>;
    controller: AbortController;
  };

function fetchStream<KeepChunks extends boolean, Chunk = string>(
  input: string | URL | RequestInfo | globalThis.Request,
  init?: RequestInit &
    FetchStreamOptions<Chunk, string, (chunk: string) => Chunk, KeepChunks>
): Promise<StreamResponse<Chunk>>;
function fetchStream<KeepChunks extends boolean, Chunk = Uint8Array>(
  input: string | URL | RequestInfo | globalThis.Request,
  init?: RequestInit &
    FetchStreamOptions<
      Chunk,
      undefined,
      (chunk: Uint8Array) => Chunk,
      KeepChunks
    >
): Promise<StreamResponse<Chunk>>;
function fetchStream<KeepChunks extends boolean, Chunk = Uint8Array>(
  input: string | URL | RequestInfo | globalThis.Request,
  init?: RequestInit &
    FetchStreamOptions<Uint8Array, undefined, undefined, KeepChunks>
): Promise<StreamResponse<Uint8Array>>;
function fetchStream<KeepChunks extends boolean, T>(
  input: string | URL | RequestInfo | globalThis.Request,
  {
    encoding,
    chunkHandler,
    keepChunks,
    signal,
    ...init
  }: RequestInit &
    FetchStreamOptions<T, string, (chunk: any) => T, KeepChunks> = {}
) {
  let DONE = false;
  if (keepChunks === undefined)
    keepChunks = fetchStream.keepChunks as KeepChunks;
  return new Promise(async (resolve1, reject) => {
    const controller = new AbortController();
    if (signal) signal.addEventListener("abort", () => controller.abort());
    const process = new Promise<void>(async (resolve2) => {
      try {
        const emitter: StreamResponseEmitter<T> = new Emitter();
        const response = await fetch(input, {
          ...init,
          signal: controller.signal,
        });
        resolve1(merge(props, response, emitter));
        const reader = response.body!.getReader();
        if (encoding) {
          const textDecoder = new TextDecoder(encoding);
          const _chunkHandler = chunkHandler;
          chunkHandler = _chunkHandler
            ? (c) => _chunkHandler(textDecoder.decode(c)) as T
            : (c) => textDecoder.decode(c) as T;
        } else if (!chunkHandler) chunkHandler = (c) => c;
        while (true) {
          const { done, value } = await reader.read();
          if (value) {
            try {
              const chunk = chunkHandler(value);
              if (keepChunks) chunks!.push(chunk);
              emitter.emit("data", chunk);
            } catch (e) {
              console.error(e);
              emitter.emit("error", e);
            }
          }
          if (done) {
            DONE = done;
            emitter.emit("end");
            break;
          }
        }
      } catch (e) {
        reject(e);
      } finally {
        resolve2();
      }
    });
    const chunks = keepChunks ? ([] as T[]) : [];
    const props = {
      get done() {
        return DONE;
      },
      chunks,
      process,
      controller,
    };
  });
}

fetchStream.keepChunks = false;

export default fetchStream;
