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
