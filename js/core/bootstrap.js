      document.querySelectorAll('#mscroll,#hscroll,#escroll,#pvList,#pdBody,#rdBody').forEach(e => e.addEventListener('scroll', () => {if (e.scrollLeft) e.scrollLeft = 0}));
      $('#rstBtn').onclick = openSw; $('#mLogout').onclick = logout;
      document.querySelectorAll('.nav>div').forEach(n => n.onclick = () => {goTab(n.dataset.tab)});
      buildMenus();
      $('#phone').addEventListener('scroll', e => {e.target.scrollLeft = 0; e.target.scrollTop = 0});
      new MutationObserver(() => $('#register').classList.toggle('back', !!document.querySelector('.sub.open'))).observe($('#phone'), {attributes: true, subtree: true, attributeFilter: ['class']});
    