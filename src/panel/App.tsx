import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { RenameCard } from './components/RenameCard';
import { SearchCard } from './components/SearchCard';
import { useRename } from './hooks/useRename';

import { storage } from '../shared/storage';
import { ThemeMode } from '../shared/types';

function App() {
    const {
        threadInfo,
        status,
        lastResult,
        undoRename,
        executeRename,
        resetStatus
    } = useRename();

    const [theme, setTheme] = useState<ThemeMode>('system');

    // Load initial theme
    useEffect(() => {
        storage.getTheme().then(setTheme);
    }, []);

    // Apply theme
    useEffect(() => {
        const root = document.documentElement;
        const applyDark = () => root.classList.add('dark');
        const removeDark = () => root.classList.remove('dark');

        if (theme === 'dark') {
            applyDark();
        } else if (theme === 'light') {
            removeDark();
        } else {
            // System
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            if (mediaQuery.matches) applyDark();
            else removeDark();

            const handler = (e: MediaQueryListEvent) => {
                if (e.matches) applyDark();
                else removeDark();
            };
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }
    }, [theme]);

    const toggleTheme = () => {
        const modes: ThemeMode[] = ['system', 'light', 'dark'];
        const nextIndex = (modes.indexOf(theme) + 1) % modes.length;
        const nextMode = modes[nextIndex];
        setTheme(nextMode);
        storage.saveTheme(nextMode);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden text-gray-900 dark:text-gray-100 transition-colors">
            <Header
                service={threadInfo ? (threadInfo.service || null) : null}
                currTitle={threadInfo?.title}
                theme={theme}
                onToggleTheme={toggleTheme}
            />

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-3">
                {/* Rename Section (Top) */}
                {threadInfo ? (
                    <RenameCard
                        currentTitle={threadInfo.title}
                        onRename={(newTitle, tags) => executeRename(newTitle, tags)}
                        onUndo={undoRename}
                        onReset={resetStatus}
                        status={status}
                        lastResult={lastResult}
                    />
                ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs p-3 rounded border border-yellow-200 dark:border-yellow-700 mb-4 transition-colors">
                        Open ChatGPT or Gemini tab to rename threads.
                    </div>
                )}

                <SearchCard />
            </div>
        </div>
    );
}

export default App;
