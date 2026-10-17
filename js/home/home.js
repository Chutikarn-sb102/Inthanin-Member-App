      function fitStat() {const e = $('#stat'), sc = $('#phone').getBoundingClientRect().width / 430; e.style.fontSize = '10px'; const r = document.createRange(); r.selectNodeContents(e); const w = r.getBoundingClientRect().width / sc; if (w) e.style.fontSize = (10 * e.clientWidth * 0.743 / w).toFixed(2) + 'px'}
      if (document.fonts) document.fonts.ready.then(() => {try {fitStat()} catch (_) { } });
      let adT; function showAd(d) {$('#home').classList.add('locked'); clearTimeout(adT); adT = setTimeout(() => $('#ad').classList.add('show'), d)}
      function hideAd() {$('#home').classList.remove('locked'); clearTimeout(adT); $('#ad').classList.remove('show')}
      function renderHome(m, d) {
        if (m.welcome) {m.welcome = 0; API.call('/api/welcome', {}).catch(console.error); setTimeout(welcome, 800)} const H = DB.home; H.sweetness = m.sweetness ?? H.sweetness; H.points = m.points || 0; H.checkins = (m.ck && m.ck.n) || 0; showAd(d || 350); $('#uname').textContent = (DB.lang === 'th' ? 'คุณ ' : '') + m.name; cur = m; $('#mName').textContent = $('#uname').textContent; renderMember(); setPts(H.points); $('#stat').textContent = 'STATUS: ' + H.status; fitStat(); $('#sweet').textContent = H.sweetness + '%';
        buildMenus()
      }
      $('#adx').onclick = () => {hideAd(); maybeCheckin()};
      const openSet = () => $('#settings').classList.add('open');
      document.querySelectorAll('.gear').forEach(g => g.onclick = openSet);
      $('#setX').onclick = () => $('#settings').classList.remove('open');
      function resetUI() {$('#ckPop').classList.remove('show');['#hscroll', '#mscroll', '#escroll', '#pvList', '#pdBody', '#rdBody'].forEach(q => {const e = $(q); if (e) {e.scrollTop = 0; e.scrollLeft = 0} });['#bn', '#mn'].forEach(q => {$(q).scrollLeft = 0}); document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('on', i === 0)); closeSw();['priv', 'explore', 'detail', 'promo', 'rdetail', 'member', 'settings'].forEach(i => $('#' + i).classList.remove('open'))}
      async function logout() {try {await API.call('/api/logout', {})} catch (err) {console.error(err)} resetUI(); hideAd(); closeSw();['priv', 'explore', 'detail', 'promo', 'rdetail', 'member'].forEach(i => $('#' + i).classList.remove('open')); $('#settings').classList.remove('open'); $('#home').classList.remove('open'); $('#login').classList.add('open'); $('#lpw').value = ''; toast('ออกจากระบบแล้ว')}
      (function () {let tm; const h = $('#setTitle'); h.onpointerdown = () => {tm = setTimeout(logout, 900)}; h.onpointerup = h.onpointerleave = () => clearTimeout(tm)})();
      API.call('/api/me').then(m => {if (m) {renderHome(m, DB.splashMs + 250); $('#home').classList.add('open')}}).catch(console.error);
      (function () {
        const bn = $('#bn'), dots = document.querySelectorAll('.dot');
        bn.addEventListener('scroll', () => {const i = Math.round(bn.scrollLeft / 430); dots.forEach((d, j) => d.classList.toggle('on', i === j))});
        document.querySelectorAll('.hs').forEach(el => {
          let dn = false, mv = 0;
          el.addEventListener('mousedown', () => {dn = true; mv = 0; el.style.scrollSnapType = 'none'});
          addEventListener('mousemove', e => {if (!dn) return; const sc = $('#phone').getBoundingClientRect().width / 430; el.scrollLeft -= e.movementX / sc; mv += Math.abs(e.movementX)});
          addEventListener('mouseup', () => {if (!dn) return; dn = false; if (el.id === 'bn') {const i = Math.max(0, Math.min(2, Math.round(el.scrollLeft / 430))); el.scrollTo({left: i * 430, behavior: 'smooth'}); setTimeout(() => el.style.scrollSnapType = 'x mandatory', 400)} })
        })
      })();
