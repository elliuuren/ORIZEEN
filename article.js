// ==============================
// ORIZEEN TIMES — ARTICLE PAGE
// ==============================

const dateEl = document.getElementById('liveDate');
if (dateEl) {
  dateEl.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}
const fyEl = document.getElementById('footerYear');
if (fyEl) fyEl.textContent = new Date().getFullYear();

function badge(cat) {
  return `<span class="category-badge ${cat.toLowerCase()}">${cat}</span>`;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

async function loadArticle() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    window.location.href = 'index.html';
    return;
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?id=eq.${id}&select=*`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );
  const data = await res.json();
  if (!data || data.length === 0) {
    document.getElementById('postArticle').innerHTML =
      '<p style="padding:4rem;text-align:center">Article not found.</p>';
    return;
  }

  const a = data[0];
  document.title = `${a.title} — ORIZEEN Times`;

  // Convert double line breaks to paragraphs
  const bodyHtml = a.content
    .split(/\n\n+/)
    .map(p => `<p>${p.trim()}</p>`)
    .join('');

  document.getElementById('postArticle').innerHTML = `
    <div class="post-body-wrap">
      ${a.image_url ? `
      <div class="post-hero">
        <img src="${a.image_url}" alt="${a.title}"/>
      </div>` : ''}
      <div class="post-header">
        ${badge(a.category)}
        <h1 class="post-title">${a.title}</h1>
        <div class="post-meta">
          <span>By ${a.author || 'ORIZEEN Staff'}</span>
          ${a.location ? `<span>📍 ${a.location}</span>` : ''}
          <span>${a.news_date ? fmtDate(a.news_date) : fmtDate(a.created_at)}</span>
        </div>
        <div class="post-divider"></div>
      </div>
      <div class="post-body">${bodyHtml}</div>
      <a href="index.html" class="back-link">← Back to Homepage</a>
    </div>
  `;
}

loadArticle();
