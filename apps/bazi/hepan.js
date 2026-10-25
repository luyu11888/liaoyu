/* ============================================================
 * 双人合盘 hepan.js
 * 依赖：lunar.js / data.js / bazi.js（先加载）
 * 用途：并排双盘 + 干支互动 + 五行互补 + 十神视角 + 关系参考
 * ============================================================ */

/* 地支互动类型判定 */
function zhiRelType(z1, z2) {
  if (!z1 || !z2 || z1 === z2) return null;
  if (ZHI_LIUHE[z1] === z2) return { t: '六合', desc: liuheNote(z1, z2) };
  var sh = sanhePair(z1, z2);
  if (sh) return { t: '三合', desc: sh.name };
  if (ZHI_CHONG[z1] === z2) return { t: '六冲', desc: chongNote(z1, z2) };
  if (ZHI_HAI[z1] === z2) return { t: '六害', desc: haiNote(z1, z2) };
  if (ZHI_XING[z1] && ZHI_XING[z1].indexOf(z2) > -1) return { t: '相刑', desc: xingNote(z1, z2) };
  if (ZHI_PO[z1] === z2) return { t: '相破', desc: '地支相破，小磕小绊不断，需多磨合' };
  return null;
}

/* 归并"互动条目"：把同一对关系的两方向合并 */
function pairKey(z1, z2) { return [z1, z2].sort(function (a, b) { return ZHI12_INDEX[a] - ZHI12_INDEX[b]; }).join(''); }

