// ==============================
// ORIZEEN TIMES — ADMIN PANEL
// ==============================

function checkLogin() {
  const pass = document.getElementById('adminPass').value;
  const err = document.getElementById('loginError');
  if (pass === ADMIN_PASSWORD) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    loadAdminList();
  } else {
    err.textContent = 'Incorrect password. Try again.';
  }
}

document.getElementById('adminPass').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkLogin();
});

function logout() {
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminPass').value = '';
}

function msg(text, color = 'green') {
  const el = document.getElementById('formMsg');
  el.textContent = text;
  el.style.color = color === 'green' ? '#1DB954' : '#C0392B';
  setTimeout(() => el.textContent = '', 4000);
}

function resetForm() {
  document.getElementById('editId').value = '';
  document.getElementById('fTitle').value = '';
  document.getElementById('fCategory').value = 'BREAKING';
  document.getElementById('fAuthor').value = '';
  document.getElementById('fImage').value = '';
  document.getElementById('fExcerpt').value = '';
  document.getElementById('fContent').value = '';
  document.getElementById('fDate').value = '';
  document.getElementById('fLocation').value = '';
  document.getElementById('fSourceName').value = '';
  document.getElementById('fSourceUrl').value = '';
  document.getElementById('fFeatured').checked = false;
  document.getElementById('formTitle').textContent = 'Publish New Article';
  document.getElementById('saveLabel').textContent = 'Publish Article';
  // Reset category badge
  document.getElementById('categoryBadge').textContent = 'BREAKING';
  document.getElementById('categoryBadge').className = 'category-badge breaking';
}

async function saveArticle() {
  const id = document.getElementById('editId').value;
  const title = document.getElementById('fTitle').value.trim();
  const category = document.getElementById('fCategory').value;
  const author = document.getElementById('fAuthor').value.trim();
  const image_url = document.getElementById('fImage').value.trim();
  const excerpt = document.getElementById('fExcerpt').value.trim();
  const content = document.getElementById('fContent').value.trim();
  const news_date = document.getElementById('fDate').value;
  const location = document.getElementById('fLocation').value.trim();
  const source_name = document.getElementById('fSourceName').value.trim();
  const source_url = document.getElementById('fSourceUrl').value.trim();
  const featured = document.getElementById('fFeatured').checked;
  const parent_category = document.getElementById('fParentCategory').value;
const breaking_hours = parseInt(document.getElementById('fBreakingDuration').value);
const breaking_until = category === 'BREAKING'
  ? new Date(Date.now() + breaking_hours * 60 * 60 * 1000).toISOString()
  : null;

  if (!title || !content) {
    msg('Headline and content are required.', 'red');
    return;
  }

  // If marking as featured, unfeature all others first
  if (featured && !id) {
    await fetch(`${SUPABASE_URL}/rest/v1/articles?featured=eq.true`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ featured: false })
    });
  }

  const payload = {
  title, category, author, image_url, excerpt, content,
  news_date, location, source_name, source_url,
  featured, published: true,
  parent_category: category === 'BREAKING' ? parent_category : null,
  breaking_until: category === 'BREAKING' ? breaking_until : null
};
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  let res;
  if (id) {
    res = await fetch(`${SUPABASE_URL}/rest/v1/articles?id=eq.${id}`, {
      method: 'PATCH', headers, body: JSON.stringify(payload)
    });
  } else {
    res = await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
      method: 'POST', headers, body: JSON.stringify(payload)
    });
  }

  if (res.ok) {
    msg(id ? 'Article updated!' : 'Article published!');
    resetForm();
    loadAdminList();

    if (!id) {
      const latest = await fetch(
        `${SUPABASE_URL}/rest/v1/articles?select=id&order=created_at.desc&limit=1`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
      );
      const latestData = await latest.json();
      if (latestData && latestData[0]) {
        await postToBuffer({ id: latestData[0].id, title, excerpt, image_url });
      }
    }
  } else {
    msg('Something went wrong. Check your Supabase credentials.', 'red');
  }
}

