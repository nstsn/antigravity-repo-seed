console.log('Background service worker loaded.');

// Open side panel on icon click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));

chrome.commands.onCommand.addListener((command) => {
    if (command === '_execute_action') {
        // Send focus signal to panel in case it is already open and valid
        // Note: If panel is not open, this message might not be received (handled by mount focus)
        chrome.runtime.sendMessage({ type: 'FOCUS_INPUT' }).catch(() => {
            // Ignore error if panel is closed
        });
    }
});
