import { useState, useEffect, useCallback } from 'react';
import { storage } from '../../shared/storage';
import { TagConfig } from '../../shared/types';

export function useTags() {
    const [config, setConfig] = useState<TagConfig>({ tags: [], pinned: [], recent: [] });

    const loadTags = useCallback(async () => {
        if (typeof chrome === 'undefined' || !chrome.storage) return;
        const data = await storage.getTags();
        setConfig(data);
    }, []);

    useEffect(() => {
        loadTags();
    }, [loadTags]);

    const addTag = async (newTag: string) => {
        if (!newTag) return;
        await storage.addTag(newTag);
        await loadTags(); // Reload after add
    };

    return {
        config,
        addTag
    };
}
