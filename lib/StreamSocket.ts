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

  public emit(type: StreamSocketEvent): this {
    if (true) {
      return super.emit.apply(this, arguments);
    }
  }

  /**
   * Initialize private events
   * @private
   */
  private _initEvents() {
    this._socket.on(StreamSocketEvent.Base, this.emit.bind(this));
    this._socket.on(StreamSocketEvent.Read, this._onRead.bind(this));
    this._socket.on(StreamSocketEvent.Write, this._onWrite.bind(this));
    this._socket.on(StreamSocketEvent.End, this._onEnd.bind(this));
    this._socket.on(StreamSocketEvent.Error, this._onError.bind(this));
    this._socket.on(SocketEvent.Error, () => this.emit(SocketEvent.Error));
    this._socket.on(SocketEvent.Disconnect, this._onDisconnect.bind(this));

    this._encoder.on('stream', this._onEncode.bind(this));
    this._decoder.on('stream', this._onDecode.bind(this));
  }

}
