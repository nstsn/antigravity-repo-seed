import React from 'react';
import { useSearch } from '../hooks/useSearch';
import { useTags } from '../hooks/useTags';

export const SearchCard: React.FC = () => {
    const { results, setQuery, query, togglePin, toggleFavorite } = useSearch();
    const { config } = useTags();

    const handleJump = async (url: string, mode: 'current' | 'tab' | 'window') => {
        if (typeof chrome === 'undefined' || !chrome.tabs) {
            window.open(url, mode === 'current' ? '_self' : '_blank');
            return;
        }

        if (mode === 'window') {
            chrome.windows.create({ url });
        } else if (mode === 'tab') {
            chrome.tabs.create({ url });
        } else {
            // Jump in current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
                chrome.tabs.update(tab.id, { url });
            } else {
                chrome.tabs.create({ url });
            }
        }
    };

    const onCardClick = (e: React.MouseEvent | React.KeyboardEvent, url: string) => {
        // Handle accessibility (Enter/Space)
        if ('key' in e && e.key !== 'Enter' && e.key !== ' ') return;

        e.preventDefault();

        let mode: 'current' | 'tab' | 'window' = 'current';
        if (e.shiftKey) {
            mode = 'window';
        } else if (e.metaKey || e.ctrlKey) {
            mode = 'tab';
        }

        handleJump(url, mode);
    };

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-2 px-1">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">History / Search</h3>
                <div className="flex items-center gap-2">
                    {/* Clear Button */}
                    {(query.keyword || query.tag || query.isFavorite || (query.period && query.period !== 'all')) && (
                        <button
                            onClick={() => setQuery({ keyword: '', tag: '', isFavorite: false, period: 'all', sort: 'date_desc' })}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            Clear All
                        </button>
                    )}

                    <button
                        onClick={() => setQuery({ ...query, isFavorite: !query.isFavorite })}
                        className={`text-sm px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${query.isFavorite ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' : 'bg-transparent text-gray-400 dark:text-gray-500 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        title={query.isFavorite ? "Show all (unfilter)" : "Filter by Favorites"}
                    >
                        <span className="text-base leading-none">★</span>
                        <span className="text-xs font-medium">Fav</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-2 p-1 mb-2">
                <div className="flex gap-2">
                    {/* Tag Filter (Dropdown) */}
                    <select
                        className="flex-1 text-xs border dark:border-gray-600 rounded px-1 py-1 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800"
                        value={query.tag || ''}
                        onChange={e => setQuery({ ...query, tag: e.target.value })}
                    >
                        <option value="">Tag</option>
                        <option value="__ANY_TAG__">Any</option>
                        {config.tags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                        ))}
                    </select>

                    {/* Sort */}
                    <select
                        className="w-16 text-xs border dark:border-gray-600 rounded px-1 py-1 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800"
                        value={query.sort || 'date_desc'}
                        onChange={e => setQuery({ ...query, sort: e.target.value as any })}
                    >
                        <option value="date_desc">New</option>
                        <option value="date_asc">Old</option>
                    </select>

                    {/* Period Filter */}
                    <select
                        className="w-20 text-xs border dark:border-gray-600 rounded px-1 py-1 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800"
                        value={query.period || 'all'}
                        onChange={e => setQuery({ ...query, period: e.target.value as any })}
                    >
                        <option value="all">Period</option>
                        <option value="today">Today</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                    </select>
                </div>

                <input
                    type="text"
                    placeholder="Filter by keyword..."
                    className="w-full text-xs border dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                    value={query.keyword}
                    onChange={e => setQuery({ ...query, keyword: e.target.value })}
                />
            </div>

            <div className="space-y-2 p-1">
                {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    let lastCategory: string | null = null;

                    return results.map(item => {
                        const renamedDate = new Date(item.renamedAt || 0);
                        renamedDate.setHours(0, 0, 0, 0);

                        let category = 'Earlier';
                        if (renamedDate.getTime() === today.getTime()) {
                            category = 'Today';
                        } else if (renamedDate.getTime() === yesterday.getTime()) {
                            category = 'Yesterday';
                        }

                        const showHeader = category !== lastCategory;
                        lastCategory = category;

                        const categoryLabel = category === 'Today' ? '今日 / Today' : category === 'Yesterday' ? '昨日 / Yesterday' : '以前 / Earlier';

                        return (
                            <React.Fragment key={item.id}>
                                {showHeader && (
                                    <div className="sticky top-0 z-10 bg-gray-50/90 dark:bg-[#1a1c24]/90 backdrop-blur-sm py-1 px-2 -mx-1 mb-1 mt-3 first:mt-0 border-b dark:border-gray-800">
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                                            {categoryLabel}
                                        </span>
                                    </div>
                                )}
                                <div
                                    onClick={(e) => onCardClick(e, item.url)}
                                    onKeyDown={(e) => onCardClick(e, item.url)}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`Jump to ${item.title}`}
                                    className={`bg-white dark:bg-gray-800 border cursor-pointer outline-none ${item.isPinned ? 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/10' : 'dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'} rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex flex-col gap-1 group transition-all`}
                                    title="Click to jump (Cmd/Ctrl: New Tab, Shift: New Window)"
                                >
                                    <div className="flex items-start gap-1">
                                        {/* Icons Column */}
                                        <div className="flex items-center pt-0.5">
                                            {/* Pin Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    togglePin(item.id);
                                                }}
                                                className={`transition-all px-0.5 ${item.isPinned ? 'text-gray-400 hover:text-yellow-500 opacity-100' : 'text-gray-300 hover:text-yellow-500 opacity-0 group-hover:opacity-100'}`}
                                                title={item.isPinned ? "Unpin" : "Pin to top"}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={item.isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={item.isPinned ? "fill-current" : ""}>
                                                    <line x1="12" y1="17" x2="12" y2="22"></line>
                                                    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
                                                </svg>
                                            </button>

                                            {/* Favorite Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleFavorite(item.id);
                                                }}
                                                className={`transition-all px-0.5 ${item.isFavorite ? 'text-gray-400 hover:text-orange-500 opacity-100' : 'text-gray-300 hover:text-orange-500 opacity-0 group-hover:opacity-100'}`}
                                                title={item.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={item.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Text Content Column */}
                                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                            <div className="font-medium text-xs truncate text-gray-800 dark:text-gray-200" title={item.title}>
                                                {item.title}
                                            </div>

                                            {/* Secondary Tag Display */}
                                            {item.tags && item.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-0.5">
                                                    {item.tags.map(tag => {
                                                        const displayTag = tag.startsWith('#') ? tag : '#' + tag;
                                                        return (
                                                            <button
                                                                key={tag}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setQuery({ ...query, tag: tag });
                                                                }}
                                                                className="text-[13px] text-gray-500 dark:text-gray-300 font-medium hover:text-blue-500 dark:hover:text-blue-400 hover:underline transition-colors"
                                                            >
                                                                {displayTag}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* External Link Hint */}
                                        <div className="opacity-0 group-hover:opacity-40 transition-opacity self-start mt-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                <polyline points="15 3 21 3 21 9"></polyline>
                                                <line x1="10" y1="14" x2="21" y2="3"></line>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    });
                })()}
                {results.length === 0 && (
                    <div className="text-center text-xs text-gray-400 py-4">No matching records</div>
                )}
            </div>
        </div>
    );
};
