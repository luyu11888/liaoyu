/* ============================================================
 * app.js 页面交互层（农历联动 / Tab / 单盘与合盘入口）
 * 依赖加载顺序：lunar.js → data.js → bazi.js → hepan.js → app.js
 * ============================================================ */
function $(id) { return document.getElementById(id); }

/* ---------- 中文日期词 ---------- */
var CN_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
var CN_MON = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
function cnMonName(n) { return (CN_MON[n - 1] || n) + '月'; }
function cnDay(n) {
  if (n === 10) return '初十';
  if (n === 20) return '二十';
  if (n === 30) return '三十';
  if (n < 10) return '初' + CN_NUM[n];
  var t = Math.floor(n / 10) * 10;
  if (t === 10) return '十' + CN_NUM[n - 10];
  if (t === 20) return '廿' + CN_NUM[n - 20];
  return String(n);
}

/* 控件 id 前缀：单盘用 'in'，合盘甲乙用 'a'、'b' */
function pid(scope, name) { return (scope === '' ? 'in' : scope) + '-' + name; }

/* ---------- 时分秒下拉 ---------- */
function fillRange(sel, lo, hi, labelFn, def) {
  sel.innerHTML = '';
  for (var i = lo; i <= hi; i++) {
    var o = document.createElement('option');
    o.value = i;
    o.text = labelFn ? labelFn(i) : String(i);
    sel.appendChild(o);
  }
  if (typeof def !== 'undefined' && def !== null) sel.value = def;
}
function initHM(scope, hDef, mDef) {
  fillRange($(pid(scope, 'h')), 0, 23, null, hDef);
  fillRange($(pid(scope, 'min')), 0, 59, function (x) { return (x < 10 ? '0' : '') + x; }, mDef);
}
function onUnknownTime(scope, checked) {
  var h = $(pid(scope, 'h')), mi = $(pid(scope, 'min')), cb = $(pid(scope, 'unknown'));
  if (checked) {
    if (h.dataset.prevH === undefined) h.dataset.prevH = h.value;
    if (mi.dataset.prevM === undefined) mi.dataset.prevM = mi.value;
    h.value = 12; mi.value = 0;
    h.disabled = mi.disabled = true;
  } else {
    if (h.dataset.prevH !== undefined) { h.value = h.dataset.prevH; mi.value = mi.dataset.prevM; }
    h.disabled = mi.disabled = false;
  }
}

/* ---------- 公历 ⇄ 农历 联动 ---------- */
function buildLunarControls(scope, hostId) {
  var host = $(hostId);
  if (!host) return;
  host.innerHTML =
    '<select id="' + pid(scope, 'ly') + '" class="lunar-y"></select>' +
    '<select id="' + pid(scope, 'lm') + '" class="lunar-m"></select>' +
    '<label class="leap-box">闰<input type="checkbox" id="' + pid(scope, 'll') + '"></label>' +
    '<select id="' + pid(scope, 'ld') + '" class="lunar-d"></select>';
  var ly = $(pid(scope, 'ly')), lm = $(pid(scope, 'lm')), ld = $(pid(scope, 'ld')), ll = $(pid(scope, 'll'));
  fillRange(ly, 1900, 2100, function (y) { return y + '年'; }, null);
  fillRange(lm, 1, 12, cnMonName, null);
  fillRange(ld, 1, 30, cnDay, null);

  function leapOk() {
    var y = +ly.value, m = +lm.value;
    try { return LunarYear.fromYear(y).getLeapMonth() === m; } catch (e) { return false; }
  }
  function refreshLeap() {
    var ok = leapOk();
    ll.disabled = !ok;
    if (!ok) ll.checked = false;
  }
  function dayMax() {
    var y = +ly.value, m = +lm.value;
    var mm = ll.checked ? -m : m;
    try { return LunarMonth.fromYm(y, mm).getDayCount(); } catch (e) { return 30; }
  }
  function rebuildDays(keepVal) {
    var max = dayMax();
    var cur = +ld.value;
    fillRange(ld, 1, max, cnDay, Math.min(cur, max));
  }
  function syncLunarFromSolar() {
    var dv = $(pid(scope, 'date')).value;
    if (!dv) return;
    var sp = dv.split('-');
    var solar = Solar.fromYmdHms(+sp[0], +sp[1], +sp[2], 12, 0, 0);
    var lu = solar.getLunar();
    ly.value = lu.getYear();
    lm.value = Math.abs(lu.getMonth());
    ll.checked = lu.getMonth() < 0;
    refreshLeap();
    rebuildDays();
    ld.value = lu.getDay();
  }
  function syncSolarFromLunar() {
    refreshLeap();
    rebuildDays();
    var y = +ly.value, m = +lm.value;
    var mm = ll.checked ? -m : m;
    var d = +ld.value;
    if (!y || !m || !d) return;
    try {
      var solar = Lunar.fromYmd(y, mm, d).getSolar();
      var out = $(pid(scope, 'date'));
      out.value = solar.toYmd();
    } catch (e) {
      alert('该农历日期超出历法支持范围（农历 1900–2100），已按原值保留。');
    }
  }

  $(pid(scope, 'date')).addEventListener('change', syncLunarFromSolar);
  ly.addEventListener('change', function () { syncSolarFromLunar(); syncLunarFromSolar(); });
  lm.addEventListener('change', function () { syncSolarFromLunar(); syncLunarFromSolar(); });
  ll.addEventListener('change', function () { syncSolarFromLunar(); syncLunarFromSolar(); });
  ld.addEventListener('change', syncSolarFromLunar);
  syncLunarFromSolar();
}
function setSolarAndSync(scope, val) {
  $(pid(scope, 'date')).value = val;
  if ($(pid(scope, 'ly'))) {
    var sp = val.split('-');
    var lu = Solar.fromYmdHms(+sp[0], +sp[1], +sp[2], 12, 0, 0).getLunar();
    $(pid(scope, 'ly')).value = lu.getYear();
    $(pid(scope, 'lm')).value = Math.abs(lu.getMonth());
    $(pid(scope, 'll')).checked = lu.getMonth() < 0;
    /* 触发同步重建天选项 */
    if (document.createEvent) {
      var ev = document.createEvent('Event');
      ev.initEvent('change', true, true);
      $(pid(scope, 'lm')).dispatchEvent(ev);
    }
  }
}

