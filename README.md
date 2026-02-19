# Contextual-Tidy
A lightweight Chrome extension that automatically renames "garbage" downloads (like social media images and random IDs) into clean, readable files using dates, site names, and page titles.

## Features
* **Smart Detection:** Only acts when it detects a random filename (e.g., `634983330_n.jpg`).
* **Contextual Renaming:** Uses a combination of `YYYY-MM-DD`, the **Site Name**, and the **Page Title**.
* **Safety First:** If a "good" name can't be found, it keeps the original to prevent useless names like `2026-02-19-i.jpg`.
* **Zero AI:** 100% heuristic-based. No API keys, no privacy concerns.
* **Desktop Notifications:** See exactly what a file was renamed to in real-time.

## How it Works
The extension monitors your downloads and applies a strict validation pipeline:
1. **Is it Garbage?** Matches against 12+ digit strings, long hex codes, or generic `IMG_` prefixes.
2. **Can we improve it?** Attempts to extract the domain (e.g., `amazon`, `facebook`) and a descriptive page title.
3. **Is the result quality?** If the new name is too short or lacks context, the rename is cancelled to avoid clutter.

## Installation

1. Clone this repository or download the source code.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** in the top right.
4. Click **Load unpacked** and select the extension folder.

## Inspiration

Tidy downloads from arc max.
<img src="https://github.com/user-attachments/assets/a92e8f3a-2788-4388-a980-1b569868d50e" width="1200" height="682" alt="OneShelf UI Preview">

## My extension

<img width="483" height="288" alt="Screenshot 2026-02-19 145318" src="https://github.com/user-attachments/assets/4b5dd5c3-e30c-47b4-a356-804fd3ed4c61" />
