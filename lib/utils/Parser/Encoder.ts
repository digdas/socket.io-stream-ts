import {EventEmitter} from 'events';
import {IEncoder, IIOStream, IPlaceHolderObject} from '../../interfaces';
import {IOStreamCheckAble} from '../../IOStream';

/**
 * Encode to place holder object
 */
export class Encoder extends EventEmitter implements IEncoder {

  encode(data: IIOStream | any[] | object): IPlaceHolderObject {
    if (data instanceof IOStreamCheckAble) {
      return this.encodeStream(data);
    } else if (data instanceof Array) {
      return this.encodeArray(data);
    } else if (typeof data === 'object') {
      return this.encodeObject(data);
    }
    return data;
  }

  encodeArray(arrayData: any[]): IPlaceHolderObject[] {
    const encodedData: any[] = [];
    for (const dataPart of arrayData) {
      encodedData.push(this.encode(dataPart));
    }
    return encodedData;
  }

  encodeObject(obj: object): IPlaceHolderObject {
    const encodedObj: IPlaceHolderObject = {};
    for (const dataPartKey in obj) {
      if (obj.hasOwnProperty(dataPartKey)) {
        encodedObj[dataPartKey] = this.encode(obj[dataPartKey]);
      }
    }
    return encodedObj;
  }

  encodeStream(stream: IIOStream): IPlaceHolderObject {
    this.emit('stream', stream);

    const encodedStream: IPlaceHolderObject = {
      streamId: stream.Id,
    };
    if (stream.Options) {
      encodedStream.streamOptions = stream.Options;
    }
    return encodedStream;
  }

}
