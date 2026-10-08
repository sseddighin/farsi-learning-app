'use strict';
const words = [
  { word: 'آب', meaning: 'water', audio: 'audio/ab.mp3', letters: ['آ', 'ب', 'م', 'ن', 'س'] },
  { word: 'بابا', meaning: 'dad', audio: 'audio/baba.mp3', letters: ['ب', 'ا', 'م', 'ن', 'س'] },
  { word: 'مامان', meaning: 'mom', audio: 'audio/maman.mp3', letters: ['م', 'ا', 'ن', 'ب', 'س'] },
  { word: 'نان', meaning: 'bread', audio: 'audio/nan.mp3', letters: ['ن', 'ا', 'ب', 'م', 'ی'] },
  { word: 'سیب', meaning: 'apple', audio: 'audio/sib.mp3', letters: ['س', 'ی', 'ب', 'ن', 'م'] }
];
const $ = id => document.getElementById(id);
let current = 0, answer = [], selected = -1, solved = false, playback = 0;
const bank = $('letter-bank'), area = $('answer-area');
function tile(letter, index = null) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'letter'; button.textContent = letter;
  button.setAttribute('aria-label', index === null ? `Add ${letter}` : `${letter}, position ${index + 1} from the right`);
  button.addEventListener('click', () => {
    if (solved) return;
    if (index === null) insert(letter, answer.length);
    else { selected = selected === index ? -1 : index; renderAnswer(); }
  });
  button.addEventListener('pointerdown', event => beginDrag(event, letter, index));
  return button;
}
function renderAnswer() {
  area.replaceChildren();
  if (!answer.length) {
    const hint = document.createElement('span'); hint.className = 'empty-hint'; hint.lang = 'en'; hint.dir = 'ltr'; hint.textContent = 'Drop your letters here'; area.append(hint);
  }
  answer.forEach((letter, i) => { const button = tile(letter, i); button.disabled = solved; button.classList.toggle('selected', selected === i); button.setAttribute('aria-pressed', String(selected === i)); area.append(button); });
  const preview = $('joined-preview');
  preview.textContent = answer.join('');
  preview.setAttribute('aria-label', answer.length ? `Connected Persian writing: ${answer.join('')}` : 'Connected Persian writing preview');
  $('joined-hint').textContent = answer.length ? 'Notice how the letters change shape and connect as you add them.' : 'Your letters will connect here as you build the word.';
  $('edit-tools').hidden = selected < 0 || solved;
  $('move-right').disabled = selected <= 0;
  $('move-left').disabled = selected >= answer.length - 1;
  $('check').disabled = !answer.length;
}
function changed() { $('feedback').textContent = ''; $('feedback').className = 'feedback'; }
function insert(letter, position) {
  if (answer.length >= 8) { $('feedback').textContent = 'Your word is getting long! Remove a letter to make room.'; return; }
  answer.splice(position, 0, letter); selected = -1; changed(); renderAnswer();
}
function move(offset) { if (selected < 0 || solved) return; const to = selected + offset; if (to < 0 || to >= answer.length) return; [answer[selected], answer[to]] = [answer[to], answer[selected]]; selected = to; changed(); renderAnswer(); }
$('move-right').onclick = () => move(-1);
$('move-left').onclick = () => move(1);
$('remove').onclick = () => { if (selected < 0 || solved) return; answer.splice(selected, 1); selected = -1; changed(); renderAnswer(); };
function beginDrag(event, letter, index) {
  if (solved || event.button !== 0) return;
  const source = event.currentTarget, x = event.clientX, y = event.clientY;
  let ghost = null;
  source.setPointerCapture(event.pointerId);
  function moving(e) {
    if (!ghost && Math.hypot(e.clientX - x, e.clientY - y) > 8) { ghost = source.cloneNode(true); ghost.classList.add('drag-ghost'); ghost.removeAttribute('id'); document.body.append(ghost); }
    if (!ghost) return;
    ghost.style.left = `${e.clientX}px`; ghost.style.top = `${e.clientY}px`;
    const bounds = area.getBoundingClientRect(); area.classList.toggle('drag-over', e.clientX >= bounds.left && e.clientX <= bounds.right && e.clientY >= bounds.top && e.clientY <= bounds.bottom);
  }
  function end(e) {
    source.removeEventListener('pointermove', moving); source.removeEventListener('pointerup', end); source.removeEventListener('pointercancel', end);
    if (!ghost) return;
    source.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); }, { once: true, capture: true });
    const bounds = area.getBoundingClientRect();
    if (e.type !== 'pointercancel' && e.clientX >= bounds.left && e.clientX <= bounds.right && e.clientY >= bounds.top && e.clientY <= bounds.bottom) {
      const tiles = [...area.querySelectorAll('.letter')];
      let position = tiles.filter(t => e.clientY > t.getBoundingClientRect().bottom || (e.clientY >= t.getBoundingClientRect().top && e.clientX < t.getBoundingClientRect().left + t.offsetWidth / 2)).length;
      if (index !== null) { answer.splice(index, 1); if (position > index) position--; }
      insert(letter, position);
    } else if (e.type !== 'pointercancel' && index !== null) { answer.splice(index, 1); selected = -1; changed(); renderAnswer(); }
    ghost.remove(); area.classList.remove('drag-over');
  }
  source.addEventListener('pointermove', moving); source.addEventListener('pointerup', end); source.addEventListener('pointercancel', end);
}
// Speak Persian without requiring uploaded recordings or API secrets.
// On devices without a Persian voice, explain that audio is unavailable rather
// than allowing an English voice to mispronounce the Persian text.
function persianVoice() {
  if (!('speechSynthesis' in window)) return null;
  return speechSynthesis.getVoices().find(v => /^fa(?:-|_|$)/i.test(v.lang)) || null;
}
let pendingVoiceTimer = null;
function clearPendingVoice() {
  if (pendingVoiceTimer !== null) { clearTimeout(pendingVoiceTimer); pendingVoiceTimer = null; }
}
function voiceUnavailable() {
  $('audio-status').textContent = 'A Persian voice is not available on this device yet. Enable a Persian speech voice in your device settings to hear the word.';
}
function sayWord(ticket, retry = true) {
  if (ticket !== playback) return;
  const voice = persianVoice();
  if (!voice) {
    if (retry) {
      // Some browsers load their voice list asynchronously.
      speechSynthesis.getVoices();
      clearPendingVoice();
      pendingVoiceTimer = setTimeout(() => sayWord(ticket, false), 850);
    } else voiceUnavailable();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(words[current].word);
  utterance.voice = voice;
  utterance.lang = 'fa-IR';
  utterance.rate = 0.82;
  utterance.onend = () => { if (ticket === playback) $('audio-status').textContent = 'Ready? Build the word below.'; };
  utterance.onerror = () => { if (ticket === playback) $('audio-status').textContent = 'Audio could not play. Please try again.'; };
  speechSynthesis.speak(utterance);
}
function hear() {
  const ticket = ++playback;
  clearPendingVoice();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  $('audio-status').textContent = 'Preparing Persian pronunciation…';
  if ('speechSynthesis' in window) sayWord(ticket);
  else voiceUnavailable();
}
$('listen').onclick = hear; $('hear-again').onclick = hear;
$('check').onclick = () => {
  if (answer.join('') === words[current].word) {
    solved = true; selected = -1; $('feedback').className = 'feedback'; $('feedback').textContent = 'You built it! Nicely done. ✨';
    $('check').hidden = true; $('next').hidden = false; $('next').innerHTML = current === words.length - 1 ? 'All done! Play again ↻' : 'Next word →';
    bank.querySelectorAll('button').forEach(b => b.disabled = true); renderAnswer();
  } else { $('feedback').className = 'feedback retry'; $('feedback').textContent = 'Not quite yet. Listen again and give it another try.'; }
};
function load() {
  playback++; clearPendingVoice(); if ('speechSynthesis' in window) speechSynthesis.cancel();
  answer = []; selected = -1; solved = false; changed(); bank.replaceChildren();
  const letters = [...words[current].letters];
  for (let i = letters.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [letters[i], letters[j]] = [letters[j], letters[i]]; }
  letters.forEach(l => bank.append(tile(l))); renderAnswer();
  $('progress').textContent = `Word ${current + 1} of ${words.length}`; $('progress-fill').style.width = `${(current + 1) / words.length * 100}%`;
  $('audio-status').textContent = 'Tap to listen to your word.'; $('check').hidden = false; $('next').hidden = true;
}
$('next').onclick = () => { current = (current + 1) % words.length; load(); $('listen').focus(); };
load();
