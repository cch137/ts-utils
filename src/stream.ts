type Handlers = {
  data?: (s: string) => void;
  end?: () => void;
  error?: () => void;
}

function caller (handler?: ((s: string) => void) | (() => void), value?: any) {
  if (handler) handler(value)
}

class StreamPipe {
  readonly stream: Stream
  #index = 0
  #ondata?: (s: string) => void

  constructor (stream: Stream, handlers: Handlers = {}) {
    this.stream = stream
    this.#ondata = handlers.data
    stream.addEventListener('data', () => this.read())
    stream.addEventListener('error', () => caller(handlers.error))
    stream.addEventListener('end', () => caller(handlers.end))
    this.read()
    if (stream.done) caller(handlers.end)
  }

  read(separator = '') {
    const content = this.stream.readArray(this.#index)
    caller(this.#ondata, content.join(separator))
    this.#index += content.length
  }
}

class Stream extends EventTarget {
  data: string[] = []
  lastError?: any

  #done = false
  #timeout?: NodeJS.Timeout

  get untilDone() {
    return new Promise<void>((r) => this.#done ? r() : this.addEventListener('end', () => r()));
  }

  get done () {
    return this.#done
  }

  get length () {
    return this.data.length
  }

  constructor (timeoutMs = 1 * 60 * 1000) {
    super()
    this.#timeout = setTimeout(() => {
      if (!this.#done) {
        this.error()
        this.end()
      }
    }, timeoutMs)
  }

  pipe(handlers: Handlers = {}) {
    return new StreamPipe(this, handlers)
  }

  write(value: string) {
    if (this.#done) throw new Error('Done stream cannot be written to')
    this.data.push(value)
    this.dispatchEvent(new Event('data'))
    if (this.#timeout !== undefined) {
      clearTimeout(this.#timeout)
      this.#timeout = undefined
    }
  }

  readArray(startIndex = 0, endIndex = this.data.length) {
    return this.data.slice(startIndex, endIndex)
  }

  read(startIndex = 0, endIndex = this.data.length, separator = '') {
    return this.readArray(startIndex, endIndex).join(separator)
  }

  end() {
    if (this.#done) return
    this.#done = true
    // 在結束前多一個 data 事件，確保完成
    this.dispatchEvent(new Event('data'))
    this.dispatchEvent(new Event('end'))
  }

  error(e?: any) {
    this.dispatchEvent(new Event('error', e))
    this.lastError = e
  }
}

async function readStream(stream?: ReadableStream<Uint8Array> | null): Promise<Uint8Array> {
  if (!stream) return new Uint8Array();
  const reader = stream.getReader();
  const buffers: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (value) buffers.push(value);
    if (done) break;
  }
  return Uint8Array.from(buffers.map(b => [...b]).flat())
}

async function readString(stream?: ReadableStream<Uint8Array> | null, encoding = 'utf-8'): Promise<string> {
  return new TextDecoder(encoding).decode(await readStream(stream))
}

async function readJSON(stream?: ReadableStream<Uint8Array> | null) {
  try {
    return JSON.parse(await readString(stream))
  } catch {}
  return undefined;
}

export {
  readStream,
  readString,
  readJSON,
}

export type { Stream, StreamPipe }

export default Stream
