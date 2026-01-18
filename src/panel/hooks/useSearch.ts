import { useState, useEffect } from 'react';
import { RenamedThreadRecord } from '../../shared/types';
import { storage } from '../../shared/storage';

interface SearchQuery {
    keyword: string;
    tag: string;
    isFavorite?: boolean;
    period?: 'all' | 'today' | 'week' | 'month';
    sort: 'date_desc' | 'date_asc' | 'tag';
}

export function useSearch() {
    const [results, setResults] = useState<RenamedThreadRecord[]>([]);
    const [query, setQuery] = useState<SearchQuery>({ keyword: '', tag: '', isFavorite: false, sort: 'date_desc' });

    useEffect(() => {
        if (typeof chrome === 'undefined' || !chrome.storage) return;

        storage.searchThreads(query).then(setResults);
    }, [query]);

    // Listen for external updates (e.g. rename happened)
    useEffect(() => {
        if (typeof chrome === 'undefined' || !chrome.storage) return;

        const listener = (changes: any, areaName: string) => {
            if (areaName === 'local' && changes['thread_index']) {
                storage.searchThreads(query).then(setResults);
            }
        };
        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }, [query]);

    const togglePin = async (id: string) => {
        await storage.togglePin(id);
    };

    const toggleFavorite = async (id: string) => {
        await storage.toggleFavorite(id);
    };

    return {
        results,
        setQuery,
        query,
        togglePin,
        toggleFavorite
    };
}
