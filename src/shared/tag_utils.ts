import { TagConfig } from './types';

// Simple Jaccard-like or substring match for ranking
export const getTagSuggestions = (
    input: string,
    config: TagConfig,
    limit: number = 5
): string[] => {
    const allTags = config.tags;
    const recent = config.recent || [];
    const pinned = config.pinned || [];

    if (!input) {
        // Return pinned + recent + defaults
        const combined = [...new Set([...pinned, ...recent, ...allTags])];
        return combined.slice(0, limit);
    }

    // Scoring
    const scores = allTags.map(tag => {
        let score = 0;
        // Normalized comparison
        const normTag = tag.toLowerCase().replace(/^#/, '');
        const normInput = input.toLowerCase();

        // Exact match (highest)
        if (normTag === normInput) score += 100;
        // Prefix match
        else if (normTag.startsWith(normInput)) score += 50;
        // Partial match
        else if (normTag.includes(normInput)) score += 20;

        // Bonus for pinned/recent
        if (pinned.includes(tag)) score += 10;
        if (recent.includes(tag)) score += 5;

        return { tag, score };
    });

    // Filter 0 scores and sort
    const candidates = scores
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(s => s.tag);

    return candidates.slice(0, limit);
};
