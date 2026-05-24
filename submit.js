// === SHARE NEWS SUBMISSION ===

async function submitNews() {
  const title = document.getElementById('sTitle').value.trim();
  const category = document.getElementById('sCategory').value;
  const location = document.getElementById('sLocation').value.trim();
  const content = document.getElementById('sContent').value.trim();
  const contact = document.getElementById('sContact').value.trim();
  const msg = document.getElementById('submitMsg');

  if (!title || !content || !contact) {
    msg.style.color = '#C0392B';
    msg.textContent = 'Please fill in headline, story and contact details.';
    return;
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/submissions`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      title, category, location, content, contact, status: 'pending'
    })
  });

  if (res.ok) {
    document.getElementById('submitForm').style.display = 'none';
    document.getElementById('submitSuccess').style.display = 'block';
  } else {
    msg.style.color = '#C0392B';
    msg.textContent = 'Something went wrong. Please try again.';
  }
}

// === CUSTOM CATEGORY SELECT (SUBMIT PAGE) ===
const sSel = document.getElementById('sCategorySelect');
const sTrig = document.getElementById('sCategoryTrigger');
const sBadge = document.getElementById('sCategoryBadge');
const sHidden = document.getElementById('sCategory');

if (sTrig) {
  sTrig.addEventListener('click', () => sSel.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!sSel.contains(e.target)) sSel.classList.remove('open');
  });
  document.querySelectorAll('#sCategoryDropdown .custom-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const val = opt.dataset.value;
      sHidden.value = val;
      sBadge.textContent = val;
      sBadge.className = `category-badge ${val.toLowerCase()}`;
      document.querySelectorAll('#sCategoryDropdown .custom-option')
        .forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      sSel.classList.remove('open');
    });
  });
}
