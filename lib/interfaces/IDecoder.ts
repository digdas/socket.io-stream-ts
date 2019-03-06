import {IIOStream} from './IIOStream';
import {IPlaceHolderObject} from './IPlaceHolderObject';
import {EventEmitter} from 'events';

export interface IDecoder extends EventEmitter {
  decode(data: IPlaceHolderObject | IPlaceHolderObject[]): IIOStream | any[] | object;
  decodeStream(stream: IPlaceHolderObject): IIOStream;
  decodeArray(array: IPlaceHolderObject): any[];
  decodeObject(obj: IPlaceHolderObject): object;
}