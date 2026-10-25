/* 大六壬 · 界面渲染与交互 */
(function () {
  'use strict';
  const D = window.LR, LR = window.LiuRen;
  const $ = function (id) { return document.getElementById(id); };
  // 传统盘式排布：巳午未申 / 辰·酉 / 卯·戌 / 寅丑子亥
  const PAN_ORDER = ['巳', '午', '未', '申', '辰', '', '', '酉', '卯', '', '', '戌', '寅', '丑', '子', '亥'];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function init() {
    const now = new Date();
    $('in-date').value = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());

    let sc = '';
    ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].forEach(function (z) {
      sc += '<option value="' + z + '">' + z + '时（' + LR.SHICHEN_TIME[z] + '）</option>';
    });
    $('in-shichen').innerHTML = sc;
    $('in-shichen').value = LR.hourToZhi(now.getHours());

    let q = '';
    Object.keys(D.LEI_SHEN).forEach(function (k) { q += '<option value="' + k + '">' + k + '</option>'; });
    $('in-question').innerHTML = q;

    let yj = '';
    ['亥', '戌', '酉', '申', '未', '午', '巳', '辰', '卯', '寅', '丑', '子'].forEach(function (z) {
      yj += '<option value="' + z + '">' + z + '将 · ' + D.YUE_JIANG[z].name + '</option>';
    });
    $('in-yuejiang').innerHTML += yj;

    $('btn-pai').onclick = function () { run(false); };
    $('btn-now').onclick = function () {
      const n = new Date();
      $('in-date').value = n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate());
      $('in-shichen').value = LR.hourToZhi(n.getHours());
      run(false);
    };
    $('btn-sample').onclick = function () {
      const y = 1980 + Math.floor(Math.random() * 60);
      const m = 1 + Math.floor(Math.random() * 12);
      const d2 = 1 + Math.floor(Math.random() * 28);
      $('in-date').value = y + '-' + pad(m) + '-' + pad(d2);
      $('in-shichen').value = D.DZ[Math.floor(Math.random() * 12)];
      run(true);
    };
  }

  function run(showCast) {
    const dv = $('in-date').value;
    if (!dv) { alert('请先选择日期'); return; }
    const p = dv.split('-');
    const o = {
      y: +p[0], m: +p[1], d: +p[2],
      h: 12, mi: 0,
      shichen: $('in-shichen').value,
      yueJiang: $('in-yuejiang').value || null,
      question: $('in-question').value
    };
    // 时辰中间时刻，保证干支与节气判断稳定
    const hh = { '子': 23, '丑': 1, '寅': 3, '卯': 5, '辰': 7, '巳': 9, '午': 11, '未': 13, '申': 15, '酉': 17, '戌': 19, '亥': 21 }[o.shichen];
    o.h = hh; o.mi = 30;

    const casting = $('casting');
    if (showCast) {
      $('result').classList.remove('show');
      casting.classList.add('show');
      setTimeout(function () { casting.classList.remove('show'); doRender(o); }, 700);
    } else {
      doRender(o);
    }
  }

  function doRender(o) {
    let r;
    try { r = LR.paipan(o); }
    catch (e) { alert('起课失败：' + e.message); return; }
    render(r, o.question);
    $('result').classList.add('show');
    $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function render(p, question) {
    // 一句话总评（放在最上面，先看结论再看课式）
    var br = $('brief');
    if (br) {
      try {
        br.innerHTML = (typeof LRSummary !== 'undefined' && LRSummary) ? LRSummary.html(p, question) : '';
      } catch (e) { br.innerHTML = ''; }
    }

    // 概要
    $('jq-note').textContent = '（' + p.jieqi + '后换将，' + (p.isDay ? '昼占' : '夜占') + '）';
    $('basis').innerHTML = [
      ['四柱', p.yearGZ + ' 年 · ' + p.monthGZ + ' 月 · ' + p.dayGZ + ' 日 · ' + p.shiGZ + ' 时'],
      ['月将', p.yueJiang + '（' + p.yueJiangName + '）'],
      ['占时', p.shiZhi + '时（' + LR.SHICHEN_TIME[p.shiZhi] + '）'],
      ['贵人', p.guiZhi + '（' + (p.isDay ? '昼贵' : '夜贵') + '，' + (p.guiShun ? '顺行' : '逆行') + '）'],
      ['旬空', p.kongWang.join('、')],
      ['节气', p.jieqi]
    ].map(function (x) { return '<span><b>' + x[0] + '</b>' + x[1] + '</span>'; }).join('');

    // 天地盘
    const chuanZhi = p.sanChuan.map(function (c) { return c.zhi; });
    let html = '';
    PAN_ORDER.forEach(function (base) {
      if (!base) { html += '<div class="pc void"></div>'; return; }
      const i = D.DZ.indexOf(base);
      const tp = p.tianPan[i];
      const tj = p.tianJiang[i];
      let cls = 'pc';
      let tag = '';
      if (base === p.shiZhi) { cls += ' shi'; }
      if (tp === p.yueJiang) { cls += ' yj'; tag = '<span class="tagm">将</span>'; }
      if (chuanZhi.indexOf(tp) >= 0) { cls += ' chuan'; if (!tag) tag = '<span class="tagm">传</span>'; }
      if (base === p.dayZhi) cls += ' rizhi';
      html += '<div class="' + cls + '" data-base="' + base + '">' + tag +
        '<div class="tj">' + tj + '</div><div class="tp">' + tp + '</div><div class="dp">' + base + '</div></div>';
    });
    $('pan').innerHTML = html;
    $('pan-note').textContent = '（点击上方任意一格，这里会解释它的含义。当前月将' + p.yueJiang + '加于占时' + p.shiZhi + '之上，顺布十二支。）';
    Array.prototype.forEach.call($('pan').children, function (el) {
      el.onclick = function () {
        const b = el.getAttribute('data-base');
        if (!b) return;
        const i = D.DZ.indexOf(b);
        const tp = p.tianPan[i], tj = p.tianJiang[i];
        const tjInfo = D.TIAN_JIANG.filter(function (t) { return t.n === tj; })[0];
        const yj = D.YUE_JIANG[tp];
        $('pan-note').innerHTML = '<b>地盘' + b + '</b>上得天盘<b>' + tp + '</b>（' + yj.name + '，' + yj.plain + '），天将<b>' + tj +
          '</b>：' + tjInfo.xiang + '——' + tjInfo.plain +
          '。于日主为「' + p.liuQin(p.dayGan, tp) + '」，' + p.wangShuai(tp, p.monthZhi) + '，' + (p.isKong(tp) ? '落空亡（虚而不实）' : '不落空') + '。';
      };
    });

    // 四课
    $('si-ke').innerHTML = p.siKe.map(function (k) {
      const hasKe = (k.keType === 'shang' || k.keType === 'xia');
      return '<div class="ke' + (hasKe ? ' has-ke' : '') + '">' +
        '<span class="ke-tag">' + k.name + '</span>' +
        '<div class="up">' + k.up + '</div>' +
        '<div class="jia">' + k.jiang + ' · ' + k.gan + '干</div>' +
        '<div class="sub">于日为' + k.qin + (k.kong ? ' · 空' : '') + '</div>' +
        '<div class="dn">' + k.downName + '</div>' +
        '<div class="sub">' + (hasKe ? '<span class="kebadge">' + k.ke + '</span>' : k.ke) + '</div>' +
        '</div>';
    }).join('');

    // 三传
    const jxOf = function (n) { const t = D.TIAN_JIANG.filter(function (x) { return x.n === n; })[0]; return t ? t.jx : '平'; };
    $('san-chuan').innerHTML = p.sanChuan.map(function (c) {
      const jx = jxOf(c.jiang);
      const badges = ['<span class="badge ' + (jx === '吉' ? 'good' : (jx === '凶' ? 'bad' : '')) + '">' + c.jiang + '</span>',
      '<span class="badge">' + c.qin + '</span>',
      '<span class="badge ' + (c.ws === '旺' || c.ws === '相' ? 'good' : 'bad') + '">' + c.ws + '</span>',
      c.kong ? '<span class="badge bad">空亡</span>' : ''].join('');
      return '<div class="ch"><div class="pt">' + c.pos + '</div>' +
        '<div class="zhi">' + c.zhi + '</div>' +
        '<div class="jia">' + c.gan + ' · ' + c.jiang + '</div>' +
        '<div class="meta">' + D.YUE_JIANG[c.zhi].name + '｜' + D.DZ_WX[c.zhi] + '</div>' +
        '<div class="badges">' + badges + '</div></div>';
    }).join('');

    // 断课
    const d = p.duan;
    const scoreTxt = d.score >= 3 ? '偏吉 · 可以往前走' : (d.score >= 0 ? '吉凶参半 · 宜稳不宜急' : '偏凶 · 宜守不宜进');
    $('score-note').textContent = '（' + scoreTxt + '，评分 ' + d.score + '）';
    const pct = Math.max(6, Math.min(100, Math.round((d.score + 8) / 16 * 100)));
    $('duan').innerHTML =
      '<p class="sum-lead">' + d.keti + ' · ' + scoreTxt + '</p>' +
      '<p>' + d.summary + '</p>' +
      '<p>' + d.ketiPlain + '</p>' +
      '<div class="score-bar"><span>吉凶倾向</span><span class="bar"><i style="width:' + pct + '%"></i></span><span>' + d.score + '</span></div>' +
      '<div style="margin-top:10px">' + d.chuan.map(function (c) { return '<div class="line"><b>' + c.pos + '</b>' + c.text + '</div>'; }).join('') + '</div>' +
      (d.geju.length ? '<div style="margin-top:8px">' + d.geju.map(function (g) { return '<div class="line">· ' + g + '</div>'; }).join('') + '</div>' : '') +
      '<div class="line"><b>类神</b>' + d.leiShen + '</div>' +
      '<div class="line"><b>应期</b>' + d.yingqi + '</div>';

    $('kv').innerHTML =
      '<div class="box"><div class="t">宜</div><ul>' + d.yi.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
      '<div class="box"><div class="t">忌</div><ul>' + d.ji.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>';

    $('xlr').innerHTML = '<b>农历' + p.lunarMD + ' · ' + p.shiZhi + '时　→　' + p.xlr.n + '（' + p.xlr.jx + '）</b><br>' +
      p.xlr.plain + '<br><span style="color:#8a7a5a">' + p.xlr.poem + '</span>';
  }

  window.addEventListener('DOMContentLoaded', init);
})();
