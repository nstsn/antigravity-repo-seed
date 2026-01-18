import { useState, useCallback, useEffect } from 'react';
import { RenamedThreadRecord, RenameResult } from '../../shared/types';
import { formatTitle } from '../../shared/title_utils';
import { storage } from '../../shared/storage';

interface ThreadInfo {
    service: 'chatgpt' | 'gemini' | null;
    title: string;
    url: string;
}

export function useRename() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [threadInfo, setThreadInfo] = useState<ThreadInfo | null>(null);
    const [lastResult, setLastResult] = useState<RenameResult | null>(null);
    const [prevTitleForUndo, setPrevTitleForUndo] = useState<string | null>(null);

    // Real initialization
    useEffect(() => {
        const fetchInfo = async () => {
            if (typeof chrome === 'undefined' || !chrome.tabs) return;

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id) return;

            try {
                chrome.tabs.sendMessage(tab.id, { type: 'GET_THREAD_INFO' }, (response) => {
                    if (chrome.runtime.lastError) {
                        setThreadInfo(null);
                        return;
                    }
                    if (response && response.service) {
                        setThreadInfo(response);
                    } else {
                        setThreadInfo(null);
                    }
                });
            } catch (e) {
                setThreadInfo(null);
            }
        };

        fetchInfo();
        const interval = setInterval(fetchInfo, 1000);
        return () => clearInterval(interval);
    }, []);

    const generatePreview = useCallback((base: string, tags: string[]) => {
        return formatTitle(base, tags);
    }, []);

    const executeRename = async (newTitle: string, tags: string[]) => {
        setStatus('loading');

        if (typeof chrome === 'undefined' || !chrome.tabs) {
            setStatus('error');
            return;
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) {
            setStatus('error');
            return;
        }

        // Save prev title for Undo
        const currentTitle = threadInfo?.title || '';
        setPrevTitleForUndo(currentTitle);

        chrome.tabs.sendMessage(tab.id, { type: 'RENAME_THREAD', newTitle }, async (res: RenameResult) => {
            if (chrome.runtime.lastError) {
                setLastResult({ success: false, hint: chrome.runtime.lastError.message });
                setStatus('error');
                return;
            }

            setLastResult(res);

            if (res.success) {
                setStatus('success');
                // Save to storage
                if (threadInfo) {
                    const record: RenamedThreadRecord = {
                        id: threadInfo.url,
                        service: threadInfo.service!,
                        url: threadInfo.url,
                        title: newTitle,
                        prevTitle: currentTitle,
                        datePrefix: newTitle.split('_')[0] || '',
                        tags,
                        renamedAt: Date.now()
                    };
                    await storage.saveThread(record);

                    for (const tag of tags) {
                        await storage.addTag(tag);
                    }
                }

                setThreadInfo(prev => prev ? { ...prev, title: newTitle } : null);
            } else {
                setStatus('error');
            }
        });
    };

    const undoRename = async () => {
        if (prevTitleForUndo) {
            await executeRename(prevTitleForUndo, []);
        }
    };

    return {
        status,
        threadInfo,
        lastResult,
        generatePreview,
        executeRename,
        undoRename,
        resetStatus: () => setStatus('idle')
    };
}
