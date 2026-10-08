/* Tech Day 2026 — shared app logic (login, scoring, leaderboard, Google Form backup, branding, toasts) */
var TDApp = (function () {
  var KEY_USER = 'td26_user';
  var KEY_PROG = 'td26_progress_';
  var KEY_BOARD = 'td26_board';
  var KEY_FB = 'td26_feedback';
  var KEY_FB_DONE = 'td26_feedback_done';
  var KEY_SIG = 'td26_mirror_sig_';

  if (typeof APP_CONFIG === 'undefined') {
    console.warn('[TechDay] js/config.js did not load (APP_CONFIG is undefined). Using defaults.');
  }
  function cfg() { return (typeof APP_CONFIG !== 'undefined' && APP_CONFIG) || {}; }
  function cfgUrl() { return cfg().SCRIPT_URL || ''; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function readJSON(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  /* ---------- user / session ---------- */
  function getUser() { return readJSON(KEY_USER, null); }
  function setUser(name) {
    name = String(name || '').trim();
    if (name.length < 2) return false;
    var id = 'u_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    writeJSON(KEY_USER, { id: id, name: name });
    // record the sign-in in the Google Form
    sendBackup({ type: 'signin', id: id, name: name, at: new Date().toISOString() });
    return true;
  }
  function logout() {
    try { localStorage.removeItem(KEY_USER); } catch (e) {}
    location.href = 'index.html?needLogin=1';
  }
  function requireUser(page) {
    var u = getUser();
    if (u && u.name) return true;
    location.replace('index.html?needLogin=1&next=' + encodeURIComponent(page || 'index.html'));
    return false;
  }

  /* ---------- nav + chip ---------- */
  var A_OPEN = '<' + 'a ';
  var A_CLOSE = '<' + '/a>';
  function navHtml(active) {
    var items = [
      ['home', 'index.html', 'Home'],
      ['quiz', 'quiz.html', 'Quiz'],
      ['sim', 'simulation.html', 'Scenarios'],
      ['videos', 'videos.html', 'Videos'],
      ['board', 'leaderboard.html', 'Leaderboard'],
      ['progress', 'progress.html', 'Progress'],
      ['feedback', 'feedback.html', 'Feedback']
    ];
    return '<nav class="site-nav">' + items.map(function (it) {
      return A_OPEN + 'href="' + it[1] + '"' + (it[0] === active ? ' class="active"' : '') + '>' + it[2] + A_CLOSE;
    }).join('') + '</nav>';
  }
  function renderUserChip(el) {
    if (!el) return;
    var u = getUser();
    if (!u || !u.name) {
      el.innerHTML = A_OPEN + 'class="user-chip ghost" href="index.html?needLogin=1">Sign in' + A_CLOSE;
      return;
    }
    var score = totalScore(getProgress());
    el.innerHTML = '<div class="user-chip">' +
      '<div class="uc-avatar">' + esc(u.name.charAt(0).toUpperCase()) + '</div>' +
      '<div class="uc-meta"><strong>' + esc(u.name) + '</strong><small>' + score + ' pts</small></div>' +
      '<button class="uc-out" type="button" title="Switch user" id="tdLogout">&#x238B;</button></div>';
    var b = document.getElementById('tdLogout');
    if (b) b.addEventListener('click', logout);
  }

  /* ---------- progress ---------- */
  function defaultProgress() {
    return {
      quizBest: 0, quizAttempts: 0, quizLast: 0,
      simFlags: 0, simXp: 0, simDone: false, simScenes: [],
      videosWatched: {},
      engagement: { correctAnswers: 0, wrongAnswers: 0, clicks: 0 }
    };
  }
  function getProgress() {
    var u = getUser();
    var base = defaultProgress();
    if (!u) return base;
    var p = readJSON(KEY_PROG + u.id, null) || {};
    for (var k in p) { if (Object.prototype.hasOwnProperty.call(p, k)) base[k] = p[k]; }
    base.engagement = base.engagement || { correctAnswers: 0, wrongAnswers: 0, clicks: 0 };
    base.videosWatched = base.videosWatched || {};
    return base;
  }
  function saveProgress(patch) {
    var u = getUser();
    if (!u) return null;
    var p = getProgress();
    for (var k in patch) { if (Object.prototype.hasOwnProperty.call(patch, k)) p[k] = patch[k]; }
    p.updatedAt = new Date().toISOString();
    writeJSON(KEY_PROG + u.id, p);
    return p;
  }
  function bumpEngagement(key) {
    var p = getProgress();
    p.engagement[key] = (p.engagement[key] || 0) + 1;
    saveProgress({ engagement: p.engagement });
  }

  /* ---------- scoring: quiz 100 + clues 100 + all scenes 20 + videos up to 15 ---------- */
  function totalScore(p) {
    p = p || getProgress();
    var quiz = Math.round(Math.min(p.quizBest || 0, 10) / 10 * 100);
    var sim = Math.round(Math.min(p.simFlags || 0, 24) / 24 * 100);
    var done = p.simDone ? 20 : 0;
    var vids = Math.min(15, Object.keys(p.videosWatched || {}).length * 5);
    return quiz + sim + done + vids;
  }
  function awarenessLabel(score) {
    if (score >= 200) return 'Security Champion';
    if (score >= 150) return 'Scam Spotter';
    if (score >= 90) return 'Sharp Eye';
    if (score >= 40) return 'Getting There';
    return 'Beginner';
  }

  /* ---------- board rows ---------- */
  function buildRow() {
    var u = getUser();
    if (!u) return null;
    var p = getProgress();
    var s = totalScore(p);
    return {
      id: u.id, name: u.name, score: s,
      quizBest: p.quizBest || 0, simFlags: p.simFlags || 0, simXp: p.simXp || 0,
      simDone: !!p.simDone,
      videos: Object.keys(p.videosWatched || {}).length,
      engagement: p.engagement || {},
      label: awarenessLabel(s),
      updatedAt: p.updatedAt || new Date().toISOString()
    };
  }
  function getLocalBoard() {
    var map = readJSON(KEY_BOARD, {});
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
  }
  function isOnlineBoard() { return !!cfgUrl(); }

  /* ---------- Google Apps Script (shared leaderboard) ---------- */
  function withAction(action, row) {
    var o = { action: action };
    for (var k in row) { if (Object.prototype.hasOwnProperty.call(row, k)) o[k] = row[k]; }
    return o;
  }
  function post(payload) {
    var url = cfgUrl();
    if (!url) return Promise.resolve(false);
    return fetch(url, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function () { return true; }).catch(function () { return false; });
  }

  /* ---------- Google Form backup (sign-ins, scores, feedback) ---------- */
  function mirrorEnabled() {
    var g = cfg().GOOGLE_FORM;
    return !!((g && g.URL) || cfg().WEBHOOK_URL);
  }
  function sendBackup(payload) {
    var g = cfg().GOOGLE_FORM;
    try {
      if (g && g.URL) {
        var body = new URLSearchParams();
        var f = g.FIELDS || {};
        for (var k in f) {
          if (f[k] && payload[k] != null && payload[k] !== '') body.append(f[k], payload[k]);
        }
        fetch(g.URL, { method: 'POST', mode: 'no-cors', body: body, keepalive: true }).catch(function () {});
      }
      if (cfg().WEBHOOK_URL) {
        fetch(cfg().WEBHOOK_URL, {
          method: 'POST', mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload), keepalive: true
        }).catch(function () {});
      }
    } catch (e) {}
  }
  var pendingRow = null, pendingSig = '', mirrorTimer = null;
  function flushScoreBackup() {
    clearTimeout(mirrorTimer);
    if (!pendingRow) return;
    var r = pendingRow;
    pendingRow = null;
    try { localStorage.setItem(KEY_SIG + r.id, pendingSig); } catch (e) {}
    sendBackup({
      type: 'score', id: r.id, name: r.name, score: r.score,
      quizBest: r.quizBest, simFlags: r.simFlags, videos: r.videos,
      at: new Date().toISOString()
    });
  }
  // Waits a few seconds so a burst of clicks becomes one row; skips unchanged scores.
  function queueScoreBackup(row) {
    if (!mirrorEnabled() || !row) return;
    var sig = [row.score, row.quizBest, row.simFlags, row.videos].join('|');
    var last = '';
    try { last = localStorage.getItem(KEY_SIG + row.id) || ''; } catch (e) {}
    if (sig === last) return;
    pendingRow = row; pendingSig = sig;
    clearTimeout(mirrorTimer);
    mirrorTimer = setTimeout(flushScoreBackup, 4000);
  }
  window.addEventListener('pagehide', flushScoreBackup);

  /* ---------- publish / sync ---------- */
  function publishScore() {
    var row = buildRow();
    if (!row) return Promise.resolve({ mode: 'local' });
    var map = readJSON(KEY_BOARD, {});
    map[row.id] = row;
    writeJSON(KEY_BOARD, map);
    queueScoreBackup(row);
    if (!isOnlineBoard()) return Promise.resolve({ mode: 'local' });
    return post(withAction('submitScore', row)).then(function (ok) {
      return { mode: ok ? 'remote' : 'local' };
    });
  }
  function syncProgressRemote() {
    var row = buildRow();
    if (!row || !isOnlineBoard()) return Promise.resolve(false);
    return post(withAction('syncProgress', row));
  }
  function fetchLeaderboard() {
    var url = cfgUrl();
    if (!url) return Promise.resolve({ rows: getLocalBoard(), mode: 'local' });
    return fetch(url + '?action=leaderboard&t=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var rows = (d.rows || []).sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
        return { rows: rows, mode: 'remote' };
      })
      .catch(function () {
        return { rows: getLocalBoard(), mode: 'local', warn: 'Could not reach the shared board — showing this device only.' };
      });
  }

  /* ---------- feedback ---------- */
  function submitFeedback(data) {
    var u = getUser() || {};
    var entry = {
      id: u.id, name: u.name,
      rating: data.rating, useful: data.useful, clear: data.clear, suggest: data.suggest,
      at: new Date().toISOString()
    };
    var list = readJSON(KEY_FB, []);
    list.push(entry);
    writeJSON(KEY_FB, list);
    try { localStorage.setItem(KEY_FB_DONE, '1'); } catch (e) {}
    sendBackup({
      type: 'feedback', id: entry.id, name: entry.name, rating: entry.rating,
      useful: entry.useful, clear: entry.clear, suggest: entry.suggest, at: entry.at
    });
    return post(withAction('submitFeedback', entry)).then(function () { return true; });
  }

  /* ---------- toasts ---------- */
  function toast(opts) {
    opts = opts || {};
    var host = document.getElementById('toastHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toastHost';
      host.className = 'toast-host';
      document.body.appendChild(host);
    }
    var t = document.createElement('div');
    t.className = 'app-toast ' + (opts.type || 'error');
    t.innerHTML = '<div class="toast-icon">' + (opts.icon || '') + '</div>' +
      '<div class="toast-body"><strong>' + esc(opts.title) + '</strong><p>' + esc(opts.message) + '</p></div>';
    host.appendChild(t);
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add('show'); }); });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 350);
    }, opts.ms || 3500);
  }

  /* ---------- branding ----------
     - Company logo (glowing, transparent) in the top bar, scenarios intro screen and footers
     - The shield icon (home hero + page headers) is replaced by a glowing, animated logo
     Works even if config.js has no LOGO line (defaults to assets/logo.png).
     Set LOGO: '' in config.js to turn all logo branding off. */
  function logoPath() {
    var c = cfg();
    return (typeof c.LOGO === 'string') ? c.LOGO : 'assets/logo.png';
  }
  function logoEl(cls) {
    var c = cfg();
    var d = document.createElement('div');
    d.className = 'brand-logo ' + (cls || '');
    var img = document.createElement('img');
    img.src = logoPath();
    img.alt = c.COMPANY_NAME || 'Company logo';
    img.onerror = function () {
      d.style.display = 'none';
      console.warn('[TechDay] Logo failed to load from: ' + img.src);
    };
    d.appendChild(img);
    return d;
  }
  function swapForLogo(orig, cls) {
    if (!orig || !orig.parentNode) return;
    var img = document.createElement('img');
    img.className = 'td-glow-logo ' + cls;
    img.src = logoPath();
    img.alt = cfg().COMPANY_NAME || 'Company logo';
    img.onerror = function () {
      if (img.parentNode) img.parentNode.removeChild(img);
      orig.style.display = '';
      console.warn('[TechDay] Logo failed to load from: ' + img.src);
    };
    orig.parentNode.insertBefore(img, orig);
    orig.style.display = 'none';
  }
  function applyBranding() {
    var c = cfg();
    if (!logoPath()) return;
    var st = document.createElement('style');
    st.textContent =
      '@keyframes tdLogoGlow{' +
        '0%,100%{filter:drop-shadow(0 0 6px rgba(77,163,255,.55)) drop-shadow(0 0 16px rgba(244,131,31,.25));transform:translateY(0) scale(1)}' +
        '50%{filter:drop-shadow(0 0 16px rgba(77,163,255,.95)) drop-shadow(0 0 34px rgba(244,131,31,.55));transform:translateY(-4px) scale(1.05)}}' +
      '@keyframes tdLogoGlowSm{' +
        '0%,100%{filter:drop-shadow(0 0 4px rgba(77,163,255,.5)) drop-shadow(0 0 8px rgba(244,131,31,.25))}' +
        '50%{filter:drop-shadow(0 0 10px rgba(77,163,255,.95)) drop-shadow(0 0 18px rgba(244,131,31,.5))}}' +
      '.td-glow-logo{display:block;width:auto;flex-shrink:0}' +
      '.td-glow-logo.hero{height:96px;max-width:260px;margin:0 auto 16px;animation:tdLogoGlow 3s ease-in-out infinite}' +
      '.td-glow-logo.head{height:42px;max-width:90px;animation:tdLogoGlowSm 2.6s ease-in-out infinite}' +
      '@media (prefers-reduced-motion:reduce){.td-glow-logo,.brand-logo img{animation:none!important}}' +
      '.brand-logo{display:inline-flex;align-items:center;justify-content:center;background:transparent;padding:0 6px;flex-shrink:0}' +
      '.brand-logo img{height:34px;width:auto;max-width:160px;display:block;animation:tdLogoGlowSm 2.6s ease-in-out infinite}' +
      '.brand-logo.foot{margin:0 auto 8px}' +
      '.brand-logo.foot img{height:26px}' +
      '.brand-logo.intro{margin-bottom:20px}' +
      '.brand-logo.intro img{height:64px;max-width:240px}' +
      '.top-bar .brand-logo{margin-right:6px}';
    document.head.appendChild(st);

    var ic = document.querySelector('link[rel~="icon"]');
    if (!ic) { ic = document.createElement('link'); ic.rel = 'icon'; document.head.appendChild(ic); }
    ic.href = logoPath();

    var tb = document.querySelector('.top-bar');
    if (tb) tb.insertBefore(logoEl(''), tb.firstChild);

    document.querySelectorAll('.home-hero .shield').forEach(function (s) { swapForLogo(s, 'hero'); });
    document.querySelectorAll('.header-icon').forEach(function (h) {
      if ((h.textContent || '').indexOf('\uD83D\uDEE1') !== -1) swapForLogo(h, 'head');
    });

    var intro = document.getElementById('introScreen');
    if (intro) intro.insertBefore(logoEl('intro'), intro.firstChild);

    document.querySelectorAll('footer').forEach(function (f) {
      f.insertBefore(logoEl('foot'), f.firstChild);
      if (c.COMPANY_NAME) f.appendChild(document.createTextNode(' \u00A0|\u00A0 ' + c.COMPANY_NAME));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyBranding);
  else applyBranding();

  return {
    getUser: getUser, setUser: setUser, logout: logout, requireUser: requireUser,
    navHtml: navHtml, renderUserChip: renderUserChip,
    getProgress: getProgress, saveProgress: saveProgress, bumpEngagement: bumpEngagement,
    totalScore: totalScore, awarenessLabel: awarenessLabel,
    publishScore: publishScore, syncProgressRemote: syncProgressRemote,
    fetchLeaderboard: fetchLeaderboard, getLocalBoard: getLocalBoard, isOnlineBoard: isOnlineBoard,
    submitFeedback: submitFeedback, toast: toast
  };
})();