      function renderPriv() {
        const P = DB.home.points, q = L(); $('#pvBan').src = DB.privBanner;
        $('#pvList').innerHTML = DB.rewards.map((r, i) => `<div class="rc" data-i="${i}"><div class="rt"><img src="${r.img}"></div><div class="rn">${r.title}</div><div class="rd">${r.desc}</div><div class="rp"><img src="${DB.rewardIcon}"><b>${r.cost}</b><span>${q.pvUnit}</span></div><button class="rb${P >= r.cost ? ' on' : ''}" ${P >= r.cost ? '' : 'disabled'}>${q.pvBtn}</button></div>`).join('')
      }
      var curR = 0; function openReward(i) {
        curR = i; const r = DB.rewards[i], q = L(), P = DB.home.points; $('#rdImg').src = r.tile; $('#rdName').textContent = r.title; $('#rdDesc').textContent = r.lines; $('#rdCost').textContent = r.cost; $('#rdIco').src = DB.rewardIcon2;
        $('#rdBody').innerHTML = '<ul>' + r.bullets.map(b => `<li>${b.replace(/\n/g, '<br>')}</li>`).join('') + `</ul><p class="f"><b>${q.rdHow}</b> ${r.how}</p><p><b>${q.rdWhere}</b> ${r.where}</p><p class="ex"><b>${q.rdExp}</b> ${r.exp}</p>`; $('#rdBody').scrollTop = 0;
        const bt = $('#rdBtn'); bt.className = P >= r.cost ? 'on' : ''; bt.textContent = q.pvBtn; $('#rdetail').classList.add('open')
      }
      var pendR = null;
      function rdmShow(w) {$('#rdm').classList.add('show'); $('#rq').classList.toggle('on', w === 'q'); $('#rs').classList.toggle('on', w === 's'); if (w === 's') confetti($('#rdm'))}
      function rdmHide() {$('#rdm').classList.remove('show'); $('#rdm').querySelectorAll('.cf').forEach(e => e.remove())}
      function askRedeem(i) {pendR = i; rdmShow('q')}
      $('#rdBtn').onclick = () => {if ($('#rdBtn').classList.contains('on')) askRedeem(curR)};
      $('#rqNo').onclick = rdmHide;
      $('#rqYes').onclick = async () => {const r = DB.rewards[pendR], m = cur; if (!r || !m) return rdmHide(); try {const updated = await API.call('/api/redeem', {reward_id:r.id}); Object.assign(m, updated); DB.home.points = m.points; setPts(m.points); renderPriv(); rdmShow('s')} catch(e) {rdmHide(); toast(e.message)}};
      $('#rsBack').onclick = () => {rdmHide(); $('#rdetail').classList.remove('open')};
      $('#rsGo').onclick = () => {rdmHide(); goTab('member'); setTimeout(() => {$('#mscroll').scrollTo({top: 700, behavior: 'smooth'})}, 450)};
      $('#rdBack').onclick = () => $('#rdetail').classList.remove('open');
      $('#pvList').onclick = e => {if (e.target.closest('.rb.on')) {askRedeem(+e.target.closest('.rc').dataset.i); return } const c = e.target.closest('.rc'); if (c) openReward(+c.dataset.i)};
      function goTab(t) {['detail', 'explore', 'promo', 'rdetail', 'priv', 'member'].forEach(i => $('#' + i).classList.remove('open')); if (t === 'priv') {renderPriv(); $('#priv').classList.add('open')} else if (t === 'member') {renderMember(); $('#member').classList.add('open')} }
