export enum StreamEvent {
  Error = 'error',
  Close = 'close',
  Finish = 'finish',
  End = 'end',
  RemoteRead = 'remote_read',
  RemoteWrite = 'remote_write',
  RemoteReadEnd = 'remote_read_end',
  RemoteEnd = 'remote_end',
  LocalError = 'local_error',
}
