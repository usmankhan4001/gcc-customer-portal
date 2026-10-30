import { describe, expect, it } from 'vitest';
import { RESTRICTED_WORDS, checkAvailability, findRestrictedWord } from './name-checker';

describe('whole-word restricted terms are flagged (AC1)', () => {
  it.each([
    ['Royal Trading', 'royal'],
    ['Crypto Labs', 'crypto'],
    ['ACME Bank', 'bank'],
    ['Invest', 'invest'],
  ])('%s -> %s', (name, word) => {
    const r = checkAvailability(name);
    expect(r.isAvailable).toBe(false);
    expect(r.reason).toContain(`"${word}"`);
  });
});

describe('substring-only matches are not flagged (AC2)', () => {
  it.each(['Embankment Ltd', 'Investigate Co', 'Royalty Foods', 'Globalytics'])('%s', (name) => {
    expect(findRestrictedWord(name)).toBeUndefined();
    expect(checkAvailability(name).isAvailable).toBe(true);
  });
});

describe('case and punctuation (AC3)', () => {
  it.each(['bank,', 'BANK', '(Bank)', 'Acme-Bank.', 'BaNk of Dreams'])('%s', (name) => {
    expect(findRestrictedWord(name)).toBe('bank');
  });
});

describe('alternatives never contain a restricted word (AC4)', () => {
  it.each([
    'Apex Frontier Solutions',
    'Embankment Ltd',
    'Gulf Crypto Labs',
    'Alpha Global Tech',
    'Bank',
    'Royal Global Bank Invest',
    'Acme, Bank!',
  ])('%s', (name) => {
    const r = checkAvailability(name);
    expect(r.alternatives.length).toBeGreaterThan(0);
    for (const alt of r.alternatives) {
      expect(findRestrictedWord(alt)).toBeUndefined();
    }
  });

  it('removes hit words cleanly', () => {
    expect(checkAvailability('Gulf Crypto Labs').alternatives[0]).toBe('Gulf Labs Holdings');
  });

  it('covers every restricted word', () => {
    for (const w of RESTRICTED_WORDS) {
      for (const alt of checkAvailability(`Acme ${w}`).alternatives) {
        expect(findRestrictedWord(alt)).toBeUndefined();
      }
    }
  });
});

describe('empty input (AC5)', () => {
  it.each(['', '   ', '\t\n'])('%j', (name) => {
    const r = checkAvailability(name);
    expect(r.checkable).toBe(false);
    expect(r.alternatives).toEqual([]);
  });
});
