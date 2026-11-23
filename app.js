const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const STORE_KEY = 'wordnest-progress-v1';
const loadState = () => {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
};
let state = { mastered: {}, review: {}, saved: {}, xp: 0, streak: 0, lastStudy: '', todayCount: 0, countDate: '', ...(loadState()) };
let activeSet = 'toeic';
let activeMode = 'flashcard';
let currentIndex = 0;
let page = 1;
let activeLetter = 'all';
let onlyReview = false;
let quizCurrent = null;
let quizAnswered = false;
let quizCorrect = 0;
let toastTimer;
const PAGE_SIZE = 50;
const sets = window.WORD_SETS;
const dateKey = () => new Date().toLocaleDateString('en-CA');
const words = () => sets[activeSet] || [];
const keyFor = (word) => `${activeSet}:${word.word.toLocaleLowerCase()}`;
const persist = () => localStorage.setItem(STORE_KEY, JSON.stringify(state));
function showToast(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}
function filteredWords() {
  const query = $('#search-input').value.trim().toLocaleLowerCase('vi');
  return words().filter((word) => {
    const key = keyFor(word);
    const letterMatch = activeLetter === 'all' || word.word.toLocaleLowerCase().startsWith(activeLetter);
    const searchMatch = !query || `${word.word} ${word.meaning} ${word.type || ''} ${word.ipa || ''}`.toLocaleLowerCase('vi').includes(query);
    const reviewMatch = !onlyReview || state.review[key];
    return letterMatch && searchMatch && reviewMatch;
  });
}
function updateStats() {
  const today = dateKey();
  if (state.countDate !== today) { state.countDate = today; state.todayCount = 0; }
  $('#xp-count').textContent = state.xp || 0;
  $('#mastered-count').textContent = Object.keys(state.mastered).length;
  $('#review-count').textContent = Object.keys(state.review).length;
  $('#streak-count').textContent = state.streak || 0;
  $('#streak-stat').textContent = state.streak || 0;
  $('#today-learned').textContent = state.todayCount || 0;
  const progress = Math.min(100, Math.round((state.todayCount || 0) * 10));
  $('#goal-percent').textContent = `${progress}%`;
  $('#goal-ring').style.background = `conic-gradient(var(--green) ${progress}%,var(--line) ${progress}%)`;
  $('#mission-progress').textContent = `${Math.min(10, state.todayCount || 0)} / 10 từ`;
  $('#mission-meter-fill').style.width = `${progress}%`;
  $('#mission-check').classList.toggle('done', progress >= 100);
  $('#ielts-total').textContent = sets.ielts.length;
  $('#basic-total').textContent = sets.basic.length;
  persist();
}
function currentWord() { return words()[currentIndex % words().length]; }
function renderFlashcard() {
  const word = currentWord(); if (!word) return;
  const card = $('#flashcard'); card.classList.remove('flipped');
  $('#word-text').textContent = word.word;
  $('#word-type').textContent = `${word.type || 'CỤM TỪ'}${word.ipa ? `  ·  ${word.ipa}` : ''}`.toLocaleUpperCase();
  $('#meaning-text').textContent = word.meaning;
  $('#example-text').textContent = word.example || (activeSet === 'toeic' ? `Say it aloud: “${word.word}.”` : `Gợi ý: hãy thử đặt “${word.word}” vào một câu của riêng bạn.`);
  $('#card-position').textContent = `${currentIndex + 1} / ${words().length}`;
  $('#card-progress-fill').style.width = `${((currentIndex + 1) / words().length) * 100}%`;
}
function flipCard() { $('#flashcard').classList.toggle('flipped'); }
function markWord(rating) {
  const word = currentWord(); if (!word) return;
  const key = keyFor(word);
  if (rating === 'known') {
    state.mastered[key] = true; delete state.review[key]; state.xp += 10; incrementStudy(); showToast('Tuyệt vời! +10 XP — từ này đã được ghi nhận 🌱');
  } else if (rating === 'almost') {
    delete state.mastered[key]; state.review[key] = true; state.xp += 3; incrementStudy(); showToast('Đang tiến bộ! Mình sẽ đưa từ này vào ôn tập 💚');
  } else {
    delete state.mastered[key]; state.review[key] = true; showToast('Không sao — gặp lại từ này trong lượt ôn tiếp theo nhé.');
  }
  currentIndex = (currentIndex + 1) % words().length; updateStats(); renderFlashcard(); renderList();
}
function incrementStudy() {
  const today = dateKey();
  if (state.countDate !== today) { state.countDate = today; state.todayCount = 0; }
  state.todayCount++;
  if (state.lastStudy !== today) {
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
    state.streak = state.lastStudy === yesterday ? (state.streak || 0) + 1 : 1;
    state.lastStudy = today;
  }
}
function speak(text) {
  if (!('speechSynthesis' in window)) { showToast('Trình duyệt này chưa hỗ trợ phát âm.'); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = $('#voice-select').value; utterance.rate = .88;
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((voice) => voice.lang === utterance.lang) || voices.find((voice) => voice.lang.startsWith(utterance.lang));
  if (match) utterance.voice = match;
  window.speechSynthesis.speak(utterance);
}
function renderLetters() {
  const container = $('#letter-filter');
  container.innerHTML = `<button type="button" class="${activeLetter === 'all' ? 'active' : ''}" data-letter="all">Tất cả</button>` + 'abcdefghijklmnopqrstuvwxyz'.split('').map((letter) => `<button type="button" class="${activeLetter === letter ? 'active' : ''}" data-letter="${letter}">${letter.toUpperCase()}</button>`).join('');
}
function renderList() {
  const results = filteredWords(); const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  page = Math.min(page, totalPages); const start = (page - 1) * PAGE_SIZE;
  $('#result-count').textContent = `${results.length} từ vựng${onlyReview ? ' cần ôn' : ''}`;
  $('#page-number').textContent = page; $('#page-label').textContent = `${page} / ${totalPages}`;
  $('#prev-page').disabled = page <= 1; $('#next-page').disabled = page >= totalPages;
  const slice = results.slice(start, start + PAGE_SIZE);
  $('#vocab-list').innerHTML = slice.length ? slice.map((word) => {
    const key = keyFor(word); const learned = Boolean(state.mastered[key]); const saved = Boolean(state.saved[key]);
    return `<div class="vocab-row"><span class="vocab-word">${escapeHtml(word.word)}</span><span class="vocab-type">${escapeHtml(word.type || '')}${word.ipa ? ` · ${escapeHtml(word.ipa)}` : ''}</span><span class="vocab-meaning">${escapeHtml(word.meaning)}</span><button class="row-action ${saved ? 'saved' : ''}" data-action="save" data-word="${escapeHtml(word.word)}" title="${saved ? 'Bỏ yêu thích' : 'Lưu từ'}" aria-label="${saved ? 'Bỏ yêu thích' : 'Lưu từ'}">${saved ? '★' : '☆'}</button><button class="row-action" data-action="speak" data-word="${escapeHtml(word.word)}" title="Phát âm" aria-label="Phát âm">🔊</button></div>`;
  }).join('') : '<div class="empty-list">Không tìm thấy từ phù hợp. Hãy đổi từ khóa hoặc bộ lọc nhé.</div>';
}
function escapeHtml(text) { return String(text).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
function nextQuiz() {
  const pool = words(); if (pool.length < 2) return;
  quizAnswered = false; $('#quiz-feedback').textContent = ''; $('#quiz-next').disabled = true;
  quizCurrent = pool[Math.floor(Math.random() * pool.length)];
  $('#quiz-word').textContent = quizCurrent.word; $('#quiz-score').textContent = `${quizCorrect} câu đúng`;
  const distractors = pool.filter((word) => word !== quizCurrent).sort(() => Math.random() - .5).slice(0, 3);
  const choices = [...distractors, quizCurrent].sort(() => Math.random() - .5);
  $('#quiz-options').innerHTML = choices.map((word) => `<button class="quiz-option" type="button" data-correct="${word === quizCurrent}">${escapeHtml(word.meaning)}</button>`).join('');
}
function switchMode(mode) {
  activeMode = mode; $$('.mode-button').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
  $('#flashcard-view').hidden = mode !== 'flashcard'; $('#quiz-view').hidden = mode !== 'quiz';
  if (mode === 'quiz') nextQuiz();
}
function switchSet(set) {
  activeSet = set; currentIndex = 0; page = 1; activeLetter = 'all'; onlyReview = false;
  $$('.tab').forEach((tab) => { const selected = tab.dataset.set === set; tab.classList.toggle('active', selected); tab.setAttribute('aria-selected', String(selected)); });
  $('#search-input').value = ''; renderLetters(); renderFlashcard(); renderList(); if (activeMode === 'quiz') nextQuiz();
}

$('#flashcard').addEventListener('click', flipCard);
$('#flashcard').addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); flipCard(); } });
$$('.know-button').forEach((button) => button.addEventListener('click', () => markWord(button.dataset.rating)));
$('#speak-button').addEventListener('click', (event) => { event.stopPropagation(); speak(currentWord().word); });
$('#quiz-speak').addEventListener('click', () => quizCurrent && speak(quizCurrent.word));
$('#shuffle-button').addEventListener('click', () => { currentIndex = Math.floor(Math.random() * words().length); renderFlashcard(); showToast('Đã xáo trộn — bắt đầu nào!'); });
$$('.tab').forEach((tab) => tab.addEventListener('click', () => switchSet(tab.dataset.set)));
$$('.mode-button').forEach((button) => button.addEventListener('click', () => switchMode(button.dataset.mode)));
$('#quiz-options').addEventListener('click', (event) => {
  const button = event.target.closest('.quiz-option'); if (!button || quizAnswered) return;
  quizAnswered = true; const correct = button.dataset.correct === 'true';
  $$('.quiz-option').forEach((option) => { option.disabled = true; if (option.dataset.correct === 'true') option.classList.add('correct'); });
  if (correct) { quizCorrect++; state.xp += 5; incrementStudy(); delete state.review[keyFor(quizCurrent)]; $('#quiz-feedback').textContent = 'Chính xác! Bạn đang làm rất tốt ✨ +5 XP'; }
  else { state.review[keyFor(quizCurrent)] = true; $('#quiz-feedback').textContent = `Chưa đúng lần này — đáp án là: ${quizCurrent.meaning}. Cứ tiếp tục nhé!`; button.classList.add('wrong'); }
  updateStats(); renderList(); $('#quiz-score').textContent = `${quizCorrect} câu đúng`; $('#quiz-next').disabled = false;
});
$('#quiz-next').addEventListener('click', nextQuiz);
$('#search-input').addEventListener('input', () => { page = 1; renderList(); });
$('#letter-filter').addEventListener('click', (event) => { const button = event.target.closest('[data-letter]'); if (!button) return; activeLetter = button.dataset.letter; page = 1; renderLetters(); renderList(); });
$('#prev-page').addEventListener('click', () => { page = Math.max(1, page - 1); renderList(); });
$('#next-page').addEventListener('click', () => { page++; renderList(); });
$('#review-filter').addEventListener('click', () => { onlyReview = !onlyReview; $('#review-filter').classList.toggle('filter-active', onlyReview); page = 1; renderList(); showToast(onlyReview ? 'Đang xem các từ cần ôn.' : 'Đang xem toàn bộ bộ từ.'); });
$('#vocab-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]'); if (!button) return;
  const word = words().find((item) => item.word === button.dataset.word); if (!word) return;
  if (button.dataset.action === 'speak') speak(word.word);
  if (button.dataset.action === 'save') { const key = keyFor(word); if (state.saved[key]) { delete state.saved[key]; showToast('Đã bỏ từ khỏi mục yêu thích.'); } else { state.saved[key] = true; showToast('Đã lưu vào từ yêu thích ⭐'); } persist(); renderList(); }
});
$('#theme-toggle').addEventListener('click', () => { document.body.classList.toggle('dark'); const theme = document.body.classList.contains('dark') ? 'dark' : 'light'; localStorage.setItem('wordnest-theme', theme); $('#theme-toggle').textContent = theme === 'dark' ? '☀' : '☾'; });
if (localStorage.getItem('wordnest-theme') === 'dark') { document.body.classList.add('dark'); $('#theme-toggle').textContent = '☀'; }
$$('.nav-link').forEach((link) => link.addEventListener('click', () => { $$('.nav-link').forEach((item) => item.classList.toggle('active', item === link)); }));
$('#reset-progress').addEventListener('click', () => { if (!window.confirm('Bạn muốn xóa toàn bộ XP, streak và từ đã đánh dấu?')) return; localStorage.removeItem(STORE_KEY); state = {mastered:{},review:{},saved:{},xp:0,streak:0,lastStudy:'',todayCount:0,countDate:''}; quizCorrect = 0; updateStats(); renderFlashcard(); renderList(); showToast('Đã đặt lại tiến độ học.'); });
document.addEventListener('keydown', (event) => { if (event.code === 'Space' && !['INPUT','TEXTAREA','SELECT','BUTTON'].includes(document.activeElement.tagName) && activeMode === 'flashcard') { event.preventDefault(); flipCard(); } if (event.key === '/' && document.activeElement.tagName !== 'INPUT') { event.preventDefault(); $('#search-input').focus(); } });
$$('.nav-link[data-view="study"],.nav-link[data-view="library"]').forEach((link) => link.addEventListener('click', () => { document.querySelector(link.getAttribute('href'))?.scrollIntoView({behavior:'smooth'}); }));
renderLetters(); updateStats(); renderFlashcard(); renderList();
