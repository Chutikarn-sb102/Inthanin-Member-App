      function load(fn, ms) {const l = $('#loading'); l.classList.add('show'); setTimeout(() => {l.classList.remove('show'); fn()}, ms || 1300)}
