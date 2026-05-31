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
    <article class="article-card" data-category="${a.category}">
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

  const articles = data;
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

// --- MULTI-CALENDAR DATE PANEL ---
function initDatePanel() {
  const now = new Date();

  // 1 — Gregorian (CE)
  const gregorian = now.toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // 2 — Bangla/Bengali (বঙ্গাব্দ) — shown in Bangla script
  function toBengaliDate(date) {
    const bengaliMonths = [
      'বৈশাখ','জ্যৈষ্ঠ','আষাঢ়','শ্রাবণ',
      'ভাদ্র','আশ্বিন','কার্তিক','অগ্রহায়ণ',
      'পৌষ','মাঘ','ফাল্গুন','চৈত্র'
    ];
    const bengaliDays = ['রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার'];
    const bengaliNumerals = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];

    function toBengaliNumeral(n) {
      return String(n).split('').map(d => bengaliNumerals[parseInt(d)] || d).join('');
    }

    // Bangla calendar starts ~14 April
    // Month boundaries (Gregorian day of year when each Bangla month starts)
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    const day = date.getDate();

    // Simplified but accurate Bangla date conversion
    const monthDays = [
      [4, 14], [5, 15], [6, 16], [7, 17], [8, 17],
      [9, 17], [10, 18], [11, 18], [12, 18], [1, 14],
      [2, 13], [3, 14]
    ];

    let banglaMonth, banglaDay, banglaYear;

    // Find which Bangla month we're in
    let bMonth = -1;
    for (let i = 0; i < 12; i++) {
      const [gMonth, gDay] = monthDays[i];
      const nextIdx = (i + 1) % 12;
      const [ngMonth, ngDay] = monthDays[nextIdx];

      const startDate = new Date(year, gMonth - 1, gDay);
      let endYear = year;
      if (ngMonth < gMonth) endYear = year + 1;
      const endDate = new Date(endYear, ngMonth - 1, ngDay - 1);

      if (date >= startDate && date <= endDate) {
        bMonth = i;
        banglaDay = Math.floor((date - startDate) / (1000 * 60 * 60 * 24)) + 1;
        break;
      }
    }

    if (bMonth === -1) { bMonth = 0; banglaDay = 1; }

    // Bangla year = Gregorian year - 593 (adjusted for months before Boishakh)
    banglaYear = (month < 3 || (month === 3 && day < 14)) ? year - 594 : year - 593;

    const dayName = bengaliDays[date.getDay()];
    return `${dayName}, ${toBengaliNumeral(banglaDay)} ${bengaliMonths[bMonth]} ${toBengaliNumeral(banglaYear)} বঙ্গাব্দ`;
  }

  // 3 — Hijri (Islamic calendar)
  function toHijriDate(date) {
    const hijriMonths = [
      'Muharram','Safar','Rabi al-Awwal','Rabi al-Thani',
      'Jumada al-Awwal','Jumada al-Thani','Rajab','Sha\'ban',
      'Ramadan','Shawwal','Dhu al-Qi\'dah','Dhu al-Hijjah'
    ];
    const hijriDays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    // Use Intl API for accurate Hijri conversion
    try {
      const hijriFormatter = new Intl.DateTimeFormat('en-u-ca-islamic', {
        day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'
      });
      const parts = hijriFormatter.formatToParts(date);
      const h = {};
      parts.forEach(p => h[p.type] = p.value);

      // Map month name to our list index for clean naming
      const monthMap = {
        'Muharram': 'Muharram', 'Safar': 'Safar',
        "Rabīʿ al-Awwal": 'Rabi al-Awwal', "Rabīʿ al-Ākhir": 'Rabi al-Thani',
        "Jumādā al-Awwal": 'Jumada al-Awwal', "Jumādā al-Ākhir": 'Jumada al-Thani',
        'Rajab': 'Rajab', "Shaʿbān": "Sha'ban",
        'Ramaḍān': 'Ramadan', 'Shawwāl': 'Shawwal',
        "Ḏū al-Qaʿda": "Dhu al-Qi'dah", "Ḏū al-Ḥijja": 'Dhu al-Hijjah'
      };

      const cleanMonth = monthMap[h.month] || h.month;
      return `${h.weekday}, ${h.day} ${cleanMonth} ${h.year} AH`;
    } catch(e) {
      return 'Hijri date unavailable';
    }
  }

  // Set values
  const gregorianEl = document.getElementById('dateGregorian');
  const bengaliEl = document.getElementById('dateBengali');
  const hijriEl = document.getElementById('dateHijri');

  if (gregorianEl) gregorianEl.textContent = `📅 ${gregorian} CE`;
  if (bengaliEl) bengaliEl.textContent = `🌸 ${toBengaliDate(now)}`;
  if (hijriEl) hijriEl.textContent = `☪️ ${toHijriDate(now)}`;

  // Auto-rotate every 4 seconds
  const items = document.querySelectorAll('.date-rotate-item');
  if (items.length === 0) return;
  let current = 0;
  setInterval(() => {
    items[current].classList.remove('active');
    current = (current + 1) % items.length;
    items[current].classList.add('active');
  }, 4000);
}

initDatePanel();
