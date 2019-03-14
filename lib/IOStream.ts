import {DuplexOptions} from 'stream';
import {IStreamSocket, IStreamSocketReadChunkData, IStreamSocketWriteChunkData} from './interfaces';
import {IOStreamCheckAble} from './types/IOStreamCheckAble';
import {StreamEvent} from './enums';
import uuid = require('uuid/v1');

// @ts-ignore
/**
 * Extended Duplex stream to emulate Stream API through socket.io
 */
// TODO: use proxy over extends maybe help remove ts-ignore
// It very bad, but i need override base _write method
// @ts-ignore
export class IOStream extends IOStreamCheckAble {
  private readonly _id: string;
  private readonly _options: DuplexOptions;
  private _readBuffer: IStreamSocketReadChunkData[] = [];
  private _writeBuffer: IStreamSocketWriteChunkData[] = [];
  private _readable: boolean;
  private _writable: boolean;
  private _destroyed: boolean;

  constructor(opt?: DuplexOptions, id?: string) {
    super(opt);
    this._options = opt || {};
    this._id = id || uuid();
    this._initEvents();
  }

  get Id(): string {
    return this._id;
  }

  get Options(): DuplexOptions {
    return this._options;
  }

  get Destroyed(): boolean {
    return this._destroyed;
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
   * Read local data and return chunk to remote write
   * @param size
   */
  public readLocal(size: number): IStreamSocketWriteChunkData {
    const chunk: IStreamSocketWriteChunkData = this._writeBuffer.shift();
    if (chunk) return chunk;

    this._writable = true;
  }

  /**
   * Write remote data
   * @param chunk
   * @param encoding
   * @param callback
   */
  public write(chunk: Buffer, encoding: BufferEncoding, callback: (...args: any[]) => void): void {
    if (this._readable) {
      this._push(chunk, encoding, callback);
    } else {
      this._readBuffer.push({
        chunk,
        encoding,
        pushCallback: callback,
      });
    }
  }

  /**
   * Handler 'remoteEnd' event to remote stream
   * @private
   */
  public remoteEnd(): void {
    if (this._readBuffer.length) {
      this.once(StreamEvent.RemoteReadEnd, this._done.bind(this));
    } else {
      this._done();
    }
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
        if (!this._push(pushData.chunk, pushData.encoding, pushData.pushCallback)) {
          break;
        }
      } while (pushData);
      this.emit(StreamEvent.RemoteReadEnd);
      return;
    }

    this._readable = true;

    // Emit remote stream event to handle StreamSocket
    // Calls
    // ._onRead remotely
    // then
    // ._onWrite locally
    this.emit(StreamEvent.RemoteRead, size);
  }

  /**
   * Duplex.Writable _write method override
   * Write local data to remote stream
   * @param chunk
   * @param encoding
   * @param callback
   * @private
   */
  private _write(chunk: Buffer, encoding: BufferEncoding, callback: (...args: any[]) => void): void {
    if (this._destroyed) return;

    const chunkData: IStreamSocketWriteChunkData = {
      chunk,
      encoding,
      writeCallback: callback,
    };

    if (this._writable) {
      this._writable = false;
      this.emit(StreamEvent.RemoteWrite, chunkData);
    } else {
      this._writeBuffer.push(chunkData);
    }
  }

  /**
   * Write the data fetched remotely
   * so that we can now readLocal locally
   * @param chunk
   * @param encoding
   * @param callback
   * @private
   */
  private _push(chunk: Buffer, encoding: BufferEncoding, callback: (...args: any[]) => void): boolean {
    this._readable = false;
    const ret: boolean = super.push(chunk, encoding);
    callback();
    return ret;
  }

  /**
   * Remote stream just ended
   * @api private
   */
  private _done(): boolean {
    this._readable = false;

    return super.push(null);
  }

  /**
   * the user has called .remoteEnd(), and all the bytes have been
   * sent out to the other side.
   * If allowHalfOpen is false, or if the readable side has
   * ended already, then destroy.
   * If allowHalfOpen is true, then we need to set writable false,
   * so that only the writable side will be cleaned up.
   * @private
   */
  private _onFinish(): void {
    // Event about remote remoteEnd to handle socket
    this.emit(StreamEvent.RemoteEnd);

    this._writable = false;

    if (!this._readable) {
      return this.destroy();
    }

    if (!this._options.allowHalfOpen) {
      super.push(null);
      if (this._readable) super.read(0);
    }
  }

  /**
   * the EOF has been received, and no more bytes are coming.
   * if the writable side has ended already, then clean everything up.
   * @private
   */
  private _onEnd(): void {
    this._readable = false;

    if (!this._writable) {
      return this.destroy();
    }

    if (!this._options.allowHalfOpen) {
      super.end();
    }
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

  /**
   * When error in local stream
   * notyify handle socket
   * if err.remote = true
   * then error happened on remote stream
   * @param err
   * @private
   */
  private _onError(err): void {
    if (!err.remote) {
      this.emit(StreamEvent.LocalError, err);
    }

    this.destroy();
  }
}
