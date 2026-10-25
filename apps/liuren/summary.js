/* 六壬 · 一句话总评
 * 把一课收成"起因 / 过程 / 结果 + 这件事成不成 + 宜忌应期"，让人一眼看懂。
 * 依赖：data.js（LR.LEI_SHEN）、liuren.js 排盘结果 p（含 p.duan）
 */
(function (global) {
  'use strict';

  var D = (typeof LR !== 'undefined') ? LR : (global.LR || {});

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function tone(score) {
    if (score >= 3) return '偏吉 · 可以往前走';
    if (score >= 0) return '吉凶参半 · 宜稳不宜急';
    return '偏凶 · 宜守不宜进';
  }

  function build(p, question) {
    var d = p.duan || {};
    var score = typeof d.score === 'number' ? d.score : 0;
    var pct = Math.max(6, Math.min(100, Math.round((score + 8) / 16 * 100)));
    var level = score >= 3 ? '顺' : score >= 0 ? '平' : '逆';
    var q = question || '综合';
    var lei = (D.LEI_SHEN || {})[q] || {};

    /* 定调：课体 + 三传走势 + 类神 */
    var head = '你问「' + q + '」——' + (d.summary || ('此课' + p.keti + '课。'));
    if (d.leiShen) head += ' 类神' + (lei.key ? '（' + lei.key + '）' : '') + '落在' + (d.leiZhi || '') +
      '，临' + (d.leiJiang || '') + '：' + d.leiShen;

    var tags = [p.keti + '课', '月将' + p.yueJiang, '占时' + p.shiZhi + '时',
      '贵人' + p.guiZhi + (p.isDay ? '·昼' : '·夜'), '旬空' + p.kongWang.join(''),
      '类神' + (d.leiZhi || '—')];
    if (p.xlr) tags.push('小六壬·' + p.xlr.n + '（' + p.xlr.jx + '）');
    tags.push(tone(score));

    /* 三传：起因 / 过程 / 结果 */
    var steps = [
      { n: '起因', i: 0 }, { n: '过程', i: 1 }, { n: '结果', i: 2 }
    ].map(function (x) {
      var c = (d.chuan || [])[x.i];
      return { n: x.n, text: c ? (c.text || (c.zhi + '（' + c.jiang + '）')) : '—' };
    });

    /* 吉凶理由：从三传天将/旺相/空亡里摘 */
    var why = [];
    (d.chuan || []).forEach(function (c, i) {
      var nm = ['初传', '中传', '末传'][i] || '';
      if (c.jiang) why.push(nm + c.zhi + '临' + c.jiang);
      if (c.kong) why.push(nm + '落空亡（-2）');
      if (c.ws === '旺' || c.ws === '相') why.push(nm + c.ws + '有力（+1）');
      if (c.ws === '死' || c.ws === '囚') why.push(nm + c.ws + '无力（-1）');
    });

    var advice = [];
    if (level === '顺') advice.push('整体偏吉：可以往前走，别因为犹豫错过窗口。');
    else if (level === '平') advice.push('吉凶参半：宜稳不宜急，先把能确定的部分做实。');
    else advice.push('整体偏凶：宜守不宜进，先止损、先观察，别硬碰硬。');
    if (lei.tip) advice.push('问' + q + '的诀窍：' + lei.tip);
    if (d.yingqi) advice.push('应期参考：' + d.yingqi);
    if (p.fuYin) advice.push('伏吟课：宜维持现状，动则生变。');
    if (p.fanYin) advice.push('返吟课：事情反复，宜做两手准备。');

    var bottom = '简单说：这一课' + tone(score) + '（' + score + ' 分）。' +
      (steps[0].text ? '开头是' + steps[0].text.split('，')[0] + '，' : '') +
      (steps[2].text ? '收尾看' + steps[2].text.split('，')[0] + '。' : '') +
      (d.yi && d.yi.length ? '宜' + d.yi.slice(0, 2).join('、') + '；' : '') +
      (d.ji && d.ji.length ? '忌' + d.ji.slice(0, 2).join('、') + '。' : '') +
      (d.yingqi ? '应期：' + d.yingqi + '。' : '');

    return {
      head: head, tags: tags, pct: pct, score: score, level: level, tone: tone(score),
      steps: steps, why: why, advice: advice, bottom: bottom,
      geju: d.geju || [], yi: d.yi || [], ji: d.ji || [], yingqi: d.yingqi || '',
      leiShen: d.leiShen || '', leiZhi: d.leiZhi || '', leiJiang: d.leiJiang || '',
      question: q, keti: p.keti, ketiPlain: d.ketiPlain || ''
    };
  }

  function html(p, question) {
    var s = build(p, question);
    var lv = s.level === '顺' ? 'ok' : (s.level === '平' ? 'mid' : 'no');
    var h = '<div class="brief-card">';
    h += '<div class="bc-title">✦ 一 句 话 总 评 · 这 件 事 成 不 成</div>';
    h += '<div class="sum-head">' + esc(s.head) + '</div>';
    h += '<div class="sum-tags">' + s.tags.map(function (x) { return '<span class="tag">' + esc(x) + '</span>'; }).join('') + '</div>';
    h += '<div class="sc-row"><span class="sc-n">吉凶</span>' +
      '<span class="sc-bar"><i style="width:' + s.pct + '%"></i></span>' +
      '<span class="sc-v">' + s.score + '</span><span class="sc-why">' + esc(s.tone) + '</span></div>';
    h += '<div class="bc-three">';
    s.steps.forEach(function (x) {
      h += '<div class="bc-line"><b>' + x.n + '</b>' + esc(x.text) + '</div>';
    });
    h += '</div>';
    if (s.why.length) {
      h += '<div class="bc-area"><div class="bc-sub">打分依据（天将 · 旺相 · 空亡）</div>';
      h += '<div class="bc-line sm">' + esc(s.why.join('；')) + '</div></div>';
    }
    if (s.geju.length) {
      h += '<div class="bc-area"><div class="bc-sub">格局提示</div>';
      s.geju.slice(0, 5).forEach(function (g) { h += '<div class="bc-line sm">' + esc(g) + '</div>'; });
      h += '</div>';
    }
    h += '<div class="kv2">' +
      '<div class="box"><div class="t ok">宜</div><ul>' + (s.yi.length ? s.yi.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') : '<li>顺势而为</li>') + '</ul></div>' +
      '<div class="box"><div class="t no">忌</div><ul>' + (s.ji.length ? s.ji.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') : '<li>急进与硬碰硬</li>') + '</ul></div>' +
      '</div>';
    h += '<div class="advice"><div class="t">该怎么做</div><ul>' +
      s.advice.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    h += '<div class="sum-bottom">' + esc(s.bottom) + '</div>';
    h += '</div>';
    return h;
  }

  global.LRSummary = { build: build, html: html, tone: tone };
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) module.exports = (typeof window !== 'undefined' ? window : globalThis).LRSummary;
