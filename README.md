# PostureLoop — Smart Posture & Break Reminders for Developers

PostureLoop is an adaptive, non-annoying VS Code extension that helps you stay healthy while coding.  
It detects your activity patterns and delivers reminders that respect your deep-focus workflow instead of interrupting it blindly.

No spam. No popups every 20 minutes. Just intelligent nudges at the right moment.

---

## Features

### Adaptive Reminder System
PostureLoop watches your editor activity (typing, selections, focus) to understand *how* you're working:
- **Deep Work** → Minimal, soft reminders that don’t break your focus.
- **Idle / Browsing** → Stronger reminders when you’re not in the zone.
- **Smart delays** when you're actively typing or navigating code.

This keeps your workflow smooth while still keeping you healthy.

---

### Live Status Bar Countdown
A sleek timer in the status bar updates every second:
- Shows time left until your next break
- Click to **start** or **stop** reminders instantly

---

### Beautiful Break Webview (30-second micro-break)
When it’s time to reset:
- A clean modal-style webview appears
- Animated circular countdown
- Quick actions: **Done** or **Snooze**
- Auto-closes when the timer ends

---

### Fully Customizable
Configure everything in VS Code Settings:
- Reminder interval
- Deep-work threshold
- Idle detection sensitivity
- Soft/hard reminder durations
- Break length
- Snooze/Postpone behavior

---

## Settings

| Setting | Description | Default |
|--------|-------------|---------|
| `posterloop.intervalMinutes` | Base interval for reminders | `30` |
| `posterloop.deepWorkThresholdMinutes` | Continuous activity counted as deep work | `25` |
| `posterloop.idleThresholdSeconds` | Idle detection threshold | `60` |
| `posterloop.softDelayMinutes` | Postpone time for soft reminders | `5` |
| `posterloop.hardSnoozeMinutes` | Snooze time for hard reminders | `1` |
| `posterloop.breakDurationSeconds` | Duration of break webview countdown | `30` |

---

## Why PostureLoop?

Most break reminders are:
- too aggressive  
- badly timed  
- disruptive  
- impossible to follow while coding  

PostureLoop focuses on *flow-friendly ergonomics*.  
It reminds you only when it makes sense — and keeps quiet when you're in the zone.

---

## Commands

| Command | Action |
|---------|--------|
| `PostureLoop: Start Reminders` | Start break/ergonomics reminders |
| `PostureLoop: Stop Reminders` | Stop all timers |
| `PostureLoop: Dump Commands (debug)` | For debugging extension commands |

---

## How It Works (short version)

- Tracks VS Code activity events (`onDidChangeTextDocument`, selections, window focus)
- Detects deep-work or idle states
- Schedules reminders with a recursive `setTimeout` loop
- Renders a Webview UI for break sessions
- Uses status bar + settings for customization

---

## Privacy

PostureLoop **does not store or send any data externally.**  
All activity detection stays inside VS Code and never leaves your machine.

---

## License
MIT License — free to use, modify, and contribute.

---

## ❤️ Contribute
Issues, feature suggestions, and PRs are always welcome.

---

