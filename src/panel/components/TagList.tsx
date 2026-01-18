import React, { useMemo, useState } from 'react';
import { getTagSuggestions } from '../../shared/tag_utils';
import { useTags } from '../hooks/useTags';

interface Props {
    selectedTags: string[];
    onToggle: (tag: string) => void;
    inputBase: string; // for suggestions
}

export const TagList: React.FC<Props> = ({ selectedTags, onToggle, inputBase }) => {
    const { config, addTag } = useTags();
    const [newTagInput, setNewTagInput] = useState('');
    const [isInputVisible, setIsInputVisible] = useState(false);

    // 1. Get high-relevance suggestions (limit 50 to practically get all matches)
    const suggestions = useMemo(() => {
        return getTagSuggestions(inputBase, config, 50);
    }, [inputBase, config]);

    // 2. Get all other tags that weren't suggested (zero score matches)
    const otherTags = useMemo(() => {
        return config.tags.filter(t => !suggestions.includes(t));
    }, [config.tags, suggestions]);

    // Combine for display: Suggestions first, then others
    const displayTags = [...suggestions, ...otherTags].filter(t => !selectedTags.includes(t));

    const handleAddSubmit = async () => {
        if (!newTagInput.trim()) {
            setIsInputVisible(false);
            return;
        }

        // Auto-add # if missing
        let tagToAdd = newTagInput.trim();
        if (!tagToAdd.startsWith('#')) {
            tagToAdd = '#' + tagToAdd;
        }

        await addTag(tagToAdd);
        onToggle(tagToAdd); // Auto-select the new tag
        setNewTagInput('');
        setIsInputVisible(false);
    };

    return (
        <div className="flex flex-wrap gap-2 mt-2 items-center">
            {selectedTags.map(tag => (
                <span
                    key={tag}
                    onClick={() => onToggle(tag)}
                    className="cursor-pointer bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2 py-1 rounded border border-blue-200 dark:border-blue-800 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-800 dark:hover:text-red-200 hover:border-red-200 dark:hover:border-red-800 transition-colors select-none"
                    title="Click to remove"
                >
                    {tag}
                </span>
            ))}

            {displayTags.map(tag => (
                <span
                    key={tag}
                    onClick={() => onToggle(tag)}
                    className="cursor-pointer bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors select-none"
                >
                    {tag}
                </span>
            ))}

            {/* Add Tag UI */}
            {isInputVisible ? (
                <input
                    type="text"
                    autoFocus
                    className="border border-blue-300 rounded px-1 py-0.5 text-xs outline-none w-24"
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
                    className="text-xs text-gray-400 hover:text-blue-500 border border-transparent hover:border-blue-200 rounded px-1 py-0.5 transition-all"
                    title="Add new tag"
                >
                    + Add
                </button>
            )}
        </div>
    );
};
