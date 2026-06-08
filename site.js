// ==========================================================================
// site.js — renders the public portfolio pages from data.json
// If data.json fails to load, the default HTML content remains as a fallback.
// ==========================================================================

(async function () {
  let data;
  try {
    const res = await fetch('data.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('no data.json');
    data = await res.json();
  } catch (e) {
    return; // keep static fallback content
  }

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ---- Site name (logo on every page) ----
  $$('.js-name').forEach(el => { el.textContent = data.name; });

  // ---- Profile identity (title, organization, verified tick) ----
  $$('.js-title').forEach(el => { el.textContent = data.title || ''; el.hidden = !data.title; });
  $$('.js-org').forEach(el => { el.textContent = data.organization || ''; el.hidden = !data.organization; });
  $$('.js-verified').forEach(el => { el.hidden = !data.verified; });

  // ---- Resume link (nav + home card) — only shown if a PDF is uploaded ----
  const resumeUrl = data.resume ? `${data.resume}?v=${data.resumeVersion || 0}` : '';
  if (resumeUrl) {
    $$('.js-resume').forEach(a => { a.setAttribute('href', resumeUrl); });
    $$('.resume-nav, .resume-card').forEach(el => { el.hidden = false; });
  }

  // ---- Photo (Home + About) ----
  const photoSrc = data.photo ? `${data.photo}?v=${data.photoVersion || 0}` : '';
  $$('.js-photo').forEach(el => {
    if (photoSrc) {
      el.innerHTML = `<img class="photo-img" src="${esc(photoSrc)}" alt="${esc(data.name)}" />`;
    } else {
      el.innerHTML = `<i class="user-icon">${esc(data.initials || 'DS')}</i>`;
    }
  });

  // ---- Hero (Home) ----
  if ($('#heroGreeting')) $('#heroGreeting').textContent = data.hero.greeting;
  if ($('#heroBio')) $('#heroBio').textContent = data.hero.bio;

  // ---- About page ----
  if ($('#aboutIntro')) {
    $('#aboutIntro').innerHTML = (data.about.intro || [])
      .map(p => `<p>${esc(p)}</p>`).join('');
  }
  if ($('#careerText')) $('#careerText').textContent = data.about.careerText;
  if ($('#timeline')) {
    $('#timeline').innerHTML = (data.about.timeline || []).map(item => `
      <div class="tl-item">
        <span class="tl-date">${esc(item.date)}</span>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.place)}</p>
      </div>`).join('');
  }

  // ---- Skills page ----
  if ($('#skillTags')) {
    $('#skillTags').innerHTML = (data.skills || [])
      .map(t => `<span class="tag">${esc(t)}</span>`).join('');
  }
  if ($('#skillsDetail')) {
    $('#skillsDetail').innerHTML = (data.skillsDetail || []).map(s => `
      <div class="skill-row">
        <span class="skill-name">${esc(s.name)}</span>
        <span class="skill-meta">${esc(s.meta)}</span>
      </div>`).join('');
  }

  // ---- Work page ----
  if ($('#workList')) {
    $('#workList').innerHTML = (data.work || []).map((w, i) => `
      <div class="work-card">
        <div class="work-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="work-info">
          <h3>${esc(w.title)}</h3>
          <p>${esc(w.desc)}</p>
          <div class="work-tags">${(w.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
        </div>
      </div>`).join('');
  }

  // ---- Contact page ----
  $$('.js-email').forEach(el => {
    el.textContent = data.contact.email;
    el.setAttribute('href', 'mailto:' + data.contact.email);
  });
  if ($('#contactLocation')) $('#contactLocation').textContent = data.contact.location;
  if ($('#contactRole')) $('#contactRole').textContent = data.contact.role;
  const setSocial = (cls, url) => {
    const valid = url && url !== '#';
    $$('.' + cls).forEach(el => {
      if (valid) { el.setAttribute('href', url); el.hidden = false; }
      else { el.hidden = true; }
    });
  };
  setSocial('js-github', data.contact.github);
  setSocial('js-linkedin', data.contact.linkedin);
  setSocial('js-scholar', data.contact.scholar);
  setSocial('js-orcid', data.contact.orcid);

  // ---- Research / Publications page ----
  if ($('#pubList')) {
    const pubs = data.publications || [];
    if (pubs.length) {
      $('#pubList').innerHTML = pubs.map(p => `
        <div class="pub-card">
          <div class="pub-year">${esc(p.year || '—')}</div>
          <div class="pub-body">
            <h3>${esc(p.title)}</h3>
            ${p.authors ? `<p class="pub-authors">${esc(p.authors)}</p>` : ''}
            ${p.venue ? `<p class="pub-venue">${esc(p.venue)}</p>` : ''}
            ${p.link ? `<a class="pub-link" href="${esc(p.link)}" target="_blank" rel="noopener">Read more ↗</a>` : ''}
          </div>
        </div>`).join('');
    }
  }

  // ---- Contact form submission (Web3Forms) ----
  const cform = document.getElementById('contactForm');
  if (cform) {
    cform.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = cform.querySelector('button[type="submit"]');
      const orig = btn.innerHTML;
      const nameEl = document.getElementById('name');
      const emailEl = document.getElementById('email');
      const msgEl = document.getElementById('message');
      const key = data.contact.formAccessKey;
      if (!key) {
        const subject = encodeURIComponent('Portfolio contact from ' + (nameEl?.value || ''));
        const body = encodeURIComponent((msgEl?.value || '') + '\n\nReply to: ' + (emailEl?.value || ''));
        window.location.href = `mailto:${data.contact.email}?subject=${subject}&body=${body}`;
        return;
      }
      btn.disabled = true; btn.textContent = 'Sending…';
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            access_key: key,
            subject: 'New message from your portfolio site',
            from_name: nameEl.value,
            name: nameEl.value, email: emailEl.value, message: msgEl.value
          })
        });
        const json = await res.json();
        if (json.success) { btn.textContent = 'Message sent! ✓'; cform.reset(); }
        else throw new Error(json.message || 'failed');
      } catch (err) {
        btn.textContent = 'Failed — please email directly';
      } finally {
        setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 4000);
      }
    });
  }

  // Re-trigger reveal animation for any freshly injected .reveal elements
  document.dispatchEvent(new Event('content-rendered'));
})();
