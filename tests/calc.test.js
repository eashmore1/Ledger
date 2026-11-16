'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createEngine, group } = require('../calc.js');

const run = (keys) => { const c = createEngine(); keys.split(' ').forEach((k) => c.press(k)); return c; };

test('basic arithmetic, one step at a time like the exam calculator', () => {
  assert.equal(run('1 2 + 3 4 =').value, '46');
  assert.equal(run('2 + 3 * 4 =').value, '20', 'no operator precedence: (2+3)×4');
  assert.equal(run('9 / 4 =').value, '2.25');
  assert.equal(run('5 - 8 =').value, '-3');
});

test('float noise is hidden', () => {
  assert.equal(run('. 1 + . 2 =').value, '0.3');
  assert.equal(run('1 . 1 * 3 =').value, '3.3');
});

test('repeated equals repeats the last step', () => {
  assert.equal(run('2 * 3 = =').value, '18');
});

test('changing the operator before the next number', () => {
  assert.equal(run('8 + - 3 =').value, '5');
});

test('percent', () => {
  assert.equal(run('2 0 0 + 1 0 % =').value, '220');
  assert.equal(run('2 0 0 * 1 0 % =').value, '20');
  assert.equal(run('5 0 %').value, '0.5');
});

test('square root, sign, backspace, clear entry', () => {
  assert.equal(run('1 4 4 sqrt').value, '12');
  assert.equal(run('5 neg').value, '-5');
  assert.equal(run('1 2 3 back').value, '12');
  assert.equal(run('7 + 9 CE 2 =').value, '9');
});

test('divide by zero and square root of a negative show Error until cleared', () => {
  const c = run('5 / 0 =');
  assert.equal(c.display(), 'Error');
  c.press('7'); assert.equal(c.display(), 'Error');
  c.press('C'); c.press('7'); assert.equal(c.display(), '7');
  assert.equal(run('4 neg sqrt').display(), 'Error');
});

test('memory keys', () => {
  const c = run('1 0 M+ 5 M+ 3 M- C MR');
  assert.equal(c.value, '12');
  c.press('MC'); assert.equal(c.memory, 0);
});

test('display groups thousands and shows the pending step', () => {
  const c = run('1 2 3 4 5 6 7 . 5');
  assert.equal(c.display(), '1,234,567.5');
  c.press('*'); assert.equal(c.pending, '1,234,567.5 ×');
  assert.equal(group('-1000'), '-1,000');
});

test('only one decimal point; long entries are capped', () => {
  assert.equal(run('1 . 2 . 3').value, '1.23');
  assert.equal(run('1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8').value.length, 15);
});
