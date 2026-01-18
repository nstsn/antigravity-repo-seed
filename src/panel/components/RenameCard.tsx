import React, { useState, useEffect } from 'react';
import { TagList } from './TagList';
import { formatTitle, parseTitle, generateDatePrefix } from '../../shared/title_utils';
import { RenameResult } from '../../shared/types';

interface Props {
    currentTitle: string;
    onRename: (newTitle: string, tags: string[]) => void;
    onUndo: () => void;
    onReset: () => void;
    status: 'idle' | 'loading' | 'success' | 'error';
    lastResult: RenameResult | null;
}

export const RenameCard: React.FC<Props> = ({ currentTitle, onRename, onUndo, onReset, status, lastResult }) => {
    const [baseInput, setBaseInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [datePrefix, setDatePrefix] = useState('');

    const inputRef = React.useRef<HTMLInputElement>(null);

    // Auto-focus on status idle
    useEffect(() => {
        if (status === 'idle' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [status]);

    // Listen for background focus command
    useEffect(() => {
        const listener = (msg: any) => {
            if (msg.type === 'FOCUS_INPUT' && inputRef.current) {
                inputRef.current.focus();
            }
        };
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener(listener);
            return () => chrome.runtime.onMessage.removeListener(listener);
        }
    }, []);

    // Init from current title
    useEffect(() => {
        if (currentTitle) {
            const parsed = parseTitle(currentTitle);
            setBaseInput(parsed.titleBody);
            setTags(parsed.tags);
            setDatePrefix(parsed.datePrefix || generateDatePrefix());
        } else {
            setDatePrefix(generateDatePrefix());
        }
    }, [currentTitle]);

    const toggleTag = (tag: string) => {
        if (tags.includes(tag)) {
            setTags(tags.filter(t => t !== tag));
        } else {
            if (tags.length < 3) setTags([...tags, tag]);
        }
    };

    const preview = formatTitle(baseInput, tags, datePrefix);
    const isChanged = preview !== currentTitle;
    const canSubmit = baseInput.length > 0 && isChanged && status !== 'loading';

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mt-2 transition-colors">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rename Thread</label>

            <div className="flex gap-2 mb-3">
                <span className="text-gray-400 dark:text-gray-500 font-mono text-sm self-center select-none">{datePrefix}</span>
                <input
                    ref={inputRef}
                    type="text"
                    className="flex-1 border dark:border-gray-600 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-brand-blue outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    value={baseInput}
                    onChange={(e) => setBaseInput(e.target.value)}
                    placeholder="Topic description..."
                    disabled={status === 'loading'}
                    onKeyDown={(e) => e.key === 'Enter' && canSubmit && onRename(preview, tags)}
                />
            </div>

            <TagList selectedTags={tags} onToggle={toggleTag} inputBase={baseInput} />

            <div className="mt-4 p-2 bg-gray-50 dark:bg-gray-900/50 rounded text-xs text-gray-600 dark:text-gray-300 break-all border dark:border-gray-700">
                <span className="font-semibold text-gray-400 dark:text-gray-500 block mb-1">PREVIEW</span>
                {preview}
            </div>

            <div className="flex items-center justify-between mt-4">
                {status === 'success' ? (
                    <div className="flex flex-col w-full gap-2">
                        <div className="flex items-center gap-2 w-full">
                            <span className="text-green-600 text-xs font-bold animate-pulse">Success!</span>
                            <button
                                onClick={onUndo}
                                className="ml-auto text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                                <span>↩</span> Undo Change
                            </button>
                        </div>
                        <button
                            onClick={onReset}
                            className="w-full py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                        >
                            Rename Again
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => onRename(preview, tags)}
                        disabled={!canSubmit}
                        className={`w-full py-1.5 rounded text-sm font-semibold transition-all ${canSubmit
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {status === 'loading' ? 'Processing...' : 'Rename Thread'}
                    </button>
                )}
            </div>

            {status === 'error' && (
                <div className="mt-3 text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-900/30">
                    <strong>Error:</strong> {lastResult?.hint || 'Something went wrong.'}
                </div>
            )}
        </div>
    );
};
