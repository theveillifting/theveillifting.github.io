/* ============================================================
   THE VEIL LIFTING — shared behavior
   Drifting starfield, scroll reveals, sticky nav, notify form
   ============================================================ */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* reveal hero entrance (visible end-state is the default; this only animates IN) */
  setTimeout(function () { document.body.classList.add('ready'); }, 60);

  /* ---------- starfield ---------- */
  var canvas = document.getElementById('stars');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var w, h, dpr, stars = [], shoot = null, t0 = performance.now();

    function rand(a, b) { return a + Math.random() * (b - a); }

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round((w * h) / 7200);
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w, y: Math.random() * h,
          r: rand(0.3, 1.7),
          base: rand(0.16, 0.92),
          tw: rand(0.0012, 0.0052),
          ph: rand(0, Math.PI * 2),
          dx: rand(-0.012, 0.012), dy: rand(0.006, 0.03),
          gold: Math.random() < 0.30,
          spark: Math.random() < 0.42
        });
      }
    }

    function maybeShoot(now) {
      if (shoot || Math.random() > 0.004) return;
      var fromLeft = Math.random() < 0.5;
      shoot = {
        x: fromLeft ? rand(0, w * 0.4) : rand(w * 0.6, w),
        y: rand(0, h * 0.45),
        vx: (fromLeft ? 1 : -1) * rand(2.6, 4.2),
        vy: rand(1.2, 2.2),
        life: 0, max: rand(50, 80)
      };
    }

    function frame(now) {
      var dt = now - t0; t0 = now;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.x += s.dx; s.y += s.dy;
        if (s.y > h + 2) { s.y = -2; s.x = Math.random() * w; }
        if (s.x > w + 2) s.x = -2; if (s.x < -2) s.x = w + 2;
        var tw = Math.sin(s.ph + now * s.tw);
        var a = s.base * (0.22 + 0.78 * (tw * 0.5 + 0.5));
        var col = s.gold ? '236,205,132' : '232,224,245';
        var peak = s.spark && tw > 0.8;
        if (s.spark) { ctx.shadowColor = 'rgba(' + col + ',' + a.toFixed(3) + ')'; ctx.shadowBlur = peak ? 7 : 3; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + col + ',' + a.toFixed(3) + ')';
        ctx.fill();
        if (peak) {
          var fl = s.r * 4.6;
          ctx.strokeStyle = 'rgba(' + col + ',' + (a * 0.55).toFixed(3) + ')';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(s.x - fl, s.y); ctx.lineTo(s.x + fl, s.y);
          ctx.moveTo(s.x, s.y - fl); ctx.lineTo(s.x, s.y + fl);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
      maybeShoot(now);
      if (shoot) {
        shoot.life++;
        shoot.x += shoot.vx; shoot.y += shoot.vy;
        var p = 1 - shoot.life / shoot.max;
        var tailX = shoot.x - shoot.vx * 9, tailY = shoot.y - shoot.vy * 9;
        var g = ctx.createLinearGradient(shoot.x, shoot.y, tailX, tailY);
        g.addColorStop(0, 'rgba(245,228,180,' + (0.7 * p).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(245,228,180,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(tailX, tailY); ctx.stroke();
        if (shoot.life >= shoot.max) shoot = null;
      }
      requestAnimationFrame(frame);
    }

    function drawStatic() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.gold ? 'rgba(236,205,132,' + s.base + ')' : 'rgba(232,224,245,' + s.base + ')';
        ctx.fill();
      }
    }

    build();
    window.addEventListener('resize', function () { build(); if (reduce) drawStatic(); });
    if (reduce) drawStatic(); else requestAnimationFrame(frame);
  }

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var d = e.target.getAttribute('data-delay');
            if (d) e.target.style.transitionDelay = d + 'ms';
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- sticky bar ---------- */
  var bar = document.querySelector('.stickybar');
  var hero = document.querySelector('[data-hero]');
  if (bar && hero) {
    var sentinel = new IntersectionObserver(function (entries) {
      bar.classList.toggle('show', !entries[0].isIntersecting);
    }, { threshold: 0 });
    sentinel.observe(hero);
  }

  /* ---------- notify form ---------- */
  document.querySelectorAll('form.notify').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input');
      var val = (input.value || '').trim();
      if (!val || val.indexOf('@') < 0) {
        input.focus();
        input.style.borderColor = 'rgba(220,120,120,.7)';
        return;
      }
      form.innerHTML = '<p class="ok">✦ You\u2019re on the list. The veil will lift when the book is ready.</p>';
    });
  });
})();
