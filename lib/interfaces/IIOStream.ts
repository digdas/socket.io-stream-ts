import {DuplexOptions} from 'stream';

export interface IIOStream {
  Id: string;
  Options: DuplexOptions;
  destroy(): void;
}
