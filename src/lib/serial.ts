/**
 * Web Serial — the browser talking to a real board over USB.
 *
 * Chrome and Edge on desktop only; Firefox and Safari have no Web Serial, and neither does any
 * mobile browser. The page must be on HTTPS or localhost, and the port is chosen by the person
 * in the browser's own dialog — a page can never open one on its own.
 *
 * What this buys us differs by board:
 *   - Arduino (C++) — read Serial.print() live and type back. Uploading a sketch would mean
 *     compiling C++, which no browser can do, so that stays in the Arduino IDE.
 *   - ESP32 / Pico (MicroPython) — the firmware exposes a REPL on the same port, so code can be
 *     sent from the editor and actually run on the board. No compile, no flash.
 */

/* The DOM lib has no Web Serial types yet, so the shape we rely on is declared here. */
export interface SerialPortLike {
  open(options: { baudRate: number }): Promise<void>
  close(): Promise<void>
  readable: ReadableStream<Uint8Array> | null
  writable: WritableStream<Uint8Array> | null
  getInfo(): { usbVendorId?: number; usbProductId?: number }
}

interface SerialLike {
  requestPort(): Promise<SerialPortLike>
  getPorts(): Promise<SerialPortLike[]>
}

export const serialApi = (): SerialLike | null =>
  typeof navigator !== 'undefined' && 'serial' in navigator ? ((navigator as unknown as { serial: SerialLike }).serial ?? null) : null

export const serialSupported = () => serialApi() !== null

/** Baud rates worth offering. 115200 is the MicroPython REPL default, 9600 the Arduino habit. */
export const BAUD_RATES = [9600, 19200, 38400, 57600, 74880, 115200, 230400, 250000] as const

/** MicroPython's raw REPL control bytes. */
const CTRL_A = '\x01' // enter raw REPL
const CTRL_B = '\x02' // back to the friendly REPL
const CTRL_C = '\x03' // interrupt whatever is running
const CTRL_D = '\x04' // execute what was pasted

/**
 * A single open connection. Kept as a class because a port, its reader and its writer have to be
 * torn down together and in order — releasing them out of order leaves the port un-closable.
 */
export class SerialSession {
  private port: SerialPortLike | null = null
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null
  private decoder = new TextDecoder()
  private encoder = new TextEncoder()
  private stopped = false

  get isOpen() {
    return this.port !== null
  }

  /** Opens the port the person picks. Throws if they cancel the dialog or the port is busy. */
  async connect(baudRate: number, onChunk: (text: string) => void, onClosed: () => void) {
    const api = serialApi()
    if (!api) throw new Error('unsupported')

    const port = await api.requestPort()
    await port.open({ baudRate })
    this.port = port
    this.stopped = false

    if (port.writable) this.writer = port.writable.getWriter()

    // Read until the board goes away or we stop on purpose.
    void (async () => {
      try {
        while (port.readable && !this.stopped) {
          this.reader = port.readable.getReader()
          try {
            for (;;) {
              const { value, done } = await this.reader.read()
              if (done) break
              if (value) onChunk(this.decoder.decode(value, { stream: true }))
            }
          } finally {
            this.reader.releaseLock()
            this.reader = null
          }
        }
      } catch {
        /* unplugged mid-read — the disconnect below is the only thing that matters */
      } finally {
        if (!this.stopped) onClosed()
      }
    })()
  }

  async write(text: string) {
    if (!this.writer) return
    await this.writer.write(this.encoder.encode(text))
  }

  /** A line typed into the terminal. CRLF suits both the Arduino monitor and the REPL. */
  async sendLine(line: string) {
    await this.write(`${line}\r\n`)
  }

  /**
   * Runs a block of code on a MicroPython board: interrupt, drop into the raw REPL, paste,
   * execute, and hand the friendly prompt back so the terminal stays usable afterwards.
   */
  async runMicroPython(code: string) {
    await this.write(CTRL_C)
    await this.write(CTRL_A)
    await new Promise((r) => setTimeout(r, 120))
    await this.write(code.replace(/\r\n/g, '\n'))
    await this.write(CTRL_D)
    await new Promise((r) => setTimeout(r, 120))
    await this.write(CTRL_B)
  }

  /** Stops a running MicroPython program. */
  async interrupt() {
    await this.write(CTRL_C)
  }

  async disconnect() {
    this.stopped = true
    try {
      await this.reader?.cancel()
    } catch {
      /* already gone */
    }
    try {
      this.writer?.releaseLock()
    } catch {
      /* already released */
    }
    this.writer = null
    try {
      await this.port?.close()
    } catch {
      /* already closed */
    }
    this.port = null
  }
}
