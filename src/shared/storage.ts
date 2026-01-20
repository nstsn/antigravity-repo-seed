import { RenamedThreadRecord, TagConfig, ThemeMode as ImportedThemeMode } from './types';

// Keys
const KEY_TAGS = 'user_tags';
const KEY_INDEX = 'thread_index';
const KEY_THEME = 'user_theme';

export const storage = {
    // Theme
    async getTheme(): Promise<ImportedThemeMode> {
        const res = await chrome.storage.local.get(KEY_THEME);
        return (res[KEY_THEME] as ImportedThemeMode) || 'system';
    },

    async saveTheme(mode: ImportedThemeMode): Promise<void> {
        await chrome.storage.local.set({ [KEY_THEME]: mode });
    },

    // Tags
    async getTags(): Promise<TagConfig> {
        const res = await chrome.storage.local.get(KEY_TAGS);
        const config = res[KEY_TAGS] as TagConfig;
        return {
            tags: config?.tags || [],
            pinned: config?.pinned || [],
            recent: config?.recent || []
        };
    },

    async saveTags(config: TagConfig): Promise<void> {
        await chrome.storage.local.set({ [KEY_TAGS]: config });
    },

    async addTag(newTag: string): Promise<void> {
        const config = await this.getTags();
        if (!config.tags.includes(newTag)) {
            config.tags.push(newTag);
            await this.saveTags(config);
        }
    },

    async toggleTagPin(tag: string): Promise<void> {
        const config = await this.getTags();
        if (!config.pinned) config.pinned = [];
        const index = config.pinned.indexOf(tag);
        if (index >= 0) {
            config.pinned.splice(index, 1);
        } else {
            config.pinned.push(tag);
        }
        await this.saveTags(config);
    },

    async updateRecentTags(tags: string[]): Promise<void> {
        if (tags.length === 0) return;
        const config = await this.getTags();
        let recent = config.recent || [];
        
        // Remove existing occurrences to move them to front
        recent = recent.filter(t => !tags.includes(t));
        // Add new tags to front
        recent = [...tags, ...recent];
        // Limit to 10
        config.recent = recent.slice(0, 10);
        
        await this.saveTags(config);
    },

    // Threads
    async getThreads(): Promise<RenamedThreadRecord[]> {
        const res = await chrome.storage.local.get(KEY_INDEX);
        return (res[KEY_INDEX] as RenamedThreadRecord[]) || [];
    },

    async saveThread(record: RenamedThreadRecord): Promise<void> {
        const threads = await this.getThreads();
        const index = threads.findIndex(t => t.id === record.id);
        if (index >= 0) {
            threads[index] = record;
        } else {
            threads.push(record);
        }
        await chrome.storage.local.set({ [KEY_INDEX]: threads });
    },

    async togglePin(id: string): Promise<void> {
        const threads = await this.getThreads();
        const index = threads.findIndex(t => t.id === id);
        if (index >= 0) {
            threads[index].isPinned = !threads[index].isPinned;
            await chrome.storage.local.set({ [KEY_INDEX]: threads });
        }
    },

    async toggleFavorite(id: string): Promise<void> {
        const threads = await this.getThreads();
        const index = threads.findIndex(t => t.id === id);
        if (index >= 0) {
            threads[index].isFavorite = !threads[index].isFavorite;
            await chrome.storage.local.set({ [KEY_INDEX]: threads });
        }
    },

    async searchThreads(query: { tag?: string; isFavorite?: boolean; keyword?: string; period?: 'all' | 'today' | 'week' | 'month'; sort?: 'date_desc' | 'date_asc' | 'tag' }): Promise<RenamedThreadRecord[]> {
        const threads = await this.getThreads();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;
        const oneMonth = 30 * oneDay; // Approximate

        const filtered = threads.filter(t => {
            let match = true;

            // Favorite Filter
            if (query.isFavorite && !t.isFavorite) match = false;

            // Period Filter
            if (query.period && query.period !== 'all') {
                const ts = t.renamedAt || 0;
                if (query.period === 'today') {
                    const startOfToday = new Date();
                    startOfToday.setHours(0, 0, 0, 0);
                    if (ts < startOfToday.getTime()) match = false;
                } else if (query.period === 'week') {
                    if (ts < now - oneWeek) match = false;
                } else if (query.period === 'month') {
                    if (ts < now - oneMonth) match = false;
                }
            }

            // Tag Filter
            if (query.tag) {
                if (query.tag === '__ANY_TAG__') {
                    if (!t.tags || t.tags.length === 0) match = false;
                } else if (!t.tags.includes(query.tag)) {
                    match = false;
                }
            }
            if (query.keyword && !t.title.toLowerCase().includes(query.keyword.toLowerCase())) match = false;
            return match;
        });

        // Sorting
        const sortMode = query.sort || 'date_desc';
        return filtered.sort((a, b) => {
            // Always put pinned items at the top
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;

            if (sortMode === 'date_asc') {
                return (a.renamedAt || 0) - (b.renamedAt || 0);
            } else if (sortMode === 'tag') {
                const tagA = a.tags[0] || '';
                const tagB = b.tags[0] || '';
                return tagA.localeCompare(tagB) || (b.renamedAt || 0) - (a.renamedAt || 0);
            } else {
                // date_desc (default)
                return (b.renamedAt || 0) - (a.renamedAt || 0);
            }
        });
    }
};
