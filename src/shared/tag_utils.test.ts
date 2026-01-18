import { describe, it, expect } from 'vitest';
import { getTagSuggestions } from './tag_utils';
import { TagConfig } from './types';

describe('tag_utils', () => {
    const baseConfig: TagConfig = {
        tags: ['#react', '#typescript'],
        pinned: [],
        recent: []
    };

    it('returns empty when no match', () => {
        const res = getTagSuggestions('xyz', baseConfig);
        expect(res).toEqual([]);
    });

    it('ranks exact match first', () => {
        const config = { ...baseConfig, tags: ['#react', '#react-router'] };
        const res = getTagSuggestions('react', config);
        expect(res[0]).toBe('#react');
    });

    it('ranks prefix match positive', () => {
        const config = { ...baseConfig, tags: ['#architecture'] };
        const res = getTagSuggestions('arch', config);
        expect(res).toContain('#architecture');
    });

    it('handles empty input', () => {
        const config: TagConfig = {
            tags: ['#a', '#b'],
            pinned: ['#a'],
            recent: []
        };
        const res = getTagSuggestions('', config);
        expect(res).toContain('#a');
        expect(res).toContain('#b');
    });
});
