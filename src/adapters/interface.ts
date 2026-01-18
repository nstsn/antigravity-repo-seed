import { RenameResult } from '../shared/types';

export interface ThreadInfo {
    service: 'chatgpt' | 'gemini';
    title?: string;
    url: string;
}

export interface SiteAdapter {
    canHandle(url: string): boolean;
    getActiveThreadInfo(): Promise<ThreadInfo | null>;
    renameActiveThread(newTitle: string): Promise<RenameResult>;
}
