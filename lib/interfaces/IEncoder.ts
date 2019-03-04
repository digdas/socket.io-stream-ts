import {IIOStream} from './IIOStream';
import {IPlaceHolderObject} from './IPlaceHolderObject';
import {EventEmitter} from 'events';

export interface IEncoder extends EventEmitter {
  encode(data: IIOStream | any[] | object): IPlaceHolderObject;
  encodeStream(stream: IIOStream): IPlaceHolderObject;
  encodeArray(array: any[]): IPlaceHolderObject;
  encodeObject(obj: object): IPlaceHolderObject;
}