async function loadAdminList() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?select=*&order=created_at.desc`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  const data = await res.json();
  const list = document.getElementById('adminList');

  if (!data || data.length === 0) {
    list.innerHTML = '<p style="color:rgba(255,255,255,0.4)">No articles yet.</p>';
    return;
  }

  list.innerHTML = data.map(a => `
    <div class="admin-list-item">
      <div class="admin-list-info">
        <span class="admin-list-cat ${a.category.toLowerCase()}">${a.category}</span>
        ${a.featured ? '<span style="font-size:0.7rem;background:#C9A84C;color:#000;padding:2px 8px;border-radius:999px;font-weight:700">★ FEATURED</span>' : ''}
        <span class="admin-list-title">${a.title}</span>
        ${a.source_name ? `<span style="font-size:0.72rem;color:rgba(29,185,84,0.7)">📰 ${a.source_name}</span>` : ''}
        <span class="admin-list-date">${new Date(a.created_at).toLocaleDateString()}</span>
      </div>
      <div class="admin-list-actions">
        <button class="admin-btn ghost small" onclick="toggleFeatured(${a.id}, ${a.featured})">${a.featured ? 'Unfeature' : 'Feature'}</button>
        <button class="admin-btn ghost small" onclick="editArticle(${a.id})">Edit</button>
        <button class="admin-btn red small" onclick="deleteArticle(${a.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

async function toggleFeatured(id, currentFeatured) {
  // Unfeature all first
  await fetch(`${SUPABASE_URL}/rest/v1/articles?featured=eq.true`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ featured: false })
  });

  // If it wasn't featured, now feature it
  if (!currentFeatured) {
    await fetch(`${SUPABASE_URL}/rest/v1/articles?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ featured: true })
    });
    msg('Article set as featured!');
  } else {
    msg('Article unfeatured.');
  }
  loadAdminList();
}

async function editArticle(id) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?id=eq.${id}&select=*`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  const data = await res.json();
  if (!data || data.length === 0) return;
  const a = data[0];

  document.getElementById('editId').value = a.id;
  document.getElementById('fTitle').value = a.title;
  document.getElementById('fCategory').value = a.category;
  document.getElementById('fAuthor').value = a.author || '';
  document.getElementById('fImage').value = a.image_url || '';
  document.getElementById('fExcerpt').value = a.excerpt || '';
  document.getElementById('fContent').value = a.content;
  document.getElementById('fDate').value = a.news_date || '';
  document.getElementById('fLocation').value = a.location || '';
  document.getElementById('fSourceName').value = a.source_name || '';
  document.getElementById('fSourceUrl').value = a.source_url || '';
  document.getElementById('fFeatured').checked = a.featured || false;

  // Update category badge
  document.getElementById('categoryBadge').textContent = a.category;
  document.getElementById('categoryBadge').className = `category-badge ${a.category.toLowerCase()}`;

  document.getElementById('formTitle').textContent = 'Edit Article';
  document.getElementById('saveLabel').textContent = 'Save Changes';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteArticle(id) {
  if (!confirm('Delete this article permanently?')) return;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?id=eq.${id}`,
    { method: 'DELETE', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  if (res.ok) { msg('Article deleted.'); loadAdminList(); }
}

// === CUSTOM CATEGORY SELECT ===
const selectEl = document.getElementById('categorySelect');
const triggerEl = document.getElementById('categoryTrigger');
const badgeEl = document.getElementById('categoryBadge');
const hiddenInput = document.getElementById('fCategory');

triggerEl.addEventListener('click', () => selectEl.classList.toggle('open'));

document.addEventListener('click', e => {
  if (!selectEl.contains(e.target)) selectEl.classList.remove('open');
});

document.querySelectorAll('.custom-option').forEach(opt => {
  opt.addEventListener('click', () => {
    const val = opt.dataset.value;
    hiddenInput.value = val;
    badgeEl.textContent = val;
    badgeEl.className = `category-badge ${val.toLowerCase()}`;
    document.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    selectEl.classList.remove('open');

    // Show/hide breaking fields
    const isBreaking = val === 'BREAKING';
    document.getElementById('parentCatGroup').style.display = isBreaking ? 'block' : 'none';
    document.getElementById('breakingDurationGroup').style.display = isBreaking ? 'block' : 'none';
  });
});

// === SUBMISSIONS ===
async function loadSubmissions() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/submissions?select=*&order=created_at.desc`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  const data = await res.json();
  const list = document.getElementById('submissionsList');
  if (!list) return;

  if (!data || data.length === 0) {
    list.innerHTML = '<p style="color:rgba(255,255,255,0.4)">No submissions yet.</p>';
    return;
  }

  list.innerHTML = data.map(s => `
    <div class="admin-list-item submission-item">
      <div class="admin-list-info" style="flex-direction:column;align-items:flex-start;gap:0.4rem">
        <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap">
          <span class="admin-list-cat ${s.category.toLowerCase()}">${s.category}</span>
          <span class="sub-status sub-${s.status}">${s.status.toUpperCase()}</span>
          ${s.location ? `<span style="font-size:0.72rem;color:rgba(255,255,255,0.35)">📍 ${s.location}</span>` : ''}
        </div>
        <span class="admin-list-title">${s.title}</span>
        <span style="font-size:0.78rem;color:rgba(255,255,255,0.45);line-height:1.5">${s.content.substring(0, 180)}...</span>
        <span style="font-size:0.72rem;color:rgba(29,185,84,0.7)">📞 ${s.contact}</span>
        <span class="admin-list-date">${new Date(s.created_at).toLocaleDateString()}</span>
      </div>
      <div class="admin-list-actions" style="flex-direction:column;gap:0.5rem">
        ${s.status === 'pending' ? `
          <button class="admin-btn green small" onclick="approveSubmission(${s.id}, '${s.title.replace(/'/g,"\\'")}', '${s.category}', '${s.location || ''}', \`${s.content.replace(/`/g,'\\`')}\`)">Approve</button>
          <button class="admin-btn red small" onclick="rejectSubmission(${s.id})">Reject</button>
        ` : `<span style="font-size:0.75rem;color:rgba(255,255,255,0.3)">${s.status}</span>`}
      </div>
    </div>
  `).join('');
}

async function approveSubmission(id, title, category, location, content) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ title, category, location, content, author: 'Community Contributor', published: true })
  });

  if (res.ok) {
    await fetch(`${SUPABASE_URL}/rest/v1/submissions?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    });
    alert('Submission approved and published!');
    loadSubmissions();
    loadAdminList();
  }
}

