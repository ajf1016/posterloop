const vscode = require('vscode');

let statusBarItem;
let timer;         // reminder timer (ms -> setTimeout)
let uiInterval;    // status bar tick every 1s
let nextDueAt;     // timestamp for next reminder

// Activity tracking
let lastActivity = 0;         // last activity timestamp (ms)
let activePeriodStart = 0;    // when continuous activity started

// Defaults (will be read from configuration on start/schedule)
const DEFAULTS = {
  intervalMinutes: 30,
  deepWorkThresholdMinutes: 25, // continuous activity that counts as deep work
  idleThresholdSeconds: 60,     // if no activity for this many seconds => idle
  softDelayMinutes: 5,          // postpone amount when soft reminder is acknowledged
  hardSnoozeMinutes: 1          // snooze option on hard reminder
};

function now() { return Date.now(); }

function updateStatusBar() {
  if (!statusBarItem) return;
  if (!nextDueAt) {
    statusBarItem.text = '$(clock) PostureLoop: inactive';
    statusBarItem.tooltip = 'Start PostureLoop reminders';
    statusBarItem.command = 'posterloop.start';
  } else {
    const remaining = Math.max(0, nextDueAt - now());
    const mins = Math.floor(remaining / 1000 / 60);
    const secs = Math.floor((remaining / 1000) % 60);
    statusBarItem.text = `$(clock) Break in ${mins}:${secs.toString().padStart(2,'0')}`;
    statusBarItem.tooltip = 'Stop PostureLoop reminders';
    statusBarItem.command = 'posterloop.stop';
  }
  statusBarItem.show();
}

// Activity update — call when we detect editor interactions
function recordActivity() {
  const ts = now();
  // if this is the first activity or previous activity was long ago, start a new active period
  if (!lastActivity || (ts - lastActivity) > 30 * 1000) {
    activePeriodStart = ts;
  }
  lastActivity = ts;
}

// Returns true if user has been continuously active for >= deepWorkThresholdMinutes
function isDeepWork(cfg) {
  const deepMs = (cfg.deepWorkThresholdMinutes ?? DEFAULTS.deepWorkThresholdMinutes) * 60 * 1000;
  if (!activePeriodStart) return false;
  return (now() - activePeriodStart) >= deepMs;
}

// Returns true if user is idle (no activity in idleThresholdSeconds)
function isIdle(cfg) {
  const idleMs = (cfg.idleThresholdSeconds ?? DEFAULTS.idleThresholdSeconds) * 1000;
  if (!lastActivity) return true;
  return (now() - lastActivity) >= idleMs;
}

// Core scheduling logic
function scheduleNext(context, msOverride) {
  // read config
  const cfgRaw = vscode.workspace.getConfiguration('posterloop');
  const cfg = {
    intervalMinutes: cfgRaw.get('intervalMinutes', DEFAULTS.intervalMinutes),
    deepWorkThresholdMinutes: cfgRaw.get('deepWorkThresholdMinutes', DEFAULTS.deepWorkThresholdMinutes),
    idleThresholdSeconds: cfgRaw.get('idleThresholdSeconds', DEFAULTS.idleThresholdSeconds),
    softDelayMinutes: cfgRaw.get('softDelayMinutes', DEFAULTS.softDelayMinutes),
    hardSnoozeMinutes: cfgRaw.get('hardSnoozeMinutes', DEFAULTS.hardSnoozeMinutes)
  };

  const ms = msOverride ?? (cfg.intervalMinutes * 60 * 1000);
  nextDueAt = now() + ms;

  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    // Decide reminder type
    const deep = isDeepWork(cfg);
    const idle = isIdle(cfg);

    if (deep && !idle) {
      // Soft reminder: user is in deep work, prefer minimal disruption
      const result = await vscode.window.showInformationMessage(
        `You’ve been focused for ${cfg.deepWorkThresholdMinutes} minutes. Consider a short posture break when you reach a natural pause.`,
        'Acknowledge', 'Postpone 5m'
      );
      if (result === 'Postpone 5m') {
        // postpone by softDelayMinutes
        scheduleNext(context, (cfg.softDelayMinutes * 60 * 1000));
      } else {
        // acknowledged — schedule next at normal interval
        scheduleNext(context);
      }
    } else {
      // Hard reminder: idle or browsing — interrupt
      const action = await vscode.window.showWarningMessage(
        'PostureLoop: Time to stand and move for 30s — you appear idle or in low-focus mode.',
        'I stood up', 'Snooze 1m'
      );
      if (action === 'Snooze 1m') {
        scheduleNext(context, (cfg.hardSnoozeMinutes * 60 * 1000));
      } else {
        // User took action or dismissed; schedule normally
        scheduleNext(context);
      }
    }
  }, ms);

  // start UI tick for countdown
  updateStatusBar();
  if (uiInterval) clearInterval(uiInterval);
  uiInterval = setInterval(updateStatusBar, 1000);
}

// Clean up timers
function clearAllTimers() {
  if (timer) { clearTimeout(timer); timer = undefined; }
  if (uiInterval) { clearInterval(uiInterval); uiInterval = undefined; }
  nextDueAt = undefined;
  updateStatusBar();
}

// Activate and wire up activity listeners
function activate(context) {
  console.log('PostureLoop activated');

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  context.subscriptions.push(statusBarItem);

  // Commands
  const startCmd = vscode.commands.registerCommand('posterloop.start', () => {
    scheduleNext(context);
    vscode.window.showInformationMessage('PostureLoop started.');
  });

  const stopCmd = vscode.commands.registerCommand('posterloop.stop', () => {
    if (timer) {
      clearAllTimers();
      vscode.window.showInformationMessage('PostureLoop stopped.');
    } else {
      vscode.window.showInformationMessage('PostureLoop is not running.');
    }
  });

  // Debug / dump commands (optional)
  const dumpCmd = vscode.commands.registerCommand('posterloop.dumpCommands', async () => {
    const cmds = await vscode.commands.getCommands(true);
    const my = cmds.filter(c => c.includes('posterloop'));
    console.log('posterloop commands (from getCommands):', my);
    const out = vscode.window.createOutputChannel('PostureLoop Debug');
    out.appendLine(`posterloop commands (count ${my.length}):`);
    my.forEach(c => out.appendLine('  ' + c));
    out.show(true);
    vscode.window.showInformationMessage('posterloop commands logged to console and output channel.');
  });

  context.subscriptions.push(startCmd, stopCmd, dumpCmd);

  // Activity listeners (inside editor)
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(() => recordActivity()),
    vscode.window.onDidChangeTextEditorSelection(() => recordActivity()),
    vscode.window.onDidChangeActiveTextEditor(() => recordActivity()),
    vscode.window.onDidChangeWindowState((s) => {
      // window minimize/focus change counts as activity marker
      if (s.focused) recordActivity();
    })
  );

  // show status bar initially
  updateStatusBar();
}

function deactivate() {
  clearAllTimers();
}

module.exports = { activate, deactivate };
