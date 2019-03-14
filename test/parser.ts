import {Decoder, Encoder} from '../lib/utils/Parser';
import {expect} from 'chai';
import 'mocha';
import {IDecoder, IEncoder, IIOStream} from '../lib/interfaces';
import {IOStream} from '../lib/IOStream';

describe('parser', () => {
  it('should encode/decode a stream', () => {
    const decoder: IDecoder = new Decoder();
    const encoder: IEncoder = new Encoder();
    const stream: IOStream = new IOStream();
    const result: IIOStream = decoder.decode(encoder.encode(stream)) as IIOStream;
    expect(result).to.be.instanceOf(IOStream);
    expect(result).not.to.equal(stream);
  });

  it('should keep stream options', () => {
    const decoder: IDecoder = new Decoder();
    const encoder: IEncoder = new Encoder();
    const stream: IOStream = new IOStream({ highWaterMark: 10, objectMode: true, allowHalfOpen: true });
    const result: IIOStream = decoder.decode(encoder.encode(stream)) as IIOStream;
    expect(result.Options).to.eql({ highWaterMark: 10, objectMode: true, allowHalfOpen: true });
  });

  it('should encode/decode every stream', () => {
    const decoder: IDecoder = new Decoder();
    const encoder: IEncoder = new Encoder();
    const result = decoder.decode(encoder.encode([
      new IOStream(),
      { foo: new IOStream() },
    ]));
    expect(result[0]).to.be.instanceOf(IOStream);
    expect(result[1].foo).to.be.instanceOf(IOStream);
  });

  it('should keep non-stream values', () => {
    const decoder: IDecoder = new Decoder();
    const encoder: IEncoder = new Encoder();
    const result = decoder.decode(encoder.encode([1, 'foo', { foo: 'bar' }, null, undefined]));
    expect(result).to.be.eql([1, 'foo', { foo: 'bar' }, null, undefined]);
  });

  describe('Encoder', () => {
    it('should fire stream event', (done) => {
      const encoder: IEncoder = new Encoder();
      const stream = new IOStream();
      encoder.on('stream', (s) => {
        expect(s).to.be.equal(stream);
        done();
      });
      encoder.encode(stream);
    });
  });

  describe('Decoder', () => {
    it('should fire stream event', () => {
      const decoder: IDecoder = new Decoder();
      const encoder: IEncoder = new Encoder();
      let stream: IIOStream;
      decoder.on('stream', (s: IIOStream) => {
        stream = s;
      });
      const decoded = decoder.decode(encoder.encode(new IOStream()));
      expect(stream).to.be.equal(decoded);
    });
  });
});