async function rejectSubmission(id) {
  if (!confirm('Reject this submission?')) return;
  await fetch(`${SUPABASE_URL}/rest/v1/submissions?id=eq.${id}`, {
    method: 'PATCH',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'rejected' })
  });
  loadSubmissions();
}

document.addEventListener('DOMContentLoaded', () => {
  const panel = document.getElementById('adminPanel');
  const observer = new MutationObserver(() => {
    if (panel.style.display !== 'none') loadSubmissions();
  });
  observer.observe(panel, { attributes: true, attributeFilter: ['style'] });
});

// === BUFFER / BITLY ===
async function postToBuffer({ id, title, excerpt, image_url }) {
  const SITE_URL = "https://theorizeentimes.getorizeen.workers.dev";
  const CHANNEL_IDS = [
    "6a126998c687a22dd41dd5db", // X
    "6a1268c9c687a22dd41dd48a", // Facebook
    "6a1268aac687a22dd41dd441", // Threads
  ];

  const longUrl = `${SITE_URL}/article?id=${id}`;
  let shortUrl = longUrl;

  try {
    const bitlyRes = await fetch("https://orizeen-api.getorizeen.workers.dev/api/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: longUrl })
    });
    const bitlyData = await bitlyRes.json();
    if (bitlyData.short) shortUrl = bitlyData.short;
  } catch (e) {
    console.warn("Bitly failed, using long URL");
  }

  const caption = `${title}\n\n${excerpt}\n\n🔗 ${shortUrl}`;

  await fetch("https://orizeen-api.getorizeen.workers.dev/api/post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caption, image_url, channelIds: CHANNEL_IDS })
  });

  console.log("✅ Posted to all platforms");
}
