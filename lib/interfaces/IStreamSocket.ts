import {EventEmitter} from 'events';

export interface IStreamSocket extends EventEmitter {
  cleanup(id: string): void;
  read(id: string, size: number): void;
  write(id: string, chunk: any[], encoding: BufferEncoding, callback: () => void): void;
}

export interface IStreamSocketOptions {
  forceBase64: boolean;
}
