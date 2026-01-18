import { SiteAdapter, ThreadInfo } from './interface';
import { RenameResult } from '../shared/types';

export class GeminiAdapter implements SiteAdapter {
    canHandle(url: string): boolean {
        return url.includes('gemini.google.com');
    }

    async getActiveThreadInfo(): Promise<ThreadInfo | null> {
        if (!this.canHandle(window.location.href)) return null;

        // Gemini Titles often: "Prompt text..." or "Title"
        // Also document.title usually reflects it.
        // Needs verification. But document.title is a good start.

        return {
            service: 'gemini',
            title: document.title,
            url: window.location.href
        };
    }

    async renameActiveThread(newTitle: string): Promise<RenameResult> {
        // Gemini DOM is different.
        // For MVP, we will use the Optimistic Fallback strategy immediately 
        // because we haven't researched Gemini selectors yet.

        try {
            // Attempt to update document title at least
            document.title = newTitle;

            // TODO: Implement actual DOM renaming for Gemini
            // 1. Find side bar item
            // 2. Click options
            // 3. Rename

            // Return "success" with a hint so the extension index is updated.
            return {
                success: true,
                errorCode: 'DOM_NOT_IMPLEMENTED',
                hint: 'Gemini visual rename not supported yet, but saved to extension history.'
            };
        } catch (e: any) {
            return {
                success: false,
                errorCode: 'UNKNOWN',
                hint: e.message
            };
        }
    }
}
