import {DuplexOptions} from 'stream';
import {IStreamSocketWriteChunkData} from './IStreamSocketWriteChunkData';
import {StreamEvent} from '../enums';

export interface IIOStream {
  Id: string;
  Options: DuplexOptions;
  Destroyed: boolean;
  destroy(): void;
  read(size: number): IStreamSocketWriteChunkData;
  write(chunk: Buffer, encoding: BufferEncoding, callback: (...args: any) => void);
  end(): void;
  emit(event: StreamEvent, data?: any): void;
}
