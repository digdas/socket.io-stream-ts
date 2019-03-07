export interface IStreamSocketReadChunkData {
  chunk: Buffer;
  encoding: BufferEncoding;
  pushCallback: (...args: any[]) => any;
}
