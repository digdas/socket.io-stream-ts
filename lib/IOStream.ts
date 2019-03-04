import {Duplex, DuplexOptions} from "stream";
import {IIOStream, IStreamSocket} from "./interfaces";

/**
 * Class for check by instanceof in decoder & encoder
 */
export abstract class IOStreamCheckAble extends Duplex implements IIOStream {
  Id: string;
  Options: DuplexOptions;
}

/**
 * Extended Duplex stream to emulate Stream API through socket.io
 */
export class IOStream extends IOStreamCheckAble {
  private readonly _id: string;
  private readonly _options: DuplexOptions;
  private _socket: IStreamSocket;
  private _readBuffer: any[] = [];
  private _writeBuffer: any[] = [];
  private _readable: boolean;
  private _writable: boolean;
  private _destroyed: boolean;

  constructor(opt?: DuplexOptions) {
    super(opt);
    this._options = opt || {};
  }

  /**
   * Destroy stream to prevent new I/O activity
   */
  public destroy(): void {
    if (this._destroyed) return;

    this._readable = this._writable = false;
    if (this._socket) {
      this._socket.cleanup(this._id);
      this._socket = null;
    }
  }

  /**
   * Read from socket
   * @param size
   * @private
   */
  private _read(size: number): void {
    let push: any[];

    if (this._destroyed) return;

    if (this._readBuffer.length) {
      // flush buffer and end if it exists.
      while (push = this._readBuffer.shift()) {
        if (!this._push()) break;
      }
      return;
    }

    // Now we ready to read data from remote stream
    this._readable = true;
    this._socket.read(this._id, size);
  }


  /**
   * Push data from remotely stream to local
   * @private
   */
  private _push(): boolean;
  private _push(chunk?: any[], encoding?: BufferEncoding, callback?: () => void): boolean {
    this._readable = false;
    const success: boolean = super.push(chunk || '', encoding);
    callback();
    return success;
  }

  /**
   * Read from remote stream
   * @param size
   * @private
   */
  private _onRead(size: number): void {
    let write: any[] = this._writeBuffer.shift();
    if (write) return this.write();

    this._writable = true;
  }

  /**
   * Write local data to remote stream
   * @param chunk
   * @param encoding
   * @param callback
   * @private
   */
  private _write(chunk: any[], encoding: BufferEncoding, callback: () => void) {

  }

  private _writeToSocket(id: string, chunk: any[], encoding: BufferEncoding, callback: () => void): void {
    if (this._destroyed) return;

    this.writable = false;
    this._socket.write(id, chunk, encoding, callback);
  }
}