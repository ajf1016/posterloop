const vscode = require("vscode");

let statusBarItem;
let timer;
let nextDueAt;
let uiInterval;

function updateStatusBar() {
    if (!statusBarItem) return;
    if (uiInterval) clearInterval(uiInterval);
    uiInterval = setInterval(() => {
        updateStatusBar();
    }, 1000);
    if (!nextDueAt) {
        statusBarItem.text = "$(clock) PostureLoop: inactive";
        statusBarItem.tooltip = "Start PostureLoop reminders";
        statusBarItem.command = "posterloop.start";
    } else {
        const remaining = Math.max(0, nextDueAt - Date.now());
        const mins = Math.floor(remaining / 1000 / 60);
        const secs = Math.floor((remaining / 1000) % 60);
        statusBarItem.text = `$(clock) Break in ${mins}:${secs
            .toString()
            .padStart(2, "0")}`;
        statusBarItem.tooltip = "Stop PostureLoop reminders";
        statusBarItem.command = "posterloop.stop";
    }
    statusBarItem.show();
}

function scheduleNext(context) {
    const ms = 1 * 60 * 1000; // or your config
    nextDueAt = Date.now() + ms;

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
        vscode.window.showInformationMessage(
            'PostureLoop: Time to take a short break — stand up, stretch, look away for 30s.'
        );
        scheduleNext(context);
    }, ms);

    updateStatusBar();

    if (uiInterval) clearInterval(uiInterval);
    uiInterval = setInterval(() => {
        updateStatusBar();
    }, 1000);
}


function activate(context) {
    console.log("PostureLoop activated");

    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    context.subscriptions.push(statusBarItem);

    const startCmd = vscode.commands.registerCommand("posterloop.start", () => {
        scheduleNext(context);
        vscode.window.showInformationMessage("PostureLoop started.");
    });

    const stopCmd = vscode.commands.registerCommand('posterloop.stop', () => {
    if (timer) {
        clearTimeout(timer);
        timer = undefined;
        nextDueAt = undefined;
        if (uiInterval) clearInterval(uiInterval);
        updateStatusBar();
        vscode.window.showInformationMessage('PostureLoop stopped.');
    } else {
        vscode.window.showInformationMessage('PostureLoop is not running.');
    }
});

    context.subscriptions.push(startCmd, stopCmd);

    // show status bar initially
    updateStatusBar();
}

function deactivate() {
    if (timer) clearTimeout(timer);
}

module.exports = { activate, deactivate };