/* ============ 合盘计算 ============ */
/* rA、rB 为两个 calcBazi() 的结果 */
function calcHePan(rA, rB) {
  var out = { items: [], ganHe: [], wxLines: [], viewA2B: [], viewB2A: [], score: 70, label: '', dayNote: '', advices: [] };
  var keys = ['y', 'm', 'd', 't'];
  var seen = {};

  function push(rel, posA, posB, zA, zB, note) {
    var kp = rel + '|' + posA + '|' + posB;
    if (seen[kp]) return;
    seen[kp] = 1;
    out.items.push({ rel: rel, posA: posA, posB: posB, zA: zA, zB: zB, note: note });
  }

  /* 天干五合：同宫位（含两日主相合，最动情之一端） */
  keys.forEach(function (k) {
    var pA = rA.pillars[['y', 'm', 'd', 't'].indexOf(k)];
    var pB = rB.pillars[['y', 'm', 'd', 't'].indexOf(k)];
    if (GAN_WUHE[pA.gan] === pB.gan) {
      var tag = (k === 'd') ? '（日主相合）' : '';
      out.ganHe.push({ pos: PILLAR_NAME[k], a: pA.gan, b: pB.gan, note: wuheNote(pA.gan, pB.gan) + tag });
    }
  });

  /* 地支互动：同宫位 + 涉及日支/年支的跨位 */
  var PA = {};
  rA.pillars.forEach(function (p) { PA[p.key] = p; });
  var PB = {};
  rB.pillars.forEach(function (p) { PB[p.key] = p; });

  keys.forEach(function (k) {
    var rel = zhiRelType(PA[k].zhi, PB[k].zhi);
    if (rel) push(rel.t, PILLAR_NAME[k], PILLAR_NAME[k], PA[k].zhi, PB[k].zhi, rel.desc);
  });
  /* 跨位重点看：婚宫(日支)与对方的年/月/时支；生肖(年支)只与婚宫互为参考 */
  [['d', 'y'], ['d', 'm'], ['d', 't'], ['y', 'd']].forEach(function (c) {
    var a = PA[c[0]], b = PB[c[1]];
    var rel = zhiRelType(a.zhi, b.zhi);
    if (rel && (rel.t === '六合' || rel.t === '六冲' || rel.t === '三合')) {
      push(rel.t, PILLAR_NAME[c[0]], PILLAR_NAME[c[1]], a.zhi, b.zhi, rel.desc + '（跨宫互参）');
    }
  });

  /* 五行互补 */
  var A = rA, B = rB;
  function lackCovered(x, y) {
    var lines = [];
    if (x.energy[x.least] < 0.5 && y.energy[x.least] >= 2) {
      lines.push('甲五行最缺「' + x.least + '」，而乙该行偏旺（' + Math.round(y.energy[x.least] * 10) / 10 + ' 分），正好"你缺我补"，生活里乙常能带动甲的短板领域。');
    }
    if (y.energy[y.least] < 0.5 && x.energy[y.least] >= 2) {
      lines.push('乙五行最缺「' + y.least + '」，而甲该行偏旺（' + Math.round(x.energy[y.least] * 10) / 10 + ' 分），甲的强项恰是乙的补益所在。');
    }
    return lines;
  }
  out.wxLines = lackCovered(A, B).concat(lackCovered(B, A));
  if (!out.wxLines.length) {
    out.wxLines.push('双方五行各有胜负、未见明显的"此缺彼旺"互补关系——相处互补感不靠命，靠分工与体谅也一样顺。');
  }

  /* 十神视角 */
  function view(vr, or, vName, oName) {
    var ss = shiShenName(vr.dayGan, or.dayGan);
    var rel = relOf(vr.dayGan, or.dayGan);
    var d = SHI_SHEN_DESC[ss] || {};
    var lines = [];
    lines.push({ s: vName + '看' + oName + '的日主「' + or.dayGan + '」：是' + vName + '的「' + ss + '」——' + (d.text || ''), w: '以' + vName + '日干为主、视对方日干为十神' });
    /* 对方四干对我日主显现 */
    var cnt = {};
    or.pillars.forEach(function (p) {
      if (p.key === 'd') return;
      var s2 = shiShenName(vr.dayGan, p.gan);
      cnt[s2] = (cnt[s2] || 0) + 1;
    });
    var arr = [];
    for (var k2 in cnt) if (cnt.hasOwnProperty(k2)) arr.push(k2 + '×' + cnt[k2]);
    if (arr.length) lines.push({ s: vName + '眼中，' + oName + '整盘的"能量语言"是：' + arr.join('、') + '——' + arr.map(function (a) {
      var n = a.split('×')[0];
      return (SHI_SHEN_DESC[n] ? '「' + n + '」' + (SHI_SHEN_DESC[n].role || '') : '');
    }).join('；') + '。', w: '统计对方三干十神比重' });
    return lines;
  }
  out.viewA2B = view(rA, rB, '命主甲', '命主乙');
  out.viewB2A = view(rB, rA, '命主乙', '命主甲');

  /* 日支配偶宫互动评语 */
  var dd = zhiRelType(PA.d.zhi, PB.d.zhi);
  if (dd && dd.t === '六合') { out.dayNote = '日支配偶宫相合（' + PA.d.zhi + PB.d.zhi + '），两个"小窝"天然来电，相处亲切感强，是婚恋盘里的加分项。'; out.score += 6; }
  else if (dd && dd.t === '三合') { out.dayNote = '日支配偶宫成半合（' + PA.d.zhi + PB.d.zhi + '），三观与步调大体同频，能往一处使劲。'; out.score += 4; }
  else if (dd && dd.t === '六冲') { out.dayNote = '日支配偶宫相冲（' + PA.d.zhi + '冲' + PB.d.zhi + '），属"火星撞地球"：吸引力强、摩擦也直接——把顶牛变成互补，反而越处越铁。'; out.score -= 7; }
  else if (dd && dd.t === '六害') { out.dayNote = '日支配偶宫相害（' + PA.d.zhi + '害' + PB.d.zhi + '），在一起易有"说不清的小别扭"，宜把话摊开说，忌冷战。'; out.score -= 3; }
  else { out.dayNote = '日支配偶宫之间无明显的合冲，婚恋没有强烈"命中注定"的戏剧感，反而清清爽爽——感情顺不顺，全看日常经营。'; }

  /* 生肖（年支）关系 */
  var yrel = zhiRelType(PA.y.zhi, PB.y.zhi);
  if (yrel) {
    var sxA = ZHI_DETAIL[PA.y.zhi].shengxiao, sxB = ZHI_DETAIL[PB.y.zhi].shengxiao;
    var sline = '生肖' + sxA + '与' + sxB + '，年支为「' + yrel.t + '」——' + yrel.desc + '。';
    if (yrel.t === '六冲') { out.advices.push(sline + '两家背景、长辈观念方面需多点耐心磨合，婚前多与双方家庭沟通为佳。'); out.score -= 4; }
    else if (yrel.t === '六合' || yrel.t === '三合') { out.advices.push(sline + '长辈与家庭层面较合拍，容易得到两边家长的祝福。'); out.score += 4; }
    else { out.advices.push(sline); }
  }

  /* 天干五合加分 */
  if (out.ganHe.length) out.score += out.ganHe.length * 3;
  /* 地支合冲分数 */
  out.items.forEach(function (it) {
    if (it.rel === '六合') out.score += 2;
    if (it.rel === '三合') out.score += 1;
    if (it.rel === '六冲') out.score -= 3;
    if (it.rel === '六害') out.score -= 2;
    if (it.rel === '相刑') out.score -= 2;
    if (it.rel === '相破') out.score -= 1;
  });
  /* 同五行日主：朋友/同类属性 */
  var sameWx = GAN_DETAIL[rA.dayGan].wx === GAN_DETAIL[rB.dayGan].wx;
  if (sameWx) out.advices.push('双方日主同属' + GAN_DETAIL[rA.dayGan].wx + '行，像"同类"：默契度高、彼此像照镜子；也正因为太像，吵架时要小心针尖对麦芒。');
  out.score = Math.max(56, Math.min(98, Math.round(out.score)));
  if (out.score >= 88) out.label = '默契上佳 · 姻缘参考：颇合';
  else if (out.score >= 78) out.label = '缘分中上 · 宜用心经营';
  else if (out.score >= 68) out.label = '缘分平常 · 重在磨合';
  else out.label = '磨合型 · 需多些包容与沟通';

  out.advices.push('缘分指数依据六合、三合、六冲、六害、生肖、婚宫、五行互补、十神视角等传统要素加权演示，仅供文化娱乐参考——真正决定一段关系的，永远是三观、人品与经营。');
  return out;
}

