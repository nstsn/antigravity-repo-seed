import { ChatGPTAdapter } from '../adapters/chatgpt';
import { GeminiAdapter } from '../adapters/gemini';
import { SiteAdapter } from '../adapters/interface';

const adapters: SiteAdapter[] = [
    new ChatGPTAdapter(),
    new GeminiAdapter()
];

let currentAdapter: SiteAdapter | null = null;

function detectAdapter() {
    const url = window.location.href;
    currentAdapter = adapters.find(a => a.canHandle(url)) || null;
    console.log('Thread Renamer: Adapter detected:', currentAdapter ? 'Yes' : 'No');
}

detectAdapter();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Thread Renamer: Message received', message);

    if (message.type === 'GET_THREAD_INFO') {
        if (!currentAdapter) detectAdapter();
        if (!currentAdapter) {
            sendResponse(null); // Or error
            return false;
        }

        currentAdapter.getActiveThreadInfo()
            .then(info => sendResponse(info))
            .catch(err => {
                console.error(err);
                sendResponse(null);
            });
        return true;
    }

    if (message.type === 'RENAME_THREAD') {
        if (!currentAdapter) return sendResponse({ success: false, errorCode: 'NO_ADAPTER' });

        currentAdapter.renameActiveThread(message.newTitle)
            .then(result => sendResponse(result))
            .catch(err => sendResponse({ success: false, errorCode: 'EXEC_ERROR', hint: err.message }));
        return true;
    }
});

// SPA URL change detection
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        console.log('Thread Renamer: URL changed');
        detectAdapter();
    }
});
observer.observe(document.body, { childList: true, subtree: true });
