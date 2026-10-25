/* 数字能量 · 一句话总评
 * 把号码的八星磁场收成"财运 / 事业 / 人脉 / 稳定 / 平安"五维，让人一眼看懂这个号值不值得用。
 * 依赖：data.js（EIGHT_STARS / WX_LIFE）、core.js（NE）
 */
(function (global) {
  'use strict';

  var ES = (typeof EIGHT_STARS !== 'undefined') ? EIGHT_STARS : (global.EIGHT_STARS || {});

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function clamp(v) { return Math.max(20, Math.min(95, Math.round(v))); }

  function hit(an, name) { return (an.starHit && an.starHit[name]) || 0; }
  function fuweiCount(an) {
    return (an.groups || []).filter(function (x) { return x.star === '伏位' || x.type === '平'; }).length;
  }

  var DIMS = [
    { k: 'wealth', n: '财运' },
    { k: 'career', n: '事业' },
    { k: 'people', n: '人脉' },
    { k: 'steady', n: '稳定' },
    { k: 'peace', n: '平安' }
  ];

  function scores(an) {
    var g = function (n) { return hit(an, n); };
    var fw = fuweiCount(an);
    return [
      {
        k: 'wealth', n: '财运',
        v: clamp(45 + g('天医') * 15 + g('生气') * 8 + g('延年') * 6 - g('绝命') * 12 - g('五鬼') * 8 - g('祸害') * 6 - g('六煞') * 5)
      },
      {
        k: 'career', n: '事业',
        v: clamp(45 + g('延年') * 14 + g('天医') * 6 + g('生气') * 6 - g('五鬼') * 10 - g('绝命') * 8 - g('六煞') * 6 - g('祸害') * 5)
      },
      {
        k: 'people', n: '人脉',
        v: clamp(45 + g('生气') * 12 + g('延年') * 8 + g('天医') * 6 - g('六煞') * 10 - g('祸害') * 8 - g('绝命') * 6 - g('五鬼') * 5)
      },
      {
        k: 'steady', n: '稳定',
        v: clamp(45 + fw * 10 + g('天医') * 6 + g('延年') * 5 - g('绝命') * 14 - g('五鬼') * 10 - g('祸害') * 6 - g('六煞') * 6)
      },
      {
        k: 'peace', n: '平安',
        v: clamp(70 + g('天医') * 5 + g('生气') * 4 + fw * 3 - g('绝命') * 14 - g('五鬼') * 11 - g('祸害') * 9 - g('六煞') * 7)
      }
    ];
  }

  function starNote(an) {
    var names = Object.keys(an.starHit || {});
    var plus = [], minus = [];
    names.forEach(function (n) {
      var c = (an.starHit[n] || 0);
      if (!c) return;
      var e = ES[n] || {};
      if (e.type === '吉') plus.push(n + ' × ' + c + '（' + (e.tag || '') + '）：' + (e.good || e.text || '').slice(0, 34));
      else minus.push(n + ' × ' + c + '（' + (e.tag || '') + '）：' + (e.watch || e.text || '').slice(0, 34));
    });
    return { plus: plus, minus: minus };
  }

  function build(an, bazi) {
    var sc = scores(an);
    var sorted = sc.slice().sort(function (a, b) { return b.v - a.v; });
    var best = sorted[0], worst = sorted[sorted.length - 1];
    var sn = starNote(an);
    var mainStar = '', subStar = '';
    var arr = Object.keys(an.starHit || {}).sort(function (a, b) { return an.starHit[b] - an.starHit[a]; });
    if (arr.length) mainStar = arr[0];
    if (arr.length > 1) subStar = arr[1];

    var head = '这个号码是「' + an.levelName + '」的磁场（' + an.display + ' 分）：';
    if (mainStar) head += '主调' + mainStar + '（' + ((ES[mainStar] || {}).tag || '') + '）' + hit(an, mainStar) + ' 组' +
      (subStar ? '，次调' + subStar + '（' + ((ES[subStar] || {}).tag || '') + '）' + hit(an, subStar) + ' 组' : '') + '；';
    head += '十组里吉 ' + an.posCnt + '、凶 ' + an.negCnt + '、特殊 ' + an.spCnt + '。' +
      (an.display >= 70 ? '整体是"能用、好用"的号，财气与人缘都有抓手。' :
        an.display >= 55 ? '整体是"有长有短"的号，能用，但要知道漏口在哪。' :
          '整体偏弱，凶星压过吉星，当业务号或长期号要谨慎。');
    if ((an.n0 || 0) + (an.n5 || 0) > 0) head += ' 号里 0/5 共 ' + ((an.n0 || 0) + (an.n5 || 0)) + ' 个，会放大相邻磁场的力量。';

    var tags = [an.levelName + ' ' + an.display + ' 分', '吉' + an.posCnt + ' · 凶' + an.negCnt + ' · 特殊' + an.spCnt];
    if (mainStar) tags.push('主调 ' + mainStar);
    if (subStar) tags.push('次调 ' + subStar);
    if (an.tail && an.tail.length) tags.push('尾段 ' + an.tail.map(function (t) { return t.pair + (t.star ? '(' + t.star + ')' : ''); }).join(' '));
    if (fuweiCount(an)) tags.push('伏位 ' + fuweiCount(an) + ' 组');
    if (bazi && bazi.favorWx) tags.push('本命喜' + bazi.favorWx);

    var advice = [];
    if (an.display >= 70) advice.push('这个号底子不错：继续用没问题，把主调星的长处用在对应场景（业务号/收款号/社交号）。');
    else if (an.display >= 55) advice.push('这个号能用，但别拿它当唯一的主力号：重要业务号可另配一个吉星更集中的号。');
    else advice.push('这个号偏弱：建议逐步换掉，优先选天医/生气/延年组合更多、凶星更少的号。');
    if (sn.minus.length) advice.push('最要防的是' + sn.minus[0].split('（')[0] + '：' + ((ES[sn.minus[0].split(' ')[0]] || {}).watch || '注意破耗与情绪').slice(0, 40));
    if (bazi && bazi.nums && bazi.nums.length) advice.push('换号优先挑尾号含你的幸运数字 ' + bazi.nums.join('、') + ' 的号，与本命磁场更合。');
    advice.push('号码是助力不是决定：同一个号，用在不同人和行业上效果不同，别把它当唯一依靠。');

    var bottom = '简单说：这个号最强的在' + best.n + '（' + best.v + ' 分），最要防的是' + worst.n + '（' + worst.v + ' 分）；总分 ' +
      an.display + '，属「' + an.levelName + '」。' +
      (an.display < 55 ? '若要换，优先挑吉星集中、尾号干净的号。' : '用着顺手就别折腾，把漏口盯住即可。');

    return {
      head: head, tags: tags, scores: sc, best: best, worst: worst,
      plus: sn.plus, minus: sn.minus, advice: advice, bottom: bottom,
      display: an.display, levelName: an.levelName, fmt: an.fmt || an.phone
    };
  }

  function html(an, bazi) {
    var s = build(an, bazi);
    var h = '<div class="brief-card">';
    h += '<div class="bc-title">✦ 一 句 话 总 评 · 这 个 号 值 不 值 得 用</div>';
    h += '<div class="sum-head">' + esc(s.head) + '</div>';
    h += '<div class="sum-tags">' + s.tags.map(function (x) { return '<span class="tag">' + esc(x) + '</span>'; }).join('') + '</div>';
    h += '<div class="sc-list">';
    s.scores.forEach(function (x) {
      h += '<div class="sc-row"><span class="sc-n">' + esc(x.n) + '</span>' +
        '<span class="sc-bar"><i style="width:' + x.v + '%"></i></span>' +
        '<span class="sc-v">' + x.v + '</span></div>';
    });
    h += '</div>';
    h += '<div class="kv2">';
    h += '<div class="box"><div class="t ok">这个号的加分项</div><ul>' +
      (s.plus.length ? s.plus.slice(0, 4).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') : '<li>吉星不明显，靠使用者自身努力</li>') + '</ul></div>';
    h += '<div class="box"><div class="t no">要防的漏口</div><ul>' +
      (s.minus.length ? s.minus.slice(0, 4).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') : '<li>没有明显凶星，主要防懈怠</li>') + '</ul></div>';
    h += '</div>';
    h += '<div class="advice"><div class="t">该怎么做</div><ul>' +
      s.advice.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    h += '<div class="sum-bottom">' + esc(s.bottom) + '</div>';
    h += '</div>';
    return h;
  }

  global.NESummary = { build: build, html: html, scores: scores, DIMS: DIMS };
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) module.exports = (typeof window !== 'undefined' ? window : globalThis).NESummary;
