// ==============================
// ORIZEEN TIMES — MAIN APP
// ==============================

let currentPage = 0;
let currentCat = null;
let totalLoaded = 0;

// --- LIVE DATE ---
const dateEl = document.getElementById('liveDate');
if (dateEl) {
  dateEl.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}
const fyEl = document.getElementById('footerYear');
if (fyEl) fyEl.textContent = new Date().getFullYear();

// --- FETCH HELPER ---
async function fetchArticles(from, to, category = null) {
  let url = `${SUPABASE_URL}/rest/v1/articles?select=*&published=eq.true&order=created_at.desc&offset=${from}&limit=${PAGE_SIZE}`;
  if (category) url += `&category=eq.${encodeURIComponent(category)}`;
  const res = await fetch(url, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  return res.json();
}

// --- CATEGORY BADGE HTML ---
function badge(cat) {
  return `<span class="category-badge ${cat.toLowerCase()}">${cat}</span>`;
}

// --- FORMAT DATE ---
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

// --- LOAD FEATURED PHOTOCARD ---
// Tries featured flag first, falls back to latest BREAKING
async function loadHero() {
  const wrap = document.getElementById('featuredCard');
  if (!wrap) return;

  // Try featured article first
  let res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?select=*&published=eq.true&featured=eq.true&order=created_at.desc&limit=1`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  let data = await res.json();

  // Fallback to latest BREAKING
  if (!data || data.length === 0) {
    data = await fetchArticles(0, 1, 'BREAKING');
  }

  // Fallback to latest article
  if (!data || data.length === 0) {
    data = await fetchArticles(0, 1, null);
  }

  if (!data || data.length === 0) return;
  const a = data[0];

  wrap.innerHTML = `
    <a href="article.html?id=${a.id}" class="photocard">
      <div class="photocard-img-wrap">
        ${a.image_url
          ? `<img src="${a.image_url}" alt="${a.title}" loading="lazy"/>`
          : `<div class="photocard-no-img"></div>`}
        ${badge(a.category)}
        ${a.featured ? '<span class="featured-star">★ FEATURED</span>' : ''}
      </div>
      <div class="photocard-body">
        <h2 class="photocard-title">${a.title}</h2>
        <p class="photocard-excerpt">${a.excerpt || ''}</p>
        <div class="photocard-meta">
          <span>${a.author || 'ORIZEEN Staff'}</span>
          ${a.location ? `<span>📍 ${a.location}</span>` : ''}
          <span>${a.news_date ? fmtDate(a.news_date) : fmtDate(a.created_at)}</span>
        </div>
        ${a.source_name ? `
          <div class="photocard-source">
            Source: ${a.source_url
              ? `<a href="${a.source_url}" target="_blank" rel="noopener">${a.source_name}</a>`
              : a.source_name}
          </div>` : ''}
        <span class="photocard-read">Read Story →</span>
      </div>
    </a>
  `;
}

// --- LOAD TICKER ---
async function loadTicker() {
  const data = await fetchArticles(0, 6, 'BREAKING');
  const track = document.getElementById('tickerTrack');
  if (!track || !data) return;
  const items = data.map(a =>
    `<span class="ticker-item"><a href="article.html?id=${a.id}">${a.title}</a></span>`
  ).join('');
  track.innerHTML = items + items;
}

// --- RENDER ARTICLE CARD ---
function renderCard(a) {
  return `
    <article class="article-card">
      <a href="article.html?id=${a.id}" class="card-image">
        ${a.image_url
          ? `<img src="${a.image_url}" alt="${a.title}" loading="lazy"/>`
          : `<div class="card-no-img"></div>`}
        ${badge(a.category)}
      </a>
      <div class="card-body">
        <h3 class="card-title">
          <a href="article.html?id=${a.id}">${a.title}</a>
        </h3>
        <p class="card-excerpt">${a.excerpt || ''}</p>
        <div class="card-meta">
          <span>${a.author || 'ORIZEEN Staff'}</span>
          ${a.location ? `<span>📍 ${a.location}</span>` : ''}
          <span>${a.news_date ? fmtDate(a.news_date) : fmtDate(a.created_at)}</span>
        </div>
        ${a.source_name ? `
          <div class="card-source">
            Source: ${a.source_url
              ? `<a href="${a.source_url}" target="_blank" rel="noopener">${a.source_name}</a>`
              : a.source_name}
          </div>` : ''}
      </div>
    </article>
  `;
}

// --- LOAD ARTICLES GRID ---
async function loadArticles(reset = false) {
  if (reset) {
    currentPage = 0;
    totalLoaded = 0;
    document.getElementById('articlesGrid').innerHTML = '';
  }
  const from = currentPage * PAGE_SIZE;
  const data = await fetchArticles(from, from + PAGE_SIZE, currentCat);
  const grid = document.getElementById('articlesGrid');
  const btn = document.getElementById('loadMoreBtn');

  if (!data || data.length === 0) {
    if (totalLoaded === 0) grid.innerHTML = '<p class="no-articles">No articles found.</p>';
    if (btn) btn.style.display = 'none';
    return;
  }

  const articles = (currentPage === 0 && !currentCat) ? data.slice(1) : data;
  grid.innerHTML += articles.map(renderCard).join('');
  totalLoaded += articles.length;
  currentPage++;
  if (btn) btn.style.display = data.length < PAGE_SIZE ? 'none' : 'block';
}

// --- CATEGORY FILTER ---
document.querySelectorAll('[data-cat]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    currentCat = link.dataset.cat;
    const label = currentCat === 'ORIZEENALS' ? 'Orizeenals' : currentCat;
    document.getElementById('sectionTitle').textContent = label;
    loadHero();
    loadArticles(true);
  });
});

// --- LOAD MORE BUTTON ---
const loadBtn = document.getElementById('loadMoreBtn');
if (loadBtn) loadBtn.addEventListener('click', () => loadArticles(false));

// --- INIT ---
loadHero();
loadTicker();
loadArticles(true);

// --- DATE PANEL ---
const dayEl = document.getElementById('datePanelDay');
const fullEl = document.getElementById('datePanelFull');
if (dayEl && fullEl) {
  const now = new Date();
  dayEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long' });
  fullEl.textContent = now.toLocaleDateString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}
