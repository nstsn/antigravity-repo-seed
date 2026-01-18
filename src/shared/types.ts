// Theme parameter
export type ThemeMode = 'system' | 'light' | 'dark';

export interface TagConfig {
    tags: string[];
    pinned?: string[];
    recent?: string[];
}

export interface RenamedThreadRecord {
    id: string;
    service: 'chatgpt' | 'gemini';
    url: string;
    title: string;
    prevTitle: string;
    datePrefix: string;
    tags: string[];
    isPinned?: boolean;
    isFavorite?: boolean;
    renamedAt: number;
}

export interface RenameResult {
    success: boolean;
    errorCode?: string;
    hint?: string;
}
