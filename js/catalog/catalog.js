      function buildMenus() {
        const M = DB.menu;
        $('#mn').innerHTML = M.slice(0, 5).map(m => `<div class="mc"><img src="${m.img}"><div>${m.en}</div></div>`).join('') + '<div style="flex:none;width:22px"></div>';
        const tops = [166, 356, 546, 736];
        $('#pr').innerHTML = DB.promos.map((p, i) => `<img class="abs" data-i="${i}" src="${p.img}" style="left:${i ? 226 : 35}px;top:0;width:177px;height:133px;border-radius:12px;cursor:pointer">`).join('');
        $('#egrid').innerHTML = M.map((m, i) => `<div class="mc ec" data-i="${i}" style="left:${i % 2 ? 232 : 58}px;top:${tops[i >> 1]}px"><img src="${m.img}"><div>${m.en}</div></div>`).join('')
      }
      function openPromo(i) {
        const p = DB.promos[i]; $('#pImg').src = p.big; $('#pTitle').textContent = p.title;
        $('#pBody').innerHTML = '<div class="pl">เงื่อนไข:</div><ul class="' + (p.gap ? 'gap' : '') + '">' + p.bullets.map(b => `<li>${b}</li>`).join('') + '</ul>' + p.meta.map(m => `<div class="pm"><b>${m[0]}</b> ${m[1]}</div>`).join(''); $('#promo').classList.add('open')
      }
      $('#pr').onclick = e => {const c = e.target.closest('img'); if (c) openPromo(+c.dataset.i)};
      $('#prBack').onclick = () => $('#promo').classList.remove('open');
      function openDetail(i) {
        const m = DB.menu[i]; $('#dImg').src = m.big || m.img; $('#dTh').textContent = m.th; $('#dEn').textContent = m.en; $('#dBest').style.display = m.best ? 'flex' : 'none'; $('#dDesc').textContent = m.desc;
        $('#dPrices').innerHTML = m.prices.map((p, j) => `<div class="pr" style="top:${[686, 725, 766][j]}px"><span>${p[0]}</span><b>฿ ${p[1]}.-</b></div>`).join(''); $('#detail').classList.add('open')
      }
      $('#egrid').onclick = e => {const c = e.target.closest('.ec'); if (c) openDetail(+c.dataset.i)};
      $('#seeAll').onclick = () => $('#explore').classList.add('open');
      $('#exBack').onclick = () => $('#explore').classList.remove('open');
      $('#deBack').onclick = () => $('#detail').classList.remove('open');
