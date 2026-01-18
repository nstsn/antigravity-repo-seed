import React from 'react';
import { ThemeMode } from '../../shared/types';

interface Props {
    service: 'chatgpt' | 'gemini' | null;
    currTitle?: string;
    theme: ThemeMode;
    onToggleTheme: () => void;
}

export const Header: React.FC<Props> = ({ service, currTitle, theme, onToggleTheme }) => {
    return (
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-3 shadow-sm transition-colors flex justify-between items-start">
            <div className="flex flex-col gap-1 overflow-hidden">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${service ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {service === 'chatgpt' ? 'ChatGPT' : service === 'gemini' ? 'Gemini' : 'No Activate Thread'}
                    </span>
                </div>
                {currTitle && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]" title={currTitle}>
                        {currTitle}
                    </div>
                )}
            </div>

            <button
                onClick={onToggleTheme}
                className="text-xs border dark:border-gray-600 rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-300 min-w-[60px] text-center"
                title="Toggle Theme"
            >
                {theme === 'system' ? 'Auto' : theme === 'light' ? 'Light' : 'Dark'}
            </button>
        </div>
    );
};
