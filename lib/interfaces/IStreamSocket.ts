import {EventEmitter} from 'events';

// @ts-ignore because i need to override base method return
// but it break polymorphism
// TODO: think about how to do correct
export interface IStreamSocket extends EventEmitter {
  emit(event: string, ...args: any[]): this;
  on(event: string, listener: (...args: any[]) => any): this;
}

export interface IStreamSocketOptions {
  forceBase64: boolean;
}
