export interface IStreamSocketWriteChunkData {
  chunk: ArrayBuffer | Buffer | string;
  encoding: BufferEncoding;
  writeCallback: (...args: any[]) => any;
}
