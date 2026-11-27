import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { stampPdf } from '../src/shopbot.js';

test('PDF stamping preserves page count and adds library metadata', async () => {
  const source = await PDFDocument.create();
  source.addPage([595, 842]);
  source.addPage([595, 842]);
  source.addPage([595, 842]);
  const input = await source.save();
  const output = await stampPdf(input, 'Licensed to order #42 - personal use only', 'Order #42');
  const result = await PDFDocument.load(output);
  assert.equal(result.getPageCount(), 3);
  assert.equal(result.getProducer(), 'Al-Hayali Digital Library');
  assert.match(result.getSubject(), /Licensed to order #42/);
  assert.ok(output.byteLength > input.byteLength);
});

test('PDF stamping rejects malformed input', async () => {
  await assert.rejects(() => stampPdf(new Uint8Array([1, 2, 3]), 'license', 'mark'));
});

test('PDF stamping rejects oversized input before parsing', async () => {
  await assert.rejects(() => stampPdf(new Uint8Array(25 * 1024 * 1024 + 1), 'license', 'mark'), /pdf_too_large_to_stamp/);
});
