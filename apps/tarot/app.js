/* ============================================================
 * 塔罗小馆 · 交互逻辑（app.js）
 * - 每日免费两次抽牌（localStorage 记账），随喜添灯当日全开
 * - 单张/三张过去现在未来/三张心里的结 三种牌阵
 * - 逆位牌白话解读、串讲小结、结缘留灯（微信 luyu11888）
 * 纯静态、零依赖；数据见 data.js；可放卡图 tarot-cards/{k}.png 自动显示
 * ============================================================ */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- 店铺配置 ---------- */
  var SHOP = TAROT_META || { shop: '塔罗小馆', wx: 'luyu11888' };
  var WX = SHOP.wx || 'luyu11888';
  var DAILY_FREE = 2;              // 每日免费抽牌次数
  var QUOTA_KEY = 'tarot_quota_v1';
  var DEEPX = (typeof DEEP !== 'undefined' && DEEP) ? DEEP : {};   // 细读详解+身边小例子（见 data.js 底部）
  var IMG_DIR = 'tarot-cards/';    // 可放 {name_short}.png 卡图；不放则用 CSS 牌面
  var REV_RATE = 0.36;             // 出逆位的大致概率（像真实洗牌，凭手感）

  /* ---------- 牌阵定义 ---------- */
  var SPREADS = {
    one: {
      name: '单张 · 心里有数',
      n: 1,
      tip: '心里只想一件事，默念一句“行不行 / 该不该 / 几时成”，牌会给你一个方向的交底。适合问小事，快而直接。',
      slots: [{ pos: '此 刻', hint: '就你问的这件事，先交个底' }]
    },
    three: {
      name: '三张 · 过去现在未来',
      n: 3,
      tip: '一张管过去（这事怎么来的）、一张管现在（卡在哪）、一张管以后（往哪走）。适合把一件事从头看明白。',
      slots: [
        { pos: '过 去', hint: '这件事是怎么走到今天的' },
        { pos: '现 在', hint: '你此刻正卡在哪个节骨眼' },
        { pos: '未 来', hint: '照现在的劲头，会走向哪里' }
      ]
    },
    knot: {
      name: '三张 · 心里的结',
      n: 3,
      tip: '一张照“结”（最卡你的一环）、一张照“盲”（你没看清的）、一张照“路”（破局方向）。专治绕不开的疙瘩。',
      slots: [
        { pos: '结', hint: '这事最卡你的是哪一环' },
        { pos: '盲', hint: '你还不想看、没看清的那一面' },
        { pos: '路', hint: '要解开它，该往哪个方向走' }
      ]
    }
  };

  var AREA_LABEL = { all: '你心里那件事', love: '姻缘感情', career: '事业前程', study: '学业考试', money: '钱财进账' };
  var AREA_TIP = {
    all: '不用特意对号入座——哪句话让你心里咯噔一下，哪句就是你最近要修的功课。',
    love: '问感情，别只盯着“甜不甜”，多听牌里的“谁进谁退、近还是远”——那才是真章。',
    career: '问工作前程，多听牌里的“该守还是该冲、火候到没到”——机会好也要会接。',
    study: '问学业考试，多听牌里的“底子稳不稳、心静不静”——方法对了，功夫不白费。',
    money: '问钱财生意，多听牌里的“种子种没种、根扎得稳不稳”——别贪快钱，先看长远。'
  };

  var SUIT_INFO = { 权杖: '火 · 行动闯劲', 圣杯: '水 · 情意人心', 宝剑: '风 · 想法口舌', 星币: '土 · 钱财日子' };

  /* ---------- 每日次数（免费两次 · 随喜当日全开） ---------- */
  function todayKey() {
    var d = new Date(), m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }
  function quota() {
    var s = { date: todayKey(), free: 0, paid: false };
    try {
      var x = JSON.parse(localStorage.getItem(QUOTA_KEY) || '{}');
      if (x && x.date === s.date) { s.free = +x.free || 0; s.paid = !!x.paid; }
    } catch (e) {}
    return s;
  }
  function saveQuota(q) { try { localStorage.setItem(QUOTA_KEY, JSON.stringify(q)); } catch (e) {} }

  function refreshDaily() {
    var q = quota(), t = $('quotaTick'), f = $('freeNote');
    var txt;
    if (q.paid) { txt = '已随喜添灯 · 今日抽牌全开，随意问'; t.className = 'quota ok'; }
    else if (q.free >= DAILY_FREE) { txt = '今日两次免费之缘已尽 · 添一盏灯，今日全开'; t.className = 'quota'; }
    else { txt = '今日免费抽牌 · 尚余 <b>' + (DAILY_FREE - q.free) + '</b> 次'; t.className = 'quota'; }
    t.innerHTML = txt;
    if (f) f.innerHTML = q.paid
      ? '已随喜 · 想抽几次抽几次，不用省'
      : '今日免费 <b>' + Math.max(0, DAILY_FREE - q.free) + '</b> / ' + DAILY_FREE + ' 次';
  }

  /* ---------- 页面状态 ---------- */
  var area = 'all';
  var spreadId = 'three';
  var busy = false;

  /* ---------- 第一步：问什么 ---------- */
  var chipBtns = $('askChips').querySelectorAll('.chip');
  for (var i = 0; i < chipBtns.length; i++) {
    chipBtns[i].addEventListener('click', function () {
      for (var j = 0; j < chipBtns.length; j++) chipBtns[j].classList.remove('on');
      this.classList.add('on');
      area = this.getAttribute('data-k');
    });
  }

  /* ---------- 第二步：选牌阵 ---------- */
  var spdBtns = $('spreads').querySelectorAll('.spd');
  for (var k = 0; k < spdBtns.length; k++) {
    spdBtns[k].addEventListener('click', function () {
      for (var j = 0; j < spdBtns.length; j++) spdBtns[j].classList.remove('on');
      this.classList.add('on');
      spreadId = this.getAttribute('data-id');
      renderSpreadNote();
    });
  }
  function renderSpreadNote() {
    var s = SPREADS[spreadId];
    var ph = s.slots.map(function (x) { return x.pos.replace(/\s/g, ''); }).join(' → ');
    $('spreadNote').innerHTML = '<b>' + esc(s.name) + '：</b>' + esc(s.tip)
      + '<div class="spread-note-mini">牌的次序：' + esc(ph) + '</div>';
  }

  /* ---------- 抽牌（无放回） ---------- */
  function pickCards(n) {
    var pool = CARDS.slice();
    var out = [];
    while (out.length < n && pool.length) {
      var idx = Math.floor(Math.random() * pool.length);
      out.push({ card: pool[idx], rev: Math.random() < REV_RATE });
      pool.splice(idx, 1);
    }
    return out;
  }

  /* 一句话摘要：取白话第一句，避免和全文重复太多 */
  function lead(txt) {
    var t = String(txt || '');
    var i = t.search(/[。；]/);
    return (i >= 0 ? t.slice(0, i + 1) : t);
  }

  /* 卡图探测缓存 */
  var imgOk = {}, imgTry = {};

  function suitLine(card) {
    if (card.ct === 'major') return '大 阿 卡 纳';
    return card.s + ' · ' + (SUIT_INFO[card.s] || '');
  }

  /* ---------- 单张牌面（纯 CSS，可被卡图替换） ---------- */
  function pcardHTML(item, idx) {
    var c = item.card;
    var isM = c.a === 'M';
    var rev = item.rev;
    var eyebrow = isM ? 'MAJOR · 大 秘 仪' : (c.s + (c.ct === 'court' ? ' · 宫 廷' : ' · ' + c.disp));
    var html = '<div class="slot" style="animation-delay:' + (idx * 130) + 'ms">';
    html += '<div class="pcard ' + (isM ? 'pc-major' : 'pc-minor') + (rev ? ' rev' : '') + '" id="pc' + idx + '">';
    html += '<div class="pc-eyebrow">' + esc(eyebrow) + '</div>';
    html += '<div class="pc-frame"></div>';
    if (rev) html += '<div class="rev-flag">逆 · 反过来读</div>';
    html += '<div class="pc-core">';
    html += '<div class="pc-glyph">' + esc(c.disp) + '</div>';
    html += '<div class="pc-name">' + esc(c.nm) + '</div>';
    html += '<div class="pc-en">' + esc(c.en) + '</div>';
    html += '<div class="pc-suit">' + esc(suitLine(c)) + '</div>';
    html += '</div></div>';
    html += '<div class="p-kw' + (rev ? ' rev' : '') + '"><span>' + esc(rev ? c.kwR : c.kwU) + '</span></div>';
    html += '<div class="p-txt' + (rev ? ' rev' : '') + '"><span class="lbl">' + (rev ? '逆位白话 · ' : '正位白话 · ')
      + '</span>' + esc(rev ? c.re : c.up) + '</div>';
    html += '</div>';
    return html;
  }

  /* ---------- 展示结果 ---------- */
  function buildResult(items) {
    var sp = SPREADS[spreadId];
    var qText = ($('askLine').value || '').trim();
    var top = '<div class="head-band">';
    top += '<div class="hb1">' + esc(sp.name) + '</div>';
    top += '<div class="hb2">问的是 <span class="q">' + esc(AREA_LABEL[area] || AREA_LABEL.all)
      + '</span>' + (qText ? ' · “' + esc(qText) + '”' : '')
      + '　' + esc(AREA_TIP[area] || AREA_TIP.all) + '</div></div>';
    $('resultTop').innerHTML = top;

    var slotsHtml = '<div class="slots">';
    for (var i = 0; i < items.length; i++) {
      var sl = sp.slots[i] || { pos: '', hint: '' };
      slotsHtml += '<div class="slot-wrap" id="sw' + i + '">';
      slotsHtml += '<div class="slot-head"><span class="pos">' + esc(sl.pos) + '</span><span class="hint">'
        + esc(sl.hint) + '</span></div>';
      slotsHtml += pcardHTML(items[i], i);
      slotsHtml += detailHTML(items[i], i);
      slotsHtml += '</div>';
    }
    slotsHtml += '</div>';

    /* 串讲小结 */
    var summary = '<div class="summary"><div class="s-title">✦ 白 话 串 讲</div>';
    if (items.length === 1) {
      var a0 = items[0];
      summary += '<p>这一卦，牌想让你先明白这句话：<b>「' + esc(a0.card.nm) + (a0.rev ? ' · 逆' : '')
        + '」——' + esc(lead(a0.rev ? a0.card.re : a0.card.up)) + '</b>。'
        + '不用急着问“是吉是凶”——塔罗不讲那个。它只告诉你此刻的劲该往哪使，剩下的路，还得你一步步走。</p>';
    } else {
      summary += '<p><b>串起来看：</b>';
      for (var j = 0; j < items.length; j++) {
        var a = items[j];
        summary += '<br>' + (j + 1) + '. 抽到「' + esc(a.card.nm) + (a.rev ? ' · 逆' : '')
          + '」（' + esc((sp.slots[j] || { pos: '' }).pos.replace(/\s/g, '')) + '位）：' + esc(lead(a.rev ? a.card.re : a.card.up));
      }
      summary += '</p>';
      var focus = pickFocus(items);
      summary += '<p>三张里，<b>「' + esc(focus.card.nm) + (focus.rev ? ' · 逆位' : '')
        + '」</b>最值得你再品一遍——它说的不是吓唬你的话，是这一局里你最该下手的那一处。</p>';
    }
    summary += '</div>';

    /* 心法 */
    var heart = '<div class="heart"><b>一句大白话心法：</b>牌是镜子，不是判官。它照出的是你此刻的处境和劲头——'
      + '顺的牌别飘，逆的牌别慌，哪句话扎了心，就从哪句改起。' + esc(AREA_LABEL[area]) + '这局，愿你抽完，心里透亮一寸。</div>';

    /* 结缘 */
    var consult =
      '<div class="consult"><div class="c-head">✦ 想再问细一点？老师亲自解</div>' +
      '牌能照轮廓，照不出细处：几时见分晓、对方真心里怎么想、这事该怎么落地……想再往下问，可加店主微信 <b>' + esc(WX) + '</b>，随缘打赏、坐堂细解，备注「塔罗小馆」即可。' +
      '<div class="wx-qr-wrap"><img class="wx-qr" src="wechat-qrcode.png" alt="微信二维码 · ' + esc(WX) + '" title="扫码添加：' + esc(WX) + '"></div>' +
      '<div class="wx-row"><button class="wx-badge" id="btnWx">＋ 复制微信号：' + esc(WX) + '</button><span id="wxTip"></span></div>' +
      '<div class="pay-row"><button class="btn btn-gold btn-lamp" id="btnLamp">✦ 随 喜 添 灯 · 养 小 馆</button></div></div>';

    var brief = '';
    try {
      if (typeof TarotSummary !== 'undefined' && TarotSummary && TarotSummary.html) {
        brief = TarotSummary.html(items, area, sp);
      }
    } catch (e) { brief = ''; }

    var inner = brief + slotsHtml + summary + heart + consult;
    $('resultInner').innerHTML = inner;
    bindDeep(items.length);

    /* 每张牌的卡图探测：存在则盖到 css 牌面上 */
    for (var m = 0; m < items.length; m++) tryImg(items[m].card.k, m);

    var wx = $('btnWx');
    if (wx) wx.addEventListener('click', function () {
      var ok = function () { wx.innerHTML = '已复制 ✓ 去微信粘贴添加'; $('wxTip').innerHTML = '备注「塔罗小馆」即可'; };
      copyAny(WX, ok);
    });
    var lamp = $('btnLamp');
    if (lamp) lamp.addEventListener('click', function () { openPay(false); });
    bindShareItems();

    $('resultArea').classList.add('show');
    $('resultArea').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- 细读这一张：按你所问拆开讲 + 身边小例子 ---------- */
  function deepHot(area) {
    return (area === 'love') ? 0 : (area === 'career') ? 1 : (area === 'money') ? 2 : 3;
  }
  function detailHTML(item, idx) {
    var c = item.card;
    var d = DEEPX[c.k];
    if (!d) return '';
    var rows = [
      ['love', '姻 缘', d.love],
      ['career', '事 业', d.career],
      ['money', '钱 财', d.money],
      ['other', '其 他', d.other]
    ];
    var hot = deepHot(area);
    var html = '<div class="p-deep">';
    html += '<div class="deep-bar" id="db' + idx + '"><span>◍ 细 读 这 一 张</span><span class="db-arr">▶ 展开细看</span></div>';
    html += '<div class="deep-body" id="dbB' + idx + '">';
    if (d.img) html += '<div class="deep-pic"><b>牌面上画着——</b>' + esc(d.img) + '</div>';
    html += '<div class="deep-qa">';
    for (var i = 0; i < rows.length; i++) {
      if (!rows[i][2]) continue;
      html += '<div class="qa-row' + (i === hot ? ' hot' : '') + '"><span class="qa-tag">' + rows[i][1]
        + '</span><span class="qa-tx">' + esc(rows[i][2]) + '</span></div>';
    }
    html += '</div>';
    if (item.rev && d.rev) html += '<div class="deep-rev"><b>逆着读这张牌 · </b>' + esc(d.rev) + '</div>';
    if (d.case) html += '<div class="deep-case"><b>把它用到你身上 · 身边的例子：</b>' + esc(d.case) + '</div>';
    html += '</div></div>';
    return html;
  }
  function bindDeep(n) {
    for (var i = 0; i < n; i++) (function (idx) {
      var bar = $('db' + idx), body = $('dbB' + idx);
      if (!bar || !body) return;
      bar.addEventListener('click', function () {
        var open = bar.parentElement.classList.toggle('open');
        bar.querySelector('.db-arr').textContent = open ? '▼ 收起' : '▶ 展开细看';
      });
    })(i);
  }

  function pickFocus(items) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].card.ct === 'major') return items[i];
    }
    return items[items.length - 1] || items[0];
  }

  function tryImg(key, idx) {
    if (imgTry[key]) { if (imgOk[key]) applyImg(key, idx); return; }
    imgTry[key] = true;
    var im = new Image();
    im.onload = function () { imgOk[key] = true; applyImg(key, idx); };
    im.onerror = function () { imgOk[key] = false; };
    im.src = IMG_DIR + key + '.png';
  }
  function applyImg(key, idx) {
    var pc = $('pc' + idx);
    if (!pc || pc.querySelector('img')) return;
    var im = document.createElement('img');
    im.alt = '';
    im.src = IMG_DIR + key + '.png';
    pc.appendChild(im);
    pc.classList.add('has-img');
  }

  /* ---------- 抽牌主流程 ---------- */
  function performCast() {
    busy = true;
    $('resultArea').classList.remove('show');
    $('casting').classList.add('show');
    $('casting').scrollIntoView({ behavior: 'smooth', block: 'center' });
    var sp = SPREADS[spreadId];
    setTimeout(function () {
      var items = pickCards(sp.n);
      $('casting').classList.remove('show');
      buildResult(items);
      busy = false;
    }, 1900);
  }

  function tryCast() {
    if (busy) return;
    var q = quota();
    if (q.paid) { consume(q); return; }
    if (q.free >= DAILY_FREE) { openPay(true); return; }
    consume(q);
  }
  function consume(q) {
    q.free++; saveQuota(q);
    refreshDaily();
    performCast();
  }

  /* ---------- 随喜添灯 ---------- */
  var wantCast = false;
  var payImgChecked = false;
  function openPay(need) {
    wantCast = !!need;
    $('payTitle').innerHTML = need ? '今 日 卦 缘 已 满' : '随 喜 添 灯';
    $('paySub').innerHTML = need ? '每日两次免费之缘已尽 · 随喜一盏灯，今日全开' : '君之垂顾，小馆感念于心。';
    $('payMsg').innerHTML = need
      ? '若这一卦确实想问，请<b>随喜添一盏灯</b>——一灯照夜，不仅这卦放行，<b>今日之内想抽几次都放行</b>；明日此时，免费之缘复满。'
      : '若蒙君随喜添灯，小馆的灯便亮一盏，心存感激；若今日不必，合上即去，来去自在，两不相欠。';
    $('payDone').innerHTML = need ? '我 已 随 喜 · 马 上 抽 牌' : '已 随 喜 · 感 君 厚 意';
    $('payLater').innerHTML = need ? '明 日 再 来' : '合 上（不 必 破 费）';
    $('payOverlay').classList.add('show');
    if (!payImgChecked) {
      payImgChecked = true;
      var im = new Image();
      im.onload = function () {};
      im.onerror = function () { var h = $('payQrMain'); if (h) h.classList.add('missing'); };
      im.src = 'wechat-pay.png';
      setTimeout(function () {
        if (!im.complete || im.naturalWidth === 0) { var h2 = $('payQrMain'); if (h2) h2.classList.add('missing'); }
      }, 3000);
    }
  }
  function closePay() { $('payOverlay').classList.remove('show'); }
  $('payClose').addEventListener('click', closePay);
  $('payLater').addEventListener('click', closePay);
  $('payDone').addEventListener('click', function () {
    var q = quota();
    q.paid = true; saveQuota(q);
    closePay(); refreshDaily();
    if (wantCast) { wantCast = false; performCast(); }
  });

  /* ---------- 剪贴板 ---------- */
  function copyAny(text, ok) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok || function () {}, function () { legacyCopy(text, ok); });
    } else legacyCopy(text, ok);
  }
  function legacyCopy(text, ok) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    if (ok) ok();
  }

  /* ---------- 分享 ---------- */
  var shareUrl = (location.protocol === 'file:')
    ? location.href.split(/[?#]/)[0]
    : location.origin + location.pathname;
  var shareTexts = {
    friend: '塔罗小馆 · 每天免费抽两次\n心里有事想不通？抽张塔罗换个角度看看——不讲天机、不吓唬人，全是听得懂的白话，还教你怎么做。点开就测：\n' + shareUrl,
    circle: '塔罗小馆\n想不通的事，交给牌照一照；顺的别飘，逆的别慌，心法在脚下。\n每日两次免费抽牌，点开即测：\n' + shareUrl
  };
  var _ct = null;
  function flashCopy() { var b = $('shareCopy'); b.innerHTML = '已 复 制 ✓'; clearTimeout(_ct); _ct = setTimeout(function () { b.innerHTML = '复 制 · 去 分 享'; }, 1600); }
  function pickShare(kind, auto) {
    var isF = kind === 'friend';
    $('shareCardF').classList.toggle('on', isF);
    $('shareCardC').classList.toggle('on', !isF);
    $('shareText').value = shareTexts[kind];
    $('shareGuide').innerHTML = isF
      ? '已备好「分享给好友」的话。点微信右上角 <b>···</b> → 「发送给朋友」，粘贴发送即可。'
      : '已备好「朋友圈」文案。点右上角 <b>···</b> → 「分享到朋友圈」，粘贴发布。';
    if (auto) copyAny(shareTexts[kind], flashCopy);
  }
  function bindShareItems() {
    var fab = $('shareFab');
    fab.onclick = function () { pickShare('friend', false); $('shareOverlay').classList.add('show'); };
    $('shareCardF').onclick = function () { pickShare('friend', true); };
    $('shareCardC').onclick = function () { pickShare('circle', true); };
    $('shareClose').onclick = closeShare;
    $('shareCancel').onclick = closeShare;
    $('shareCopy').onclick = function () { copyAny($('shareText').value, flashCopy); };
    var sys = $('shareSys');
    if (navigator.share) {
      sys.style.display = '';
      sys.onclick = function () {
        navigator.share({ title: '塔罗小馆', text: $('shareText').value, url: shareUrl }).catch(function () {});
      };
    }
  }
  function closeShare() { $('shareOverlay').classList.remove('show'); }

  /* ---------- 开牌按钮 ---------- */
  $('btnCast').addEventListener('click', tryCast);
  $('askLine').addEventListener('keydown', function (e) { if (e.key === 'Enter') tryCast(); });

  /* ---------- 调试/直达参数（便于预览与客服发牌） ---------- */
  function seedFromURL() {
    var p = new URLSearchParams(location.search);
    var c = (p.get('c') || '').split(',').filter(Boolean);
    if (!c.length) return;
    var r = (p.get('r') || '').split(',').filter(Boolean);
    if (p.get('s')) spreadId = p.get('s');
    if (p.get('a')) { area = p.get('a'); for (var i = 0; i < chipBtns.length; i++) {
      chipBtns[i].classList.toggle('on', chipBtns[i].getAttribute('data-k') === area); } }
    if (p.get('q')) $('askLine').value = p.get('q');
    renderSpreadNote();
    var items = [];
    for (var j = 0; j < c.length; j++) {
      var card = null;
      for (var x = 0; x < CARDS.length; x++) if (CARDS[x].k === c[j]) { card = CARDS[x]; break; }
      if (!card) return;
      items.push({ card: card, rev: (r[j] || '0') === '1' });
    }
    buildResult(items);
  }

  /* ---------- 启动 ---------- */
  renderSpreadNote();
  refreshDaily();
  bindShareItems();
  seedFromURL();
})();
