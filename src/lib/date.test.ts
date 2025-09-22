import test from 'node:test';
import assert from 'node:assert/strict';
import { formatGTDateTime, parseGTDate } from './date';

const ISO_SAMPLE = '2025-09-19T19:52:47.067Z';
const WITH_COMMA_SAMPLE = '19/09/2025, 13:50:07';
const NO_COMMA_SAMPLE = '19/09/2025 13:50:07';
const DATE_ONLY_SAMPLE = '19/09/2025';

test('parseGTDate parses ISO 8601 strings', () => {
  const parsed = parseGTDate(ISO_SAMPLE);
  assert.ok(parsed);
  assert.equal(parsed?.toISOString(), ISO_SAMPLE);
});

test('parseGTDate parses dd/MM/yyyy, HH:mm:ss strings', () => {
  const parsed = parseGTDate(WITH_COMMA_SAMPLE);
  assert.ok(parsed);
  assert.equal(formatGTDateTime(parsed, 'dd/MM/yyyy HH:mm:ss'), '19/09/2025 13:50:07');
});

test('parseGTDate parses dd/MM/yyyy HH:mm:ss strings', () => {
  const parsed = parseGTDate(NO_COMMA_SAMPLE);
  assert.ok(parsed);
  assert.equal(formatGTDateTime(parsed, 'dd/MM/yyyy HH:mm:ss'), '19/09/2025 13:50:07');
});

test('parseGTDate parses dd/MM/yyyy strings', () => {
  const parsed = parseGTDate(DATE_ONLY_SAMPLE);
  assert.ok(parsed);
  assert.equal(formatGTDateTime(parsed, 'dd/MM/yyyy HH:mm'), '19/09/2025 00:00');
});

test('parseGTDate returns null for empty input', () => {
  assert.equal(parseGTDate(''), null);
  assert.equal(parseGTDate('   '), null);
});

test('parseGTDate returns null for nullish values', () => {
  assert.equal(parseGTDate(null), null);
  assert.equal(parseGTDate(undefined), null);
});

test('formatGTDateTime returns formatted value', () => {
  assert.equal(formatGTDateTime(ISO_SAMPLE), '19/09/2025 19:52');
});

test('formatGTDateTime returns placeholder for invalid values', () => {
  assert.equal(formatGTDateTime('invalid-date'), '—');
  assert.equal(formatGTDateTime(undefined), '—');
});
