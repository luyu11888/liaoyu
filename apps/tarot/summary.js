/* 塔罗牌 · 一句话总评
 * 把抽到的几张牌，收成"现在怎样 / 卡在哪 / 下一步"三行，让人一眼看懂。
 * 依赖：data_deep.js（DEEP）
 */
(function (global) {
  'use strict';

  var AREA = { all: '综合', love: '姻缘', career: '事业', study: '学业', money: '钱财' };
  var DEEP_KEY = { love: 'love', career: 'career', study: 'career', money: 'money', all: 'other' };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  /* 取一句：截到第一个句号/分号/换行，限长 */
  function lead(t, max) {
    var s = String(t || '').replace(/\s+/g, ' ');
    var m = s.match(/^[^。；;!！?？]{6,60}[。；;!！?？]?/);
    s = m ? m[0] : s.slice(0, 60);
    s = s.replace(/[。；;]+$/, '');
    max = max || 46;
    return s.length > max ? s.slice(0, max) + '…' : s;
  }

  function pickFocus(items) {
    for (var i = 0; i < items.length; i++) if (items[i].rev) return items[i];
    for (var j = 0; j < items.length; j++) if (items[j].card.ct === 'major') return items[j];
    return items[Math.floor(items.length / 2)] || items[0];
  }

  function build(items, area, sp) {
    var n = items.length || 1;
    var revN = items.filter(function (it) { return it.rev; }).length;
    var ratio = Math.round((n - revN) / n * 100);
    var majorN = items.filter(function (it) { return it.card.ct === 'major'; }).length;
    var level = ratio >= 67 ? '顺' : ratio >= 34 ? '平' : '逆';

    var first = items[0], last = items[n - 1], focus = pickFocus(items);
    var posOf = function (i) { return String(((sp && sp.slots && sp.slots[i]) ? sp.slots[i].pos : '') || '').replace(/\s/g, ''); };
    var nameOf = function (it) { return '「' + it.card.nm + (it.rev ? ' · 逆' : '') + '」'; };
    var kwOf = function (it) { return it.rev ? it.card.kwR : it.card.kwU; };
    var txtOf = function (it) { return it.rev ? it.card.re : it.card.up; };

    /* 定调 */
    var tone = level === '顺' ? '整体偏顺' : level === '平' ? '顺逆参半' : '逆牌偏多，以提醒为主';
    var headline = '这副牌给你的答案：' + tone + '（' + n + ' 张里 ' + (n - revN) + ' 张正位）。' +
      '主调是' + nameOf(first) + '：' + lead(txtOf(first), 40) + '。' +
      (revN ? '最该留意的是' + nameOf(focus) + '——' + lead(txtOf(focus), 40) + '。' : '没有逆位牌，说明当下没有明显的自我拉扯，顺势往前走就好。') +
      (majorN >= Math.ceil(n / 2) ? '大牌占多数，这件事对你是个不小的节点，值得认真对待。' : '');

    var tags = items.map(function (it) { return it.card.nm + (it.rev ? '·逆' : '·正'); });
    tags.push(AREA[area] || AREA.all);
    if (majorN) tags.push('大牌 ' + majorN + ' 张');
    tags.push(level === '顺' ? '顺势而为' : level === '平' ? '边走边看' : '先稳后动');

    /* 三行结论 */
    var now = nameOf(first) + (posOf(0) ? '（' + posOf(0) + '位）' : '') + '：' + kwOf(first) + ' → ' + lead(txtOf(first));
    var block = revN
      ? nameOf(focus) + (posOf(items.indexOf(focus)) ? '（' + posOf(items.indexOf(focus)) + '位）' : '') + '：' + kwOf(focus) + ' → ' + lead(txtOf(focus))
      : '没有逆位牌：当下没有明显的自我拉扯，主要防"想太多不动手"。';
    var next = n > 1
      ? nameOf(last) + (posOf(n - 1) ? '（' + posOf(n - 1) + '位）' : '') + '：' + kwOf(last) + ' → ' + lead(txtOf(last))
      : '就这一张牌：把它说的那件事，今天就做一点点。';

    /* 对你问的事怎么说 */
    var dk = DEEP_KEY[area] || 'other';
    var areaLines = items.map(function (it) {
      var d = (global.DEEP || {})[it.card.k] || {};
      var t = d[dk] || d.other || '';
      return nameOf(it) + '：' + (t ? lead(t, 52) : lead(txtOf(it), 52));
    });

    /* 建议与宜忌 */
    var advice = [];
    if (level === '顺') advice.push('牌偏顺：别只停在"感觉不错"，把最想做的那一步定个日期。');
    else if (level === '平') advice.push('顺逆参半：先做小范围尝试，拿到反馈再扩大，别一次押满。');
    else advice.push('逆牌偏多：先止损、先观察，把能控制的那一件做好，其余的交给时间。');
    advice.push('挑一张最扎心的牌，把它的一句话写成今天/本周的一个小行动。');
    advice.push((AREA[area] || AREA.all) + '这件事：看牌是照镜子，真正改变的是你接下来做的事。');

    var tips = [
      '宜：顺着最亮的那张牌行动，先做一件小事',
      '忌：同一件事反复抽牌、把牌当判决'
    ];

    var bottom = '简单说：现在处在「' + lead(kwOf(first), 20) + '」，' +
      (revN ? '卡在「' + lead(kwOf(focus), 20) + '」，' : '') +
      '下一步看「' + lead(kwOf(last), 20) + '」。牌是镜子不是判官，顺着这张牌的提示，先做一件小事。';

    return {
      headline: headline, tags: tags, ratio: ratio, level: level, majorN: majorN, revN: revN,
      now: now, block: block, next: next, areaLines: areaLines, advice: advice, tips: tips, bottom: bottom,
      areaName: AREA[area] || AREA.all
    };
  }

  function html(items, area, sp) {
    var s = build(items, area, sp);
    var lv = s.level === '顺' ? 'ok' : (s.level === '平' ? 'mid' : 'no');
    var h = '<div class="brief-card">';
    h += '<div class="bc-title">✦ 一 句 话 总 评</div>';
    h += '<div class="sum-head">' + esc(s.headline) + '</div>';
    h += '<div class="sum-tags">' + s.tags.map(function (x) { return '<span class="tag">' + esc(x) + '</span>'; }).join('') + '</div>';
    h += '<div class="sc-row"><span class="sc-n">顺势</span>' +
      '<span class="sc-bar"><i style="width:' + s.ratio + '%"></i></span>' +
      '<span class="sc-v">' + s.ratio + '</span><span class="sc-why">' +
      esc(s.revN ? '正位 ' + (items.length - s.revN) + ' 张 · 逆位 ' + s.revN + ' 张' : '全部正位') + '</span></div>';
    h += '<div class="bc-three">';
    h += '<div class="bc-line"><b>现在</b>' + esc(s.now) + '</div>';
    h += '<div class="bc-line"><b>卡在哪</b>' + esc(s.block) + '</div>';
    h += '<div class="bc-line"><b>下一步</b>' + esc(s.next) + '</div>';
    h += '</div>';
    h += '<div class="bc-area"><div class="bc-sub">对你问的「' + esc(s.areaName) + '」分别怎么说</div>';
    s.areaLines.forEach(function (t) { h += '<div class="bc-line sm">' + esc(t) + '</div>'; });
    h += '</div>';
    h += '<div class="sum-bottom">' + esc(s.bottom) + '</div>';
    h += '<div class="advice"><div class="t">该怎么做</div><ul>' +
      s.advice.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    h += '<div class="tp-tips">' + s.tips.map(function (x) { return '<span class="tip-badge">' + esc(x) + '</span>'; }).join('') + '</div>';
    h += '</div>';
    h += '</div>';
    return h;
  }

  global.TarotSummary = { build: build, html: html, AREA: AREA };
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) module.exports = (typeof window !== 'undefined' ? window : globalThis).TarotSummary;
