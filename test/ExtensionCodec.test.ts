import assert from "assert";
import util from "util";
import { encode, decode, ExtensionCodec, EXT_TIMESTAMP, decodeAsync } from "../src";

/* eslint-disable @typescript-eslint/no-non-null-assertion */

describe("ExtensionCodec", () => {
  context("timestamp", () => {
    const defaultCodec = ExtensionCodec.defaultCodec;

    it("encodes and decodes a date without milliseconds (timestamp 32)", () => {
      const date = new Date(1556633024000);
      const encoded = defaultCodec.tryToEncode(date);
      assert.deepStrictEqual(
        defaultCodec.decode(encoded!.data, EXT_TIMESTAMP),
        date,
        `date: ${date.toISOString()}, encoded: ${util.inspect(encoded)}`,
      );
    });

    it("encodes and decodes a date with milliseconds (timestamp 64)", () => {
      const date = new Date(1556633024123);
      const encoded = defaultCodec.tryToEncode(date);
      assert.deepStrictEqual(
        defaultCodec.decode(encoded!.data, EXT_TIMESTAMP),
        date,
        `date: ${date.toISOString()}, encoded: ${util.inspect(encoded)}`,
      );
    });

    it("encodes and decodes a future date (timestamp 96)", () => {
      const date = new Date(0x400000000 * 1000);
      const encoded = defaultCodec.tryToEncode(date);
      assert.deepStrictEqual(
        defaultCodec.decode(encoded!.data, EXT_TIMESTAMP),
        date,
        `date: ${date.toISOString()}, encoded: ${util.inspect(encoded)}`,
      );
    });
  });

  context("custom extensions", () => {
    const extensionCodec = new ExtensionCodec();

    // Set<T>
    extensionCodec.register({
      type: 0,
      encode: (object: unknown): Uint8Array | null => {
        if (object instanceof Set) {
          return encode([...object]);
        } else {
          return null;
        }
      },
      decode: (data: Uint8Array) => {
        const array = decode(data) as Array<unknown>;
        return new Set(array);
      },
    });

    // Map<T>
    extensionCodec.register({
      type: 1,
      encode: (object: unknown): Uint8Array | null => {
        if (object instanceof Map) {
          return encode([...object]);
        } else {
          return null;
        }
      },
      decode: (data: Uint8Array) => {
        const array = decode(data) as Array<[unknown, unknown]>;
        return new Map(array);
      },
    });

    it("encodes and decodes custom data types (synchronously)", () => {
      const set = new Set([1, 2, 3]);
      const map = new Map([
        ["foo", "bar"],
        ["bar", "baz"],
      ]);
      const encoded = encode([set, map], { extensionCodec });
      assert.deepStrictEqual(decode(encoded, { extensionCodec }), [set, map]);
    });

    it("encodes and decodes custom data types (asynchronously)", async () => {
      const set = new Set([1, 2, 3]);
      const map = new Map([
        ["foo", "bar"],
        ["bar", "baz"],
      ]);
      const encoded = encode([set, map], { extensionCodec });
      const createStream = async function*() {
        yield encoded;
      };
      assert.deepStrictEqual(await decodeAsync(createStream(), { extensionCodec }), [set, map]);
    });
  });
});