/* ---------- 读取输入 ---------- */
function readPicker(scope) {
  var dateEl = $(pid(scope, 'date'));
  var val = dateEl ? dateEl.value : '';
  var parts = String(val).split('-');
  var y = +parts[0], m = +parts[1], d = +parts[2];
  if (!y || !m || !d) { alert('请选好出生日期。'); return null; }
  var hEl = $(pid(scope, 'h')), miEl = $(pid(scope, 'min'));
  var h = hEl && !hEl.disabled ? +hEl.value : 12;
  var min = miEl && !miEl.disabled ? +miEl.value : 0;
  return { y: y, m: m, d: d, h: (isNaN(h) ? 12 : h), min: (isNaN(min) ? 0 : min) };
}

function readSexSect(scope) {
  var sexQ = 'input[name=' + (scope === '' ? 'sex' : scope + '-sex') + ']:checked';
  var sectQ = 'input[name=' + (scope === '' ? 'sect' : scope + '-sect') + ']:checked';
  var sexEl = document.querySelector(sexQ);
  var sectEl = document.querySelector(sectQ);
  return { sex: sexEl && sexEl.value === '1' ? 1 : 0, sect: sectEl && sectEl.value === '1' ? 1 : 2 };
}

function doCalcOne(scope) {
  var o = readPicker(scope);
  if (!o) return null;
  var ss = readSexSect(scope);
  o.sex = ss.sex; o.sect = ss.sect;
  optsSex = o.sex;
  try { return calcBazi(o); }
  catch (e) { alert('日期超出历法支持范围（建议公历 1900–2100 之间）或输入有误。'); return null; }
}

function showIn(elId) {
  var el = $(elId);
  if (!el) return;
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- 单盘 ---------- */
function onCalc() {
  var r = doCalcOne('');
  if (!r) return;
  var tEl = $('in-topic');
  r.topic = tEl ? tEl.value : 'overall';
  var box = $('report');
  box.innerHTML = renderReport(r);
  box.classList.add('show');
  showIn('report');
}
/* ---------- 合盘 ---------- */
function onCalcHP() {
  var rA = doCalcOne('a');
  if (!rA) return;
  var rB = doCalcOne('b');
  if (!rB) return;
  var box = $('hpreport');
  var head = '';
  try {
    if (typeof BZSummary !== 'undefined' && BZSummary && BZSummary.hepanHTML) {
      head += BZSummary.hepanHTML(calcHePan(rA, rB));
    }
  } catch (e) { /* 容错 */ }
  box.innerHTML = head + renderHePan(rA, rB);
  box.classList.add('show');
  showIn('hpreport');
}

/* ---------- 快捷按钮 ---------- */
function setToday() {
  var d = new Date();
  function p2(x) { return (x < 10 ? '0' : '') + x; }
  setSolarAndSync('', d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()));
  var cb = $('in-unknown');
  if (cb && cb.checked) cb.checked = false, onUnknownTime('', false);
  $('in-h').value = d.getHours();
  $('in-min').value = d.getMinutes();
}
function setSample() {
  setSolarAndSync('', '1995-08-08');
  var cb = $('in-unknown');
  if (cb && cb.checked) cb.checked = false, onUnknownTime('', false);
  $('in-h').value = 8;
  $('in-min').value = 30;
  var r = document.querySelector('input[name=sex][value="0"]'); if (r) r.checked = true;
  onCalc();
}

/* ---------- Tab ---------- */
function switchTab(name) {
  var show = name === 'single' ? 'sec-single' : 'sec-hepan';
  var hide = name === 'single' ? 'sec-hepan' : 'sec-single';
  $(hide).style.display = 'none';
  $(show).style.display = 'block';
  var btns = document.querySelectorAll('.tab-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('on', btns[i].getAttribute('data-tab') === name);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- 初始化 ---------- */
function initApp() {
  /* 店名与标题 */
  var n = $('shopName');
  if (n && SHOP && SHOP.name) n.textContent = SHOP.name;
  document.title = (SHOP && SHOP.title ? SHOP.title : '') + ' · ' + (SHOP && SHOP.name ? SHOP.name : '');

  /* 想问的事 */
  var tp = $('in-topic');
  if (tp && typeof BZSummary !== 'undefined' && BZSummary && BZSummary.TOPICS) {
    tp.innerHTML = BZSummary.TOPICS.map(function (t) { return '<option value="' + t.k + '">' + t.n + '</option>'; }).join('');
    tp.value = 'overall';
  }

  /* 单盘 */
  initHM('', 8, 30);
  buildLunarControls('', 'in-lunar');
  $('in-unknown').addEventListener('change', function () { onUnknownTime('', this.checked); });

  /* 合盘 A / B */
  initHM('a', 8, 30);
  initHM('b', 12, 0);
  buildLunarControls('a', 'a-lunar');
  buildLunarControls('b', 'b-lunar');
  $('a-unknown').addEventListener('change', function () { onUnknownTime('a', this.checked); });
  $('b-unknown').addEventListener('change', function () { onUnknownTime('b', this.checked); });

  var tabs = document.querySelectorAll('.tab-btn');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () { switchTab(this.getAttribute('data-tab')); });
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
