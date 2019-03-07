import {EventEmitter} from 'events';
import {IDecoder, IEncoder, IIOStream, IStreamSocket, IStreamSocketWriteChunkData, IStreamSocketOptions} from './interfaces';
import {Socket} from 'socket.io';
import {SocketEvent, StreamEvent, StreamSocketEvent} from './enums';

export default class StreamSocket extends EventEmitter implements IStreamSocket {
  private _socket: Socket;
  private _streams: {[key: string]: IIOStream};
  private readonly _forceBase64: boolean;
  private readonly _encoder: IEncoder;
  private readonly _decoder: IDecoder;


  constructor(socket: Socket, options: IStreamSocketOptions, encoder: IEncoder, decoder: IDecoder) {
    super();
    this._socket = socket;
    this._forceBase64 = !!options.forceBase64;
    this._encoder = encoder;
    this._decoder = decoder;
    this._streams = {};

    this._initEvents();
  }

  /**
   * Emits streams to this corresponding server/client
   * @param event
   * @param args
   */
  // @ts-ignore because i need to override base method return
  // but it break polymorphism
  // TODO: think about how to do correct
  public emit(event: string, ...args: any[]): this {
    if (true) {
      super.emit(event, ...args);
    }
    this._stream(event, ...args);
    return this;
  }

  /**
   * Set listener on corresponding server/client emit stream event
   * @param event
   * @param listener
   */
  public on(event: string, listener: (...args: any[]) => any): this {
    if (true) {
      super.on(event, listener);
    }
    this._onStream(event, listener);
    return this;
  }

  /**
   * Send new stream request.
   * @param event
   * @private
   */
  private _stream(event: string, ...args: any[]): void {
    const maybeAck = args[args.length - 1];
    if (typeof maybeAck === 'function') {
      args[args.length - 1] = (...ackArgs: any[]) => {
        maybeAck.apply(this, this._decoder.decode(ackArgs));
      };
    }
    this._socket.emit(StreamSocketEvent.Base, event, ...args);
  }

  /**
   * Handles a new stream request
   * @param event
   * @param listener
   * @private
   */
  private _onStream(event: string, listener: (...args: any[]) => any): void {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }

    super.on(event, (...args: any[]) => {
      const maybeAck = args[args.length - 1];
      if (typeof maybeAck === 'function') {
        args[args.length - 1] = (...ackArgs: any[]) => {
          maybeAck.apply(this, this._encoder.encode(ackArgs));
        };
      }
      listener.apply(this, this._decoder.decode(args));
    });
  }

  /**
   * Notifies server/client the read event
   * @param id
   * @param size
   * @private
   */
  private _read(id: string, size: number): void {
    this._socket.emit(StreamSocketEvent.Read, id, size);
  }

  /**
   * Requests to write a chunk
   * @param id
   * @param chunk
   * @param encoding
   * @param callback
   * @private
   */
  private _write(
    id: string,
    chunk: ArrayBuffer | Buffer | string,
    encoding: BufferEncoding,
    callback: (...args: any[]) => any,
  ): void {
    if (Buffer.isBuffer(chunk)) {
      if (this._forceBase64) {
        encoding = 'base64';
        chunk = chunk.toString(encoding);
      }
    }
    this._socket.emit(StreamSocketEvent.Write, id, chunk, encoding, callback);
  }

  /**
   * Request about stream end
   * @param id
   * @private
   */
  private _end(id: number): void {
    this._socket.emit(StreamSocketEvent.End, id);
  }

  /**
   * Request about stream error
   * @param id
   * @param error
   * @private
   */
  private _error(id: string, error: any): void {
    this._socket.emit(StreamSocketEvent.Error, id, error.message || error);
  }

  /**
   * Handler for read request
   * @param id
   * @param size
   * @private
   */
  private _onRead(id: string, size: number): void {
    const stream: IIOStream = this._streams[id];
    if (!stream) return;

    const chunk: IStreamSocketWriteChunkData = stream.read(size);
    if (!chunk) return;

    this._write(id, chunk.chunk, chunk.encoding, chunk.writeCallback);
  }

  /**
   * Handler for write request
   * @param id
   * @param chunk
   * @param encoding
   * @param callback
   * @private
   */
  private _onWrite(
    id: string,
    chunk: ArrayBuffer | Buffer | string,
    encoding: BufferEncoding,
    callback: (...args: any[]) => any,
  ): void {
    const stream: IIOStream = this._streams[id];
    if (!stream) return;

    let buffChunk: Buffer;
    // convert chunk to buffer if it not
    if (chunk instanceof ArrayBuffer) {
      buffChunk = Buffer.from(new Uint8Array(chunk));
    } else if (!Buffer.isBuffer(chunk) && typeof chunk === 'string') {
      buffChunk = Buffer.from(chunk, encoding);
    } else {
      buffChunk = chunk;
    }
    stream.write(buffChunk, encoding, callback);
  }

  /**
   * Handler for stream end request
   * @param id
   * @private
   */
  private _onEnd(id: string): void {
    const stream: IIOStream = this._streams[id];
    if (!stream) return;

    stream.end();
  }

  /**
   * Handler for stream error request
   * @param id
   * @param message
   * @private
   */
  private _onError(id: string, message?: string): void {
    const stream: IIOStream = this._streams[id];
    if (!stream) return;

    const error = new Error(message);
    // TODO: add extended error
    error['remote'] = true;
    stream.emit(StreamEvent.Error, error);
  }

  /**
   * Socket disconnect handler
   * @private
   */
  private _onDisconnect(): void {
    for (const id in this._streams) {
      const stream: IIOStream = this._streams[id];
      stream.destroy();
      stream.emit(StreamEvent.Close);
      stream.emit(StreamEvent.Error, new Error('socket disconnected'));
      this._cleanup(id);
    }
  }

  /**
   * on args stream encoded handler
   * @param stream
   * @private
   */
  private _onEncode(stream: IIOStream): void {
    if (stream.Destroyed) {
      throw new Error('stream already destroyed');
    }
    if (this._streams[stream.Id]) {
      throw new Error(`stream with id ${stream.Id} already exits`);
    }

    this._streams[stream.Id] = stream;
  }

  /**
   * emit args stream decoded handler
   * @param stream
   * @private
   */
  private _onDecode(stream: IIOStream): void {
    if (this._streams[stream.Id]) {
      throw new Error(`stream with id ${stream.Id} already exits`);
    }

    
    this._streams[stream.Id] = stream;
  }

  /**
   * Remove stream
   * @param id
   */
  private _cleanup(id: string): void {
    delete this._streams[id];
  }

  /**
   * Initialize private events
   * @private
   */
  private _initEvents() {
    this._socket.on(StreamSocketEvent.Base, super.emit.bind(this));
    this._socket.on(StreamSocketEvent.Read, this._onRead.bind(this));
    this._socket.on(StreamSocketEvent.Write, this._onWrite.bind(this));
    this._socket.on(StreamSocketEvent.End, this._onEnd.bind(this));
    this._socket.on(StreamSocketEvent.Error, this._onError.bind(this));
    this._socket.on(SocketEvent.Error, () => super.emit(SocketEvent.Error));
    this._socket.on(SocketEvent.Disconnect, this._onDisconnect.bind(this));

    this._encoder.on('stream', this._onEncode.bind(this));
    this._decoder.on('stream', this._onDecode.bind(this));
  }

}
