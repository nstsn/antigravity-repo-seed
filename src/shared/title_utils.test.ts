import { describe, it, expect } from 'vitest';
import { generateDatePrefix, formatTitle, parseTitle } from './title_utils';

describe('title_utils', () => {
    it('generateDatePrefix returns YYMMDD_ format', () => {
        const date = new Date('2026-01-18T12:00:00');
        expect(generateDatePrefix(date)).toBe('260118_');
    });

    it('formatTitle combines prefix, body, and tags', () => {
        const prefix = '260118_';
        const body = 'Test Thread';
        const tags = ['#tag1', '#tag2'];
        expect(formatTitle(body, tags, prefix)).toBe('260118_Test Thread #tag1 #tag2');
    });

    it('formatTitle handles empty tags', () => {
        expect(formatTitle('Hello', [], '260118_')).toBe('260118_Hello');
    });

    it('parseTitle extracts parts correctly', () => {
        const raw = '260118_My Thread #aaa #bbb';
        const parsed = parseTitle(raw);
        expect(parsed.datePrefix).toBe('260118_');
        expect(parsed.titleBody).toBe('My Thread');
        expect(parsed.tags).toEqual(['#aaa', '#bbb']);
    });

    it('parseTitle handles no prefix', () => {
        const raw = 'My Thread #aaa';
        const parsed = parseTitle(raw);
        expect(parsed.datePrefix).toBeNull();
        expect(parsed.titleBody).toBe('My Thread');
        expect(parsed.tags).toEqual(['#aaa']);
    });

    it('parseTitle handles no tags', () => {
        const raw = '260118_Just Title';
        const parsed = parseTitle(raw);
        expect(parsed.tags).toEqual([]);
        expect(parsed.titleBody).toBe('Just Title');
    });
});
