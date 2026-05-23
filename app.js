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
  if (category) url += `&category=eq.${category}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
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

// --- LOAD HERO (first article) ---
async function loadHero() {
  const data = await fetchArticles(0, 1, currentCat);
  if (!data || data.length === 0) return;
  const a = data[0];
  const heroBg = document.getElementById('heroBg');
  const heroContent = document.getElementById('heroContent');
  if (heroBg && a.image_url) {
    heroBg.style.backgroundImage = `url('${a.image_url}')`;
  }
  if (heroContent) {
    heroContent.innerHTML = `
      ${badge(a.category)}
      <h1 class="hero-title">
        <a href="article.html?id=${a.id}">${a.title}</a>
      </h1>
      <p class="hero-excerpt">${a.excerpt || ''}</p>
      <div class="hero-meta">
        <span>${a.author || 'ORIZEEN Staff'}</span>
        <span>${fmtDate(a.created_at)}</span>
      </div>
    `;
  }
}

// --- LOAD TICKER ---
async function loadTicker() {
  const data = await fetchArticles(0, 6, null);
  const track = document.getElementById('tickerTrack');
  if (!track || !data) return;
  const items = data.map(a =>
    `<span class="ticker-item"><a href="article.html?id=${a.id}">${a.title}</a></span>`
  ).join('');
  track.innerHTML = items + items; // duplicate for seamless loop
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
          <span>${fmtDate(a.created_at)}</span>
        </div>
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
    if (totalLoaded === 0) {
      grid.innerHTML = '<p class="no-articles">No articles found.</p>';
    }
    if (btn) btn.style.display = 'none';
    return;
  }

  // Skip first article (used as hero) only on first load with no filter
  const articles = (currentPage === 0 && !currentCat) ? data.slice(1) : data;
  grid.innerHTML += articles.map(renderCard).join('');
  totalLoaded += articles.length;
  currentPage++;

  if (btn) {
    btn.style.display = data.length < PAGE_SIZE ? 'none' : 'block';
  }
}

// --- CATEGORY FILTER ---
document.querySelectorAll('[data-cat]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    currentCat = link.dataset.cat;
    document.getElementById('sectionTitle').textContent = currentCat;
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
