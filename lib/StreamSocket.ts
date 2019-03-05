import {EventEmitter} from 'events';
import {IDecoder, IEncoder, IStreamSocket, IStreamSocketOptions} from './interfaces';
import {Socket} from 'socket.io';
import {StreamSocketEvent} from './enums/StreamSocketEvent';
import {SocketEvent} from './enums/SocketEvent';

export default class StreamSocket extends EventEmitter implements IStreamSocket {
  private _socket: Socket;
  private readonly _forceBase64: boolean;
  private readonly _encoder: IEncoder;
  private readonly _decoder: IDecoder;


  constructor(socket: Socket, options: IStreamSocketOptions, encoder: IEncoder, decoder: IDecoder) {
    super();
    this._socket = socket;
    this._forceBase64 = !!options.forceBase64;
    this._encoder = encoder;
    this._decoder = decoder;

    this._initEvents();
  }

  /**
   * Emits streams to this corresponding server/client
   * @param event
   * @param args
   */
  // @ts-ignore because i need to override base method
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
