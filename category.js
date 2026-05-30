// ==============================
// ORIZEEN TIMES — CATEGORY PAGE
// ==============================

let currentPage = 0;
let totalLoaded = 0;
const PAGE_SIZE_CAT = 12;

// Get category from URL
const params = new URLSearchParams(window.location.search);
const cat = params.get('cat') || 'BREAKING';

// Set page title
const titleEl = document.getElementById('sectionTitle');
if (titleEl) titleEl.textContent = cat === 'ORIZEENALS' ? 'Orizeenals' : cat;
document.title = `${cat} — ORIZEEN Times`;

// Live date
const dateEl = document.getElementById('liveDate');
if (dateEl) {
  dateEl.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}
const fyEl = document.getElementById('footerYear');
if (fyEl) fyEl.textContent = new Date().getFullYear();

function badge(c) {
  return `<span class="category-badge ${c.toLowerCase()}">${c}</span>`;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

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

async function loadArticles(reset = false) {
  if (reset) {
    currentPage = 0;
    totalLoaded = 0;
    document.getElementById('articlesGrid').innerHTML = '';
  }

  const from = currentPage * PAGE_SIZE_CAT;
  const url = `${SUPABASE_URL}/rest/v1/articles?select=*&published=eq.true&category=eq.${encodeURIComponent(cat)}&order=created_at.desc&offset=${from}&limit=${PAGE_SIZE_CAT}`;

  const res = await fetch(url, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const data = await res.json();

  const grid = document.getElementById('articlesGrid');
  const btn = document.getElementById('loadMoreBtn');

  if (!data || data.length === 0) {
    if (totalLoaded === 0) {
      grid.innerHTML = '<p class="no-articles">No articles found in this category.</p>';
    }
    if (btn) btn.style.display = 'none';
    return;
  }

  grid.innerHTML += data.map(renderCard).join('');
  totalLoaded += data.length;
  currentPage++;
  if (btn) btn.style.display = data.length < PAGE_SIZE_CAT ? 'none' : 'block';
}

// Load more button
const loadBtn = document.getElementById('loadMoreBtn');
if (loadBtn) loadBtn.addEventListener('click', () => loadArticles(false));

// Ticker
async function loadTicker() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?select=id,title&published=eq.true&category=eq.BREAKING&order=created_at.desc&limit=6`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  const data = await res.json();
  const track = document.getElementById('tickerTrack');
  if (!track || !data) return;
  const items = data.map(a =>
    `<span class="ticker-item"><a href="article.html?id=${a.id}">${a.title}</a></span>`
  ).join('');
  track.innerHTML = items + items;
}

loadTicker();
loadArticles(true);
