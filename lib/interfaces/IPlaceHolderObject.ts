import {DuplexOptions} from 'stream';

export interface IPlaceHolderObject extends Object {
  streamId?: string;
  streamOptions?: DuplexOptions;
  [key: string]: any;
}
