import {EventEmitter} from 'events';
import {IDecoder, IIOStream, IPlaceHolderObject} from '../../interfaces';
import {IOStream} from '../../IOStream';

/**
 * Decode place holder objects to stream
 */
export class Decoder extends EventEmitter implements IDecoder {

  decode(data: IPlaceHolderObject | IPlaceHolderObject[]): IIOStream | any[] | object {
    if (data instanceof Array) {
      return this.decodeArray(data);
    } else if (data && data.streamId) {
      return this.decodeStream(data);
    } else if (data && typeof data === 'object') {
      return this.decodeObject(data);
    }
    return data;
  }

  decodeArray(encodedArray: IPlaceHolderObject[]): any[] {
    const decodedArray: any[] = [];
    for (const arrayPart of encodedArray) {
      decodedArray.push(this.decode(arrayPart));
    }
    return decodedArray;
  }

  decodeObject(encodedObj: IPlaceHolderObject): object {
    const decodedObject: object = {};
    for (const objPartKey in encodedObj) {
      if (encodedObj.hasOwnProperty(objPartKey)) {
        decodedObject[objPartKey] = this.decode(encodedObj[objPartKey]);
      }
    }
    return decodedObject;
  }

  decodeStream(encodedStream: IPlaceHolderObject): IIOStream {
    const decodedStream: IIOStream = new IOStream(encodedStream.streamOptions, encodedStream.streamId);
    this.emit('stream', decodedStream);
    return decodedStream;
  }

}
