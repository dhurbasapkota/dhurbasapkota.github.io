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
  $$('.js-github').forEach(el => el.setAttribute('href', data.contact.github || '#'));
  $$('.js-linkedin').forEach(el => el.setAttribute('href', data.contact.linkedin || '#'));

  // Re-trigger reveal animation for any freshly injected .reveal elements
  document.dispatchEvent(new Event('content-rendered'));
})();
