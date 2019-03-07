import {DuplexOptions} from 'stream';
import {IStreamSocket, IStreamSocketReadChunkData, IStreamSocketWriteChunkData} from './interfaces';
import {IOStreamCheckAble} from './types/IOStreamCheckAble';
import {StreamEvent} from './enums';

/**
 * Extended Duplex stream to emulate Stream API through socket.io
 */
export class IOStream extends IOStreamCheckAble {
  private readonly _id: string;
  private readonly _options: DuplexOptions;
  private _socket: IStreamSocket;
  private _readBuffer: IStreamSocketReadChunkData[] = [];
  private _writeBuffer: IStreamSocketWriteChunkData[] = [];
  private _readable: boolean;
  private _writable: boolean;
  private _destroyed: boolean;

  constructor(opt?: DuplexOptions) {
    super(opt);
    this._options = opt || {};

    this._initEvents();
  }

  /**
   * Destroy stream to prevent new I/O activity
   */
  public destroy(): void {
    if (this._destroyed) return;

    this._readable = this._writable = false;
    this._destroyed = true;
  }

  /**
   * Duplex.Readable _read method override
   * @param size
   * @private
   */
  private _read(size: number): void {
    if (this._destroyed) return;

    let pushData: IStreamSocketReadChunkData;
    if (this._readBuffer.length) {
      do {
        pushData = this._readBuffer.shift();
        if (!this._push(pushData.chunk, pushData.encoding, pushData.writeCallback)) {
          break;
        }
      } while (pushData);
      return;
    }

    this._readable = true;
  }

  /**
   * Write the data fetched remotely
   * so that we can now read locally
   * @param chunk
   * @param encoding
   * @param callback
   * @private
   */
  private _push(chunk: Buffer | string, encoding: BufferEncoding, callback: (...args: any[]) => void): boolean {
    this._readable = false;
    const ret: boolean = super.push(chunk, encoding);
    callback();
    return ret;
  }

  /**
   * Init local events
   * @private
   */
  private _initEvents(): void {
    this.on(StreamEvent.Finish, this._onFinish.bind(this));
    this.on(StreamEvent.End, this._onEnd.bind(this));
    this.on(StreamEvent.Error, this._onError.bind(this));
  }
}