/* ============ HTML 渲染 ============ */
function renderHePan(rA, rB) {
  computeShenSha(rA);
  computeShenSha(rB);
  var hp = calcHePan(rA, rB);
  var h = '';

  function personInfo(r) {
    var leapTxt = (r.lunar.getMonth() < 0) ? '闰' : '';
    var z = ZHI_DETAIL[r.pillars[0].zhi];
    var sx = r.sex === 1 ? '男' : '女';
    return '<div class="hp-info"><div><b>' + sx + '命 · 生肖' + z.shengxiao + ' · 日主' + r.dayGan + ' · 格局' + geJuOf(r).ge + '</b>　' +
      r.pillars.map(function (p) { return p.gan + p.zhi; }).join(' ') + '</div>' +
      '<div class="dim-w">' + r.solar.toYmd() + ' ' + String(r.solar.getHour()) + ':' + (r.solar.getMinute() < 10 ? '0' : '') + r.solar.getMinute() +
      ' · 农历 ' + r.lunar.getYearInChinese() + '年 ' + leapTxt + r.lunar.getMonthInChinese() + '月' + r.lunar.getDayInChinese() + '</div></div>';
  }

  h += '<div class="sec-title">双盘并排</div>';
  h += '<div class="hp-duo">';
  h += '<div class="hp-col"><div class="hp-name-tag hp-a">命主 甲</div>' + personInfo(rA) + personInner(rA) + '</div>';
  h += '<div class="hp-col"><div class="hp-name-tag hp-b">命主 乙</div>' + personInfo(rB) + personInner(rB) + '</div>';
  h += '</div>';

  /* 干支互动 */
  h += '<div class="sec-title">干支互动 · 合婚参考</div>';
  h += '<div class="summary-box">';
  h += '<p><b>配偶宫（日支）评语：</b>' + hp.dayNote + '</p>';
  if (hp.ganHe.length) {
    h += '<p><b>天干五合：</b>' + hp.ganHe.map(function (g) { return g.pos + ' ' + g.a + '合' + g.b + '（' + g.note + '）'; }).join('；') + '。</p>';
  } else {
    h += '<p><b>天干五合：</b>四柱天干之间未成五合——少了点"一见面就顺眼"的化学作用，但也少了粘腻，全靠日常相处加热。</p>';
  }
  if (hp.items.length) {
    h += '<p><b>地支互动：</b>' + hp.items.map(function (it) {
      var same = it.posA === it.posB;
      if (same) return it.posA + ' ' + it.zA + it.zB + '为「' + it.rel + '」' + (it.note ? '（' + it.note + '）' : '');
      return '甲·' + it.posA + ' ' + it.zA + ' 与 乙·' + it.posB + ' ' + it.zB + '呈「' + it.rel + '」' + (it.note ? '（' + it.note + '）' : '');
    }).join('；') + '。</p>';
  } else {
    h += '<p><b>地支互动：</b>年、月、日、时支之间未见六合/三合/六冲等显著信号，属于"平淡是真"的组合，需要更多主动的仪式感与沟通。</p>';
  }
  h += '</div>';

  /* 五行互补 */
  h += '<div class="sec-title">五行互补 · 能量对照</div>';
  h += '<div class="wx-duo">';
  [['甲', rA], ['乙', rB]].forEach(function (pr) {
    h += '<div class="wx-col"><div class="wx-col-t">' + pr[0] + ' 五行</div>' + energyBar(pr[1]) + '</div>';
  });
  h += '</div>';
  h += '<div class="plain">' + hp.wxLines.map(function (s) { return '· ' + s; }).join('<br>') + '</div>';

  /* 十神视角 */
  h += '<div class="sec-title">十神视角 · 你看我我看你</div>';
  h += '<div class="dim-grid">';
  [['甲 → 乙', hp.viewA2B], ['乙 → 甲', hp.viewB2A]].forEach(function (v) {
    h += '<div class="dim-card"><div class="dim-t">' + v[0] + '</div>';
    v[1].forEach(function (ln) {
      h += '<div class="dim-line"><span class="dim-s">' + ln.s + '</span>' + (ln.w ? '<span class="dim-w">' + ln.w + '</span>' : '') + '</div>';
    });
    h += '</div>';
  });
  h += '</div>';

  /* 缘分指数 */
  h += '<div class="sec-title">缘分参考指数</div>';
  h += '<div class="score-box">';
  h += '<div class="score-num">' + hp.score + '</div>';
  h += '<div class="score-info"><div class="score-label">' + hp.label + '</div>' +
    '<div class="score-bar"><i style="width:' + (hp.score - 50) + '%"></i></div></div>';
  h += '</div>';
  h += '<div class="plain">' + hp.advices.map(function (s) { return '· ' + s; }).join('<br>') + '</div>';

  h += '<div class="disclaimer">合盘仅基于双方出生时刻的传统象意演算，为文化与娱乐参考；现实中请以相处体验与人品三观为准。' + DISCLAIMER + '</div>';
  return h;
}

function personInner(r) {
  return '<div class="hp-pillars"><div class="pillars">' +
    r.pillars.map(function (p) { return pillarHTML(p); }).join('') +
    '</div></div>';
}
