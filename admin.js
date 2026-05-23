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
  document.getElementById('formTitle').textContent = 'Publish New Article';
  document.getElementById('saveLabel').textContent = 'Publish Article';
}

async function saveArticle() {
  const id = document.getElementById('editId').value;
  const title = document.getElementById('fTitle').value.trim();
  const category = document.getElementById('fCategory').value;
  const author = document.getElementById('fAuthor').value.trim();
  const image_url = document.getElementById('fImage').value.trim();
  const excerpt = document.getElementById('fExcerpt').value.trim();
  const content = document.getElementById('fContent').value.trim();

  if (!title || !content) {
    msg('Headline and content are required.', 'red');
    return;
  }

  const news_date = document.getElementById('fDate').value;
  const location = document.getElementById('fLocation').value.trim();
  const payload = { title, category, author, image_url, excerpt, content, news_date, location, published: true };
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  let res;
  if (id) {
    // UPDATE
    res = await fetch(`${SUPABASE_URL}/rest/v1/articles?id=eq.${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload)
    });
  } else {
    // INSERT
    res = await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  }

  if (res.ok) {
    msg(id ? 'Article updated!' : 'Article published!');
    resetForm();
    loadAdminList();
  } else {
    msg('Something went wrong. Check your Supabase credentials.', 'red');
  }
}

async function loadAdminList() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?select=*&order=created_at.desc`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
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
        <span class="admin-list-title">${a.title}</span>
        <span class="admin-list-date">${new Date(a.created_at).toLocaleDateString()}</span>
      </div>
      <div class="admin-list-actions">
        <button class="admin-btn ghost small" onclick="editArticle(${a.id})">Edit</button>
        <button class="admin-btn red small" onclick="deleteArticle(${a.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

async function editArticle(id) {
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
  if (!data || data.length === 0) return;
  const a = data[0];

  document.getElementById('editId').value = a.id;
  document.getElementById('fTitle').value = a.title;
  document.getElementById('fCategory').value = a.category;
  document.getElementById('fAuthor').value = a.author || '';
  document.getElementById('fImage').value = a.image_url || '';
  document.getElementById('fExcerpt').value = a.excerpt || '';
  document.getElementById('fContent').value = a.content;
  document.getElementById('formTitle').textContent = 'Edit Article';
  document.getElementById('saveLabel').textContent = 'Save Changes';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteArticle(id) {
  if (!confirm('Delete this article permanently?')) return;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?id=eq.${id}`,
    {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );
  if (res.ok) {
    msg('Article deleted.');
    loadAdminList();
  }
}

// === CUSTOM CATEGORY SELECT ===
const selectEl = document.getElementById('categorySelect');
const triggerEl = document.getElementById('categoryTrigger');
const dropdownEl = document.getElementById('categoryDropdown');
const badgeEl = document.getElementById('categoryBadge');
const hiddenInput = document.getElementById('fCategory');

triggerEl.addEventListener('click', () => {
  selectEl.classList.toggle('open');
});

document.addEventListener('click', e => {
  if (!selectEl.contains(e.target)) {
    selectEl.classList.remove('open');
  }
});

document.querySelectorAll('.custom-option').forEach(opt => {
  opt.addEventListener('click', () => {
    const val = opt.dataset.value;
    hiddenInput.value = val;
    badgeEl.textContent = val;
    badgeEl.className = `category-badge ${val.toLowerCase()}`;
    document.querySelectorAll('.custom-option').forEach(o =>
      o.classList.remove('selected')
    );
    opt.classList.add('selected');
    selectEl.classList.remove('open');
  });
});
