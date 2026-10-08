# Little Letters

A mobile-friendly Persian writing activity for English-dominant children. Built with plain HTML, CSS, and JavaScript; no build step, framework, backend, or accounts.

## Preview

From this directory, run:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser. You can also open `index.html` directly. To test on a phone or tablet on the same local network, use your computer’s local IP address and port 8000.

## Files

- `index.html`: accessible activity structure and controls.
- `styles.css`: responsive layout, touch targets, and Persian typography.
- `app.js`: five word activities, reusable letter bank, pointer dragging, tap controls, checking, and audio handling.

## Activity

Words: آب، بابا، مامان، نان، سیب. Tap or drag bank letters to add them; the bank is reusable for repeated letters. Answers start on the right. Drag answer letters to rearrange them or outside the answer box to remove them. Alternatively, select a letter and use the move/remove buttons (also available to keyboard users). Incorrect answers remain editable without revealing the solution. Correct answers unlock the next word; finishing allows another round.

## Audio

Optional recordings belong at `audio/ab.mp3`, `audio/baba.mp3`, `audio/maman.mp3`, `audio/nan.mp3`, and `audio/sib.mp3`. No recordings are included. The app tries the recording first, then a Persian browser speech voice when installed. If neither is available, it gives an English meaning prompt without displaying the Persian answer. This placeholder supports building words but does not validate listening comprehension. Recording playback requires a child’s button tap.

Vazirmatn is loaded from Google Fonts, with system/Arial fallbacks when offline. No external service is required for the activity.
