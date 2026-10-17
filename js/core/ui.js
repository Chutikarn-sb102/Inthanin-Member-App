      const $ = s => document.querySelector(s), L = () => DB.i18n[DB.lang];
      function render() {
        document.documentElement.lang = DB.lang;
        document.querySelectorAll('[data-t]').forEach(e => e.textContent = L()[e.dataset.t]);
        document.querySelectorAll('[data-p]').forEach(e => e.placeholder = L()[e.dataset.p]);
        $('#tcBody').innerHTML = DB.terms[DB.lang].map(s => `<h3>${s.h}</h3>` + (s.p ? `<p>${s.p}</p>` : `<ul>${s.ul.map(x => `<li>${x}</li>`).join('')}</ul>`)).join('');
      }
      function fit() {const s = Math.min(innerWidth / 430, innerHeight / 932, 1.4); $('#phone').style.transform = `scale(${s})`}
      addEventListener('resize', fit); fit(); render();
      const d = new Date(); $('#time').textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      document.querySelectorAll('#login,#terms,#home,#settings,#explore,#detail,#promo,#priv,#rdetail,#member,#register').forEach(s => s.append($('.status').cloneNode(true), $('.sicons').cloneNode(true)));
      setTimeout(() => $('#splash').classList.add('hide'), DB.splashMs);
