import React, { useMemo, useState } from 'react';
import { getTagSuggestions } from '../../shared/tag_utils';
import { useTags } from '../hooks/useTags';

interface Props {
    selectedTags: string[];
    onToggle: (tag: string) => void;
    inputBase: string; // for suggestions
}

export const TagList: React.FC<Props> = ({ selectedTags, onToggle, inputBase }) => {
    const { config, addTag, togglePin } = useTags();
    const [newTagInput, setNewTagInput] = useState('');
    const [isInputVisible, setIsInputVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // 1. Get suggestions based on current input
    const suggestions = useMemo(() => {
        return getTagSuggestions(inputBase, config, 5);
    }, [inputBase, config]);

    // 2. Identify priority tags (Suggested, Pinned, Recent)
    const priorityTags = useMemo(() => {
        const pinned = config.pinned || [];
        const recent = config.recent || [];

        // Combine and de-duplicate priority categories
        const combined = [...new Set([...suggestions, ...pinned, ...recent])];

        // Filter out those already selected
        return combined.filter(t => !selectedTags.includes(t));
    }, [suggestions, config.pinned, config.recent, selectedTags]);

    // 3. Other tags (everything else)
    const otherTags = useMemo(() => {
        const prioritySet = new Set(priorityTags);
        const selectedSet = new Set(selectedTags);
        return config.tags.filter(t => !prioritySet.has(t) && !selectedSet.has(t));
    }, [config.tags, priorityTags, selectedTags]);

    const handleAddSubmit = async () => {
        if (!newTagInput.trim()) {
            setIsInputVisible(false);
            return;
        }

        let tagToAdd = newTagInput.trim();
        if (!tagToAdd.startsWith('#')) {
            tagToAdd = '#' + tagToAdd;
        }

        await addTag(tagToAdd);
        onToggle(tagToAdd);
        setNewTagInput('');
        setIsInputVisible(false);
    };

    const renderTag = (tag: string, type: 'selected' | 'priority' | 'other') => {
        const isPinned = config.pinned?.includes(tag);
        const isSelected = type === 'selected';

        let bgColor = "bg-gray-100 dark:bg-gray-700/50";
        let textColor = "text-gray-600 dark:text-gray-400";
        let borderColor = "border-transparent";

        if (isSelected) {
            bgColor = "bg-blue-100 dark:bg-blue-900/40";
            textColor = "text-blue-700 dark:text-blue-300";
            borderColor = "border-blue-200 dark:border-blue-800";
        } else if (type === 'priority') {
            bgColor = "bg-orange-50 dark:bg-orange-900/20";
            textColor = "text-orange-700 dark:text-orange-300";
        }

        return (
            <div
                key={tag}
                className={`group flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] transition-all select-none cursor-pointer ${bgColor} ${textColor} ${borderColor} hover:border-blue-400 dark:hover:border-blue-500`}
            >
                <span onClick={() => onToggle(tag)} className="flex-1">
                    {tag}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        togglePin(tag);
                    }}
                    className={`ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-500 ${isPinned ? 'opacity-100 text-blue-500' : 'text-gray-300'}`}
                    title={isPinned ? "Unpin tag" : "Pin tag"}
                >
                    {isPinned ? '📌' : '📍'}
                </button>
                {isSelected && (
                    <span onClick={() => onToggle(tag)} className="ml-1 text-[10px] hover:text-red-500">×</span>
                )}
            </div>
        );
    };

    return (
        <div className="mt-3">
            <div className="flex flex-wrap gap-1.5 items-center">
                {/* Selected Tags */}
                {selectedTags.map(tag => renderTag(tag, 'selected'))}

                {/* Priority Tags (Suggested, Pinned, Recent) */}
                {priorityTags.map(tag => renderTag(tag, 'priority'))}

                {/* Collapsible Others */}
                {!isExpanded && otherTags.length > 0 && (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="text-[10px] text-gray-400 hover:text-blue-500 border border-transparent hover:border-gray-200 rounded px-1.5 py-0.5 transition-all"
                    >
                        + {otherTags.length} more
                    </button>
                )}

                {isExpanded && otherTags.map(tag => renderTag(tag, 'other'))}

                {isExpanded && (
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="text-[10px] text-gray-400 hover:text-blue-500 border border-transparent hover:border-gray-200 rounded px-1.5 py-0.5 transition-all"
                    >
                        hide
                    </button>
                )}

                {/* Add Tag UI */}
                {isInputVisible ? (
                    <input
                        type="text"
                        autoFocus
                        className="border border-blue-300 dark:border-blue-700 rounded px-2 py-0.5 text-[11px] outline-none w-20 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        placeholder="#tag"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onBlur={handleAddSubmit}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddSubmit();
                            if (e.key === 'Escape') {
                                setNewTagInput('');
                                setIsInputVisible(false);
                            }
                        }}
                    />
                ) : (
                    <button
                        onClick={() => setIsInputVisible(true)}
                        className="text-[10px] text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-100 dark:border-blue-900/50 rounded px-2 py-0.5 transition-all font-medium"
                    >
                        + New
                    </button>
                )}
            </div>
        </div>
    );
};
