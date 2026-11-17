'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { check, censor } = require('../moderation.js');

test('blocks cuss words, including the usual dodges', () => {
  for (const s of [
    'fuck this', 'FUUUUCK', 'f*ck leases', 'what the f u c k', 'f.u.c.k', 'this is bullshit', 'sh1t',
    'youfucker', 'b!tch', 'you are an ass', '@ss', 'what an asshole', 'dumbass', 'what the hell', 'damn it',
    'wtf', 'stfu', 'kys', 'go kill yourself', 'dickhead', 'pissed off', 'crap', 'fùck',
  ]) assert.ok(check(s), 'should block: ' + s);
});

test('leaves normal study talk alone', () => {
  for (const s of [
    'Nice work on leases!', 'class assessment', 'assets and liabilities', 'I passed the exam', 'Pass rates',
    'analysis of variance', 'Charles Dickens', 'cocktail party', 'summa cum laude', 'cumulative effect',
    'hello there', 'shell company', 'Scunthorpe', 'shiitake mushrooms', 'the therapist', 'Mississippi',
    'assume the risk', 'assess the controls', 'documents', 'circumstances', 'Hancock', 'title', 'constitution',
    'Fukuoka office', 'flame retardant', 'grape', 'Amsterdam', 'skyscraper', 'Becker sims plus my own flashcards.',
    'I am a b c d e', 'a.k.a. the hard part', 'Leases are brutal, nice work pushing through!', 'swank', 'washtub',
  ]) assert.equal(check(s), null, 'should allow: ' + s);
});

test('censor masks old comments without touching the rest', () => {
  assert.equal(censor('this is shit lol'), 'this is s*** lol');
  assert.equal(censor('Great class!'), 'Great class!');
  assert.doesNotMatch(censor('f u c k you'), /f u c k/);
});
