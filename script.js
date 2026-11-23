const posts = [...document.querySelectorAll('.post-card')];
const searchInput = document.getElementById('post-search');
const chips = [...document.querySelectorAll('.filter-chip')];
const emptyState = document.getElementById('empty-state');
let activeCategory = 'all';

function filterPosts() {
  const query = searchInput.value.trim().toLocaleLowerCase('vi');
  let visible = 0;
  posts.forEach((post) => {
    const matchesCategory = activeCategory === 'all' || post.dataset.category === activeCategory;
    const matchesQuery = !query || `${post.dataset.search} ${post.textContent}`.toLocaleLowerCase('vi').includes(query);
    const show = matchesCategory && matchesQuery;
    post.hidden = !show;
    if (show) visible += 1;
  });
  emptyState.hidden = visible !== 0;
}

chips.forEach((chip) => chip.addEventListener('click', () => {
  activeCategory = chip.dataset.category;
  chips.forEach((item) => {
    const selected = item === chip;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
  filterPosts();
}));
searchInput.addEventListener('input', filterPosts);

const themeButton = document.getElementById('theme-toggle');
const themeIcon = themeButton.querySelector('span');
const storedTheme = localStorage.getItem('sunday-edit-theme');
if (storedTheme === 'dark') document.body.classList.add('dark');
function updateThemeButton() {
  const dark = document.body.classList.contains('dark');
  themeIcon.textContent = dark ? '☀' : '☾';
  themeButton.setAttribute('aria-label', dark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối');
  document.querySelector('meta[name="theme-color"]').content = dark ? '#1e211e' : '#f7f5f0';
}
updateThemeButton();
themeButton.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('sunday-edit-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  updateThemeButton();
});

const menuButton = document.getElementById('menu-toggle');
const nav = document.querySelector('.main-nav');
menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
});
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Mở menu');
}));

document.getElementById('newsletter-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.getElementById('email');
  const message = document.getElementById('form-message');
  if (!email.checkValidity()) {
    email.reportValidity();
    return;
  }
  message.textContent = 'Cảm ơn bạn đã đăng ký! Hẹn gặp trong lá thư Chủ Nhật tiếp theo.';
  message.classList.add('success-message');
  email.value = '';
});
