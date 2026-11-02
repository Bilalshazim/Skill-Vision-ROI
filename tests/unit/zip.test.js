import { test } from "node:test";
import assert from "node:assert/strict";
import { crc32, zipParts } from "../../src/js/core/zip.js";

test("crc32 matches the standard check value", () => {
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
});

test("zip archive has a valid local header, central directory and end record", () => {
  const name = "ROI_TEST_2025.html", body = "<!doctype html><p>àèì</p>";
  const buf = Buffer.concat(zipParts(name, body).map((p) => Buffer.from(p)));
  const size = Buffer.byteLength(body);
  assert.equal(buf.readUInt32LE(0), 0x04034b50);
  assert.equal(buf.readUInt32LE(18), size);
  assert.equal(buf.toString("utf8", 30, 30 + name.length), name);
  assert.equal(buf.toString("utf8", 30 + name.length, 30 + name.length + size), body);
  const cdOff = buf.readUInt32LE(buf.length - 6);
  assert.equal(buf.readUInt32LE(cdOff), 0x02014b50);
  assert.equal(buf.readUInt32LE(buf.length - 22), 0x06054b50);
  assert.equal(buf.length, 30 + name.length + size + 46 + name.length + 22);
});
