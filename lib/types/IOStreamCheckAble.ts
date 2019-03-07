import {Duplex, DuplexOptions} from 'stream';
import {IIOStream, IStreamSocketWriteChunkData} from '../interfaces';
import {StreamEvent} from '../enums';

/**
 * Class for check by instanceof in decoder & encoder
 */
export abstract class IOStreamCheckAble extends Duplex implements IIOStream {
  abstract Id: string;
  abstract Options: DuplexOptions;
  abstract Destroyed: boolean;
  abstract destroy(): void;
  abstract read(size: number): IStreamSocketWriteChunkData;
  // @ts-ignore
  abstract write(chunk: Buffer, encoding: BufferEncoding, callback: (...args: any) => void);
  abstract end(): void;
  // @ts-ignore
  abstract emit(event: StreamEvent, data?: any): void;
}
