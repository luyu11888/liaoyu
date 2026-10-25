/* ============================================================
 * 八字排盘 + 专业细盘 + 白话命书  bazi.js
 * 历法计算依赖 lib/lunar.js（页面需先加载 lunar.js、data.js 再加载本文件）
 * 渲染与断事均在浏览器端完成，供文化研究与娱乐参考。
 * ============================================================ */

var GAN10 = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
var ZHI12 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/* 五行关系：以日干为主，判断另一个天干五行是什么 */
function relOf(dayGan, otherGan) {
  var d = GAN_DETAIL[dayGan], o = GAN_DETAIL[otherGan];
  if (d.wx === o.wx) return '同';
  if (WX_SHENG[d.wx] === o.wx) return '我生';   // 我生之
  if (WX_SHENG[o.wx] === d.wx) return '生我';   // 生我者（印）
  if (WX_KE[d.wx] === o.wx) return '我克';      // 我克之（财）
  return '克我';                                 // 克我者（官杀）
}

/* 十神名：rel + 阴阳异同 */
function shiShenName(dayGan, otherGan) {
  var same = GAN_DETAIL[dayGan].yy === GAN_DETAIL[otherGan].yy;
  var rel = relOf(dayGan, otherGan);
  var map = {
    '同': same ? '比肩' : '劫财',
    '我生': same ? '食神' : '伤官',
    '我克': same ? '偏财' : '正财',
    '克我': same ? '七杀' : '正官',
    '生我': same ? '偏印' : '正印'
  };
  return map[rel];
}

/* 天干地支对日主的五行关系描述 */
function relLabel(dayGan, otherGan) { return relOf(dayGan, otherGan); }

/* 地支主气五行 */
function zhiMainWx(zhi) { return ZHI_DETAIL[zhi].wx; }

function unique(a) { var o = {}, r = []; a.forEach(function (x) { if (!o[x]) { o[x] = 1; r.push(x); } }); return r; }
function isYangGan(g) { return GAN_DETAIL[g].yy === '阳'; }

/* 补益建议文案（取首要喜用/忌神） */
function lifeTip(wx) {
  var t = WX_LIFE[wx];
  return t ? '（对应颜色「' + t.color + '」、方位「' + t.dir + '」、行业如 ' + t.job + '，权作趣味参考）' : '';
}

/* ---------- 神煞计算 ---------- */
function computeShenSha(r) {
  var pillars = r.pillars;
  var yearGan = pillars[0].gan, yearZhi = pillars[0].zhi;
  var dayGan = r.dayGan, dayZhi = pillars[2].zhi;

  var groups = [
    { z: ['申', '子', '辰'], tao: '酉', ma: '寅', gai: '辰', jiang: '子', jie: '巳' },
    { z: ['寅', '午', '戌'], tao: '卯', ma: '申', gai: '戌', jiang: '午', jie: '亥' },
    { z: ['巳', '酉', '丑'], tao: '午', ma: '亥', gai: '丑', jiang: '酉', jie: '寅' },
    { z: ['亥', '卯', '未'], tao: '子', ma: '巳', gai: '未', jiang: '卯', jie: '申' }
  ];
  var TIANYI = {
    '甲': ['丑', '未'], '乙': ['子', '申'], '丙': ['亥', '酉'], '丁': ['亥', '酉'],
    '戊': ['丑', '未'], '己': ['子', '申'], '庚': ['丑', '未'], '辛': ['午', '寅'],
    '壬': ['卯', '巳'], '癸': ['卯', '巳']
  };
  var WENCHANG = { '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申', '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯' };
  var LU = { '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' };
  var YANGREN = { '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子' };
  var GU_GUA = {
    '亥': ['寅', '戌'], '子': ['寅', '戌'], '丑': ['寅', '戌'],
    '寅': ['巳', '丑'], '卯': ['巳', '丑'], '辰': ['巳', '丑'],
    '巳': ['申', '辰'], '午': ['申', '辰'], '未': ['申', '辰'],
    '申': ['亥', '未'], '酉': ['亥', '未'], '戌': ['亥', '未']
  };
  var HONGLUAN = { '子': '卯', '丑': '寅', '寅': '丑', '卯': '子', '辰': '亥', '巳': '戌', '午': '酉', '未': '申', '申': '未', '酉': '午', '戌': '巳', '亥': '辰' };

  var map = {};
  function add(z, name) {
    if (!map[z]) map[z] = [];
    if (map[z].indexOf(name) === -1) map[z].push(name);
  }

  /* 三合局类神煞：以年支与日支双查 */
  var anchors = [];
  [yearZhi, dayZhi].forEach(function (z) { if (anchors.indexOf(z) === -1) anchors.push(z); });
  anchors.forEach(function (az) {
    groups.forEach(function (g) {
      if (g.z.indexOf(az) > -1) {
        add(g.tao, '桃花（咸池）');
        add(g.ma, '驿马');
        add(g.gai, '华盖');
        add(g.jiang, '将星');
        add(g.jie, '劫煞');
      }
    });
  });

  var gs = GU_GUA[yearZhi];
  if (gs) { add(gs[0], '孤辰'); add(gs[1], '寡宿'); }

  (TIANYI[dayGan] || []).forEach(function (z) { add(z, '天乙贵人'); });
  (TIANYI[yearGan] || []).forEach(function (z) { add(z, '天乙贵人'); });
  if (WENCHANG[dayGan]) add(WENCHANG[dayGan], '文昌贵人');
  if (LU[dayGan]) add(LU[dayGan], '禄神');
  if (YANGREN[dayGan]) add(YANGREN[dayGan], '羊刃');
  var hl = HONGLUAN[yearZhi];
  if (hl) { add(hl, '红鸾'); add(ZHI_CHONG[hl], '天喜'); }

  var KUI = ['庚辰', '庚戌', '壬辰', '戊戌'];
  var kui = (KUI.indexOf(pillars[2].gan + pillars[2].zhi) > -1);

  /* 落到各柱（神煞均以地支所见为主；魁罡为日柱整体之格） */
  pillars.forEach(function (p) {
    p.sha = [];
    if (map[p.zhi]) map[p.zhi].forEach(function (n) { p.sha.push({ name: n }); });
    if (kui && p.key === 'd') p.sha.push({ name: '魁罡' });
  });
  return { kui: kui };
}

/* ---------- 格局（月令取格） ---------- */
function geJuOf(r) {
  var mP = r.pillars[1];
  var mainHideSS = mP.hideSS[0];          /* 月支本气十神 */
  var names8 = ['正官', '七杀', '正财', '偏财', '食神', '伤官', '正印', '偏印'];
  var ge;
  if (mainHideSS === '比肩' || mainHideSS === '劫财') {
    ge = mP.dishis === '临官' ? '建禄格' : (mP.dishis === '帝旺' ? '羊刃格' : '月令比劫·自立之局');
  } else {
    ge = (names8.indexOf(mainHideSS) > -1) ? mainHideSS + '格' : mainHideSS;
  }

  var note = [];
  var defSS = (ge.indexOf('格') > -1 ? ge.slice(0, ge.indexOf('格')) : '');
  if (defSS && SHI_SHEN_DESC[defSS]) note.push(SHI_SHEN_DESC[defSS].text);
  /* 成格透干与否 */
  if (mP.ganSS === mainHideSS && mainHideSS !== '比肩' && mainHideSS !== '劫财') note.push('月干正透' + mainHideSS + '，格局清透有力');
  else if (names8.indexOf(mainHideSS) > -1 && mP.ganSS !== '日主') note.push('月干透「' + mP.ganSS + '」辅之，' + mainHideSS + '取格');
  /* 常见贵格提示 */
  var topSS = [];
  r.pillars.forEach(function (p) { if (p.key !== 'd') topSS.push(p.ganSS); });
  if (mainHideSS === '七杀' && topSS.indexOf('食神') > -1) note.push('食神制杀：杀有制则权，能化压力为魄力');
  if (mainHideSS === '七杀' && (topSS.indexOf('正印') > -1 || topSS.indexOf('偏印') > -1)) note.push('杀印相生：压力被印星化转，可得权贵提携');
  if (mainHideSS === '伤官' && (topSS.indexOf('正印') > -1 || topSS.indexOf('偏印') > -1)) note.push('伤官佩印：才华有印制衡，锋芒可变成果');
  if (mainHideSS === '伤官' && topSS.indexOf('正官') > -1) note.push('伤官见官：才高心气也高，忌口舌直冲规则');
  return { ge: ge, note: note };
}

/* ============================================================
 * 核心排盘 calcBazi
 * ============================================================ */
function pillarHTML(p) {
  var h = '';
  h += '<div class="pillar p-' + p.key + '">';
  h += '<div class="pillar-tag">' + PILLAR_NAME[p.key] + '</div>';
  h += '<div class="cell gan-ss">' + (p.key === 'd' ? '<em>日主</em>' : p.ganSS) + '</div>';
  h += '<div class="cell gan" style="color:' + WX_COLOR[p.ganWx] + '">' + p.gan + '</div>';
  h += '<div class="cell zhi" style="color:' + WX_COLOR[p.zhiWx] + '">' + p.zhi + '</div>';
  h += '<div class="cell hide">';
  p.hides.forEach(function (hg, i) {
    h += '<div><span style="color:' + WX_COLOR[GAN_DETAIL[hg].wx] + '">' + hg + '</span><small>' + p.hideSS[i] + '</small></div>';
  });
  h += '</div>';
  h += '<div class="cell sub"><i>纳音</i>' + p.nayin + '</div>';
  h += '<div class="cell sub"><i>长生</i>' + p.dishis + '</div>';
  if (p.kong) h += '<div class="cell sub kong"><i>旬空</i>' + p.kong + '</div>';
  if (p.sha && p.sha.length) {
    h += '<div class="cell sha">' + p.sha.map(function (s) { return '<span class="sha-badge">' + s.name + '</span>'; }).join('') + '</div>';
  }
  h += '</div>';
  return h;
}

function energyBar(r) {
  var max = 1;
  WX_ORDER.forEach(function (w) { if (r.energy[w] > max) max = r.energy[w]; });
  var out = '<div class="wx-grid">';
  WX_ORDER.forEach(function (w) {
    var v = Math.round(r.energy[w] * 10) / 10;
    var pct = Math.round((r.energy[w] / max) * 100);
    out += '<div class="wx-item"><span class="wx-dot" style="background:' + WX_COLOR[w] + '"></span><span class="wx-name">' + w + '</span>' +
      '<span class="wx-bar"><i style="width:' + pct + '%;background:' + WX_COLOR[w] + '"></i></span>' +
      '<span class="wx-num">' + v + '</span></div>';
  });
  out += '</div>';
  return out;
}

/* opts: {y,m,d,h,min,sex(1男0女),sect(1|2)} */
function calcBazi(opts) {
  var solar = Solar.fromYmdHms(opts.y, opts.m, opts.d, opts.h, opts.min, 0);
  var lunar = solar.getLunar();
  var ec = lunar.getEightChar();
  if (opts.sect) ec.setSect(opts.sect);
  var dayGan = ec.getDayGan();

  function pillar(key) {
    var getters = {
      y: { g: ec.getYearGan, z: ec.getYearZhi },
      m: { g: ec.getMonthGan, z: ec.getMonthZhi },
      d: { g: ec.getDayGan, z: ec.getDayZhi },
      t: { g: ec.getTimeGan, z: ec.getTimeZhi }
    };
    var gz = getters[key];
    var gan = gz.g.call(ec), zhi = gz.z.call(ec);
    var hides = (key === 'y' ? ec.getYearHideGan() : key === 'm' ? ec.getMonthHideGan() : key === 'd' ? ec.getDayHideGan() : ec.getTimeHideGan());
    var hideSS = hides.map(function (hg) { return shiShenName(dayGan, hg); });
    var dishis = { y: ec.getYearDiShi, m: ec.getMonthDiShi, d: ec.getDayDiShi, t: ec.getTimeDiShi }[key].call(ec);
    var nayin = { y: ec.getYearNaYin, m: ec.getMonthNaYin, d: ec.getDayNaYin, t: ec.getTimeNaYin }[key].call(ec);
    var kong = { y: ec.getYearXunKong, m: ec.getMonthXunKong, d: ec.getDayXunKong, t: ec.getTimeXunKong }[key].call(ec);
    return {
      key: key, gan: gan, zhi: zhi,
      ganSS: key === 'd' ? '日主' : shiShenName(dayGan, gan),
      hides: hides, hideSS: hideSS,
      ganWx: GAN_DETAIL[gan].wx, zhiWx: ZHI_DETAIL[zhi].wx,
      dishis: dishis, nayin: nayin, kong: kong
    };
  }
  var py = pillar('y'), pm = pillar('m'), pd = pillar('d'), pt = pillar('t');
  var pillars = [py, pm, pd, pt];

  /* ---------- 五行能量统计（加权） ---------- */
  var energy = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  var addEnergy = function (wx, w) { energy[wx] += w; };
  pillars.forEach(function (p) {
    addEnergy(GAN_DETAIL[p.gan].wx, 1);
    p.hides.forEach(function (hg, i) { addEnergy(GAN_DETAIL[hg].wx, i === 0 ? 1.4 : 0.35); });
  });

  /* ---------- 旺衰：令 / 根 / 势 ---------- */
  var dayWx = GAN_DETAIL[dayGan].wx;
  var monthZhi = pm.zhi, monthMainWx = zhiMainWx(monthZhi);
  var lingDesc, lingPoint;
  if (monthMainWx === dayWx) { lingDesc = '得令（月令主气同我）'; lingPoint = 2; }
  else if (WX_SHENG[monthMainWx] === dayWx) { lingDesc = '得令（月令生我，印旺）'; lingPoint = 2; }
  else if (WX_SHENG[dayWx] === monthMainWx) { lingDesc = '失令（月令为我所泄，食伤旺）'; lingPoint = 0; }
  else if (WX_KE[dayWx] === monthMainWx) { lingDesc = '失令（月令为我所克，财旺）'; lingPoint = 0; }
  else { lingDesc = '失令（月令克我，官杀旺）'; lingPoint = 0; }

  var genCount = 0, ganHelp = 0;
  var rootList = [];
  pillars.forEach(function (p) {
    p.hides.forEach(function (hg, i) {
      if (GAN_DETAIL[hg].wx === dayWx) { genCount++; if (i === 0) rootList.push(p.zhi + '（本气）'); }
    });
  });
  [py, pm, pt].forEach(function (p) {
    var rel = relOf(dayGan, p.gan);
    if (rel === '同' || rel === '生我') ganHelp++;
  });

  var strength;
  if (lingPoint === 2) {
    if (genCount >= 3) strength = '身强';
    else if (genCount >= 1) strength = '偏强';
    else strength = (ganHelp >= 2) ? '偏强' : '中和';
  } else {
    if (genCount === 0) strength = (ganHelp <= 0) ? '身弱' : (ganHelp === 1 ? '偏弱' : '中和');
    else if (genCount === 1) strength = (ganHelp >= 1) ? '中和' : '偏弱';
    else strength = '中和';
  }

  /* ---------- 喜用 / 忌神（扶抑取法，供参考） ---------- */
  function findWhoSheng(wx) { for (var i = 0; i < WX_ORDER.length; i++) if (WX_SHENG[WX_ORDER[i]] === wx) return WX_ORDER[i]; return ''; }
  function findWhoKe(wx) { for (var i = 0; i < WX_ORDER.length; i++) if (WX_KE[WX_ORDER[i]] === wx) return WX_ORDER[i]; return ''; }
  var yinWx = findWhoSheng(dayWx);
  var guanWx = findWhoKe(dayWx);
  var shiShangWx = WX_SHENG[dayWx];
  var caiWx = WX_KE[dayWx];
  var xi = [], ji = [];
  if (strength === '身强' || strength === '偏强') { xi = [guanWx, shiShangWx, caiWx]; ji = [dayWx, yinWx]; }
  else if (strength === '身弱' || strength === '偏弱') { xi = [yinWx, dayWx]; ji = [shiShangWx, guanWx, caiWx]; }
  xi = unique(xi); ji = unique(ji);

  var sortedWx = WX_ORDER.slice().sort(function (a, b) { return energy[b] - energy[a]; });
  var least = sortedWx[sortedWx.length - 1], most = sortedWx[0];
  var lackNote = '五行能量最高为「' + most + '」、最低为「' + least + '」' +
    (energy[least] === 0 ? '，' + least + ' 完全不见（可从名字、颜色、方位略作补益）' : '，偏枯不算极端') + '。仅供参考，不必强行对号入座。';

  /* ---------- 大运 ---------- */
  var yun = ec.getYun(opts.sex, opts.sect || 2);
  var dayuns = yun.getDaYun(12);
  var steps = [];
  for (var i = 1; i < dayuns.length; i++) {
    var dy = dayuns[i];
    var gz = dy.getGanZhi();
    var zhi = gz.charAt(1);
    var zhiHides = ZHI_DETAIL[zhi].hide;
    steps.push({
      index: i,
      startYear: dy.getStartYear(), endYear: dy.getEndYear(),
      startAge: dy.getStartAge(), endAge: dy.getEndAge(),
      gan: gz.charAt(0), zhi: zhi,
      ganSS: shiShenName(dayGan, gz.charAt(0)),
      zhiHide: zhiHides,
      zhiHideSS: zhiHides.map(function (hg) { return shiShenName(dayGan, hg); }),
      shengxiao: ZHI_DETAIL[zhi].shengxiao
    });
  }
  var nowY = new Date().getFullYear();
  var nowAge = nowY - opts.y + 1;

  var r = {
    sex: opts.sex,
    solar: solar, lunar: lunar, ec: ec,
    dayGan: dayGan,
    pillars: pillars,
    energy: energy,
    strength: strength,
    lingDesc: lingDesc, genCount: genCount, ganHelp: ganHelp, rootList: rootList,
    xi: xi, ji: ji, lackNote: lackNote,
    sortedWx: sortedWx, most: most, least: least,
    yun: yun, steps: steps, nowY: nowY, nowAge: nowAge,
    taiYuan: ec.getTaiYuan(), taiYuanNaYin: ec.getTaiYuanNaYin(),
    mingGong: ec.getMingGong(), mingGongNaYin: ec.getMingGongNaYin(),
    shenGong: ec.getShenGong(), shenGongNaYin: ec.getShenGongNaYin()
  };
  r.shen = computeShenSha(r);
  return r;
}

/* ============================================================
 * 命书白话 buildSummary
 * ============================================================ */
function buildSummary(r) {
  var parts = [];
  var dm = GAN_DETAIL[r.dayGan];
  var dmZhi = r.pillars[2].zhi;
  var zhiInfo = ZHI_DETAIL[dmZhi];
  var yyy = r.lunar.getYearInChinese();
  parts.push('「' + r.dayGan + '」' + dm.yy + dm.wx + '（' + dm.image + '）是您的日主，代表您本人。生于' + yyy + '年属' + ZHI_DETAIL[r.pillars[0].zhi].shengxiao + '，日坐「' + dmZhi + '」' + zhiInfo.nature);
  parts.push('个性上，' + dm.nature + dm.like);
  parts.push('格局强弱：' + r.strength + '。' + r.lingDesc + '，地支通根 ' + (r.rootList.length || 0) + ' 位' + (r.rootList.length ? '（' + r.rootList.join('、') + '）' : '') + '，透干比肩印绶 ' + r.ganHelp + ' 个。');

  var ssTop = [];
  r.pillars.forEach(function (p) {
    if (p.key === 'd') return;
    var n = p.ganSS;
    var seen = false;
    ssTop.forEach(function (s) { if (s.n === n) { s.c++; seen = true; } });
    if (!seen) ssTop.push({ n: n, c: 1 });
  });
  var ssText = ssTop.map(function (s) { return s.n + '×' + s.c; }).join('、');
  parts.push('命局十神：' + ssText + '。' + ssTop.map(function (s) { return '「' + s.n + '」' + (SHI_SHEN_DESC[s.n] ? SHI_SHEN_DESC[s.n].text : ''); }).join('；'));

  if (r.strength === '中和') {
    parts.push('五行能量：' + r.sortedWx.map(function (w) { return w + ' ' + Math.round(r.energy[w] * 10) / 10; }).join('、') + '。命局中和，贵在流通，顺势而为最省力。' + r.lackNote);
  } else if (r.strength === '身强' || r.strength === '偏强') {
    parts.push('五行能量：' + r.sortedWx.map(function (w) { return w + ' ' + Math.round(r.energy[w] * 10) / 10; }).join('、') + '。按扶抑法参考，日主气盛，喜用「克泄耗」——官杀管束、食伤发挥、财星经营，方向为「' + r.xi.join('、') + '」；忌再多添帮身的印比「' + r.ji.join('、') + '」。' + lifeTip(r.xi[0]) + r.lackNote);
  } else {
    parts.push('五行能量：' + r.sortedWx.map(function (w) { return w + ' ' + Math.round(r.energy[w] * 10) / 10; }).join('、') + '。按扶抑法参考，日主偏弱，喜用「印比」生扶——印绶护身、比劫帮身，方向为「' + r.xi.join('、') + '」；忌再多「' + r.ji.join('、') + '」去泄克耗。' + lifeTip(r.xi[0]) + r.lackNote);
  }

  var cur = null;
  r.steps.forEach(function (s) { if (r.nowY >= s.startYear && r.nowY <= s.endYear) cur = s; });
  var stepTxt = cur ? '您如今正行第 ' + cur.index + ' 步大运「' + cur.gan + cur.zhi + '」（' + cur.startAge + '–' + cur.endAge + '岁，' + cur.startYear + '–' + cur.endYear + '年），' +
    (SHI_SHEN_DESC[cur.ganSS] ? '此运天干「' + cur.ganSS + '」主事，' + SHI_SHEN_DESC[cur.ganSS].text : '') : '';
  if (stepTxt) parts.push(stepTxt);
  return parts;
}

/* ============================================================
 * 干支小关系工具（仅本文件内使用：转折点 / 流年应期）
 * ============================================================ */
var REL_HE = [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']];
var REL_CHONG = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']];
var REL_HAI = [['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']];
var REL_XING = [['子', '卯'], ['寅', '巳'], ['寅', '申'], ['巳', '申'], ['丑', '戌'], ['丑', '未'], ['戌', '未']];
function zRel(a, b) {
  if (!a || !b || a === b) return '';
  var i, p;
  for (i = 0; i < REL_CHONG.length; i++) { p = REL_CHONG[i]; if ((p[0] === a && p[1] === b) || (p[0] === b && p[1] === a)) return '六冲'; }
  for (i = 0; i < REL_HAI.length; i++) { p = REL_HAI[i]; if ((p[0] === a && p[1] === b) || (p[0] === b && p[1] === a)) return '六害'; }
  for (i = 0; i < REL_HE.length; i++) { p = REL_HE[i]; if ((p[0] === a && p[1] === b) || (p[0] === b && p[1] === a)) return '六合'; }
  for (i = 0; i < REL_XING.length; i++) { p = REL_XING[i]; if ((p[0] === a && p[1] === b) || (p[0] === b && p[1] === a)) return '三刑'; }
  return '';
}
function gzOfYear(yy) { return Solar.fromYmd(yy, 6, 1).getLunar().getYearInGanZhiExact(); }
function ganKeYes(a, b) {
  var wa = GAN_DETAIL[a].wx, wb = GAN_DETAIL[b].wx;
  return WX_KE[wa] === wb || WX_KE[wb] === wa;
}

/* ============================================================
 * 命运转折点 · 岁运脉络（白话总结内）
 * ============================================================ */
var TURN_THEMES = {
  '正官': '名分与责任上肩的十年——晋升、考编、签约、立身多以“被需要”的方式到来',
  '七杀': '高压破局的十年——扛得住大任便升维，顶不住就先把性子磨圆再图远，忌硬碰硬',
  '正财': '安家立业的十年——进账走正道，婚嫁置业、口碑生意多在这一程落定',
  '偏财': '财路拓宽的十年——机会、应酬、合伙投资纷至，广进也须广守',
  '食神': '开花结果的十年——才华变现、作品立名、口福与亲子之乐最为丰盈',
  '伤官': '破旧立新的十年——转型、创业、表达欲强；锋芒配上耐性，才不伤人伤己',
  '正印': '充电与庇护的十年——读书考证、贵人提携、买房安家，靠山最实的阶段',
  '偏印': '钻研与静修的十年——偏门才艺与冷门学问易出成绩，注意想法先行、落地要快',
  '比肩': '自立与结盟的十年——同行者众、合伙机会多，钱财往来务必账目分明',
  '劫财': '竞争与洗牌的十年——人事变动、利益分争难免，先守财而后拓疆'
};
function buildTurningPointsHTML(r) {
  var dayGz = r.pillars[2].gan + r.pillars[2].zhi;
  var dZ = r.pillars[2].zhi, mZ = r.pillars[1].zhi;
  var h = '<div class="fate-t">命运转折点 · 岁运脉络</div>';
  h += '<div class="ft-note">大运十年一转，人生剧烈的“变”多落在换运前后与岁运相冲、相并之年。下表逐段标出每步大运的主题与值得记一笔的应期年份（公历年份，干支以立春为界）。今日回看的“转折”，大多早已写在岁运的目录里。</div>';
  r.steps.forEach(function (s) {
    var theme = TURN_THEMES[s.ganSS] || '此运大势由「' + s.ganSS + '」主导';
    var extra = '';
    var rm = zRel(s.zhi, mZ), rd = zRel(s.zhi, dZ);
    if (rm === '六冲') extra = '运支冲提纲（月柱），此段“环境级”变动多——迁居、换城、换跑道、家宅翻新易集中出现';
    else if (rd === '六冲') extra = '运支冲配偶宫，感情与身心在此段多有起伏考验';
    else if (rd === '六合') extra = '运支合配偶宫，姻缘合动、婚恋定局多发生在这一程';
    else if (rd === '三刑') extra = '运支刑配偶宫，情感易内耗拉扯，先安内再攘外';
    else if (rd === '六害') extra = '运支害配偶宫，防消耗型纠缠，清醒止损是上策';
    var ks = [];
    for (var yy = s.startYear; yy <= s.endYear && ks.length < 3; yy++) {
      var gz = gzOfYear(yy);
      var tags = [];
      if ((s.gan + s.zhi) === gz) tags.push('岁运并临');
      var dc = zRel(gz.charAt(1), dZ);
      if (gz === dayGz) tags.push('与日柱伏吟');
      else if (dc === '六冲' && ganKeYes(gz.charAt(0), r.dayGan)) tags.push('日柱天克地冲');
      else if (dc === '六冲') tags.push('冲夫妻宫');
      else if (dc === '六合') tags.push('合动夫妻宫');
      else if (dc === '三刑') tags.push('刑夫妻宫');
      else if (dc === '六害') tags.push('害夫妻宫');
      var mc = zRel(gz.charAt(1), mZ);
      if (mc === '六冲') tags.push('冲提纲');
      else if (mc === '六合') tags.push('合动提纲');
      if (tags.length) ks.push(yy + '·' + gz + '：' + tags.join('、'));
    }
    h += '<div class="turn-row">';
    h += '<div class="tg-wh">第' + s.index + '步<br>' + s.startAge + '–' + s.endAge + '岁<br><i>' + s.startYear + '–' + s.endYear + '</i></div>';
    h += '<div class="tg-cc"><b class="tg-gz">「' + s.gan + s.zhi + '」</b> · ' + s.ganSS + '：' + theme + (extra ? '。' + extra : '') +
      (ks.length ? '<div class="tg-key">转折应期：' + ks.join('；') + '</div>' : '') + '</div>';
    h += '</div>';
  });
  h += '<div class="ft-note">“应期”只提示那几年气场剧烈度上升，结果好坏一半在自己：逢冲年忌冲动决定，逢伏吟、并临之年宜低调守成、复盘再进。</div>';
  return h;
}

/* ============================================================
 * 未来一年 · 大事提示（不粉饰，好话坏话都说）
 * ============================================================ */
var YEAR_TONES = {
  '正官': ['正官主“正式名分与上升”——考编、晋升、竞聘、签约容易成，走的是被人看见的正路，宜主动争取名分与职位。', '规矩也跟着来了：上级施压、规则收紧、文书差错都易发；这年“稳”比“冲”值钱，忌意气用事、忌与领导硬顶。'],
  '七杀': ['七杀主“强敌与高墙”——顶上去就是跃迁年，竞争、晋升、跨界全在考验胆识，拼出来身价翻倍。', '这年的不好明摆着：压力透支、睡眠下滑、口舌是非、意外磕碰都容易找上门；远离高危刺激与灰色地带，体检与保险别拖。'],
  '正财': ['正财主“落袋”——薪资、主业、置业之年，努力能被折算成实打实的进账，宜把技能换现。', '钱一多，打主意的人也多：防借钱、防合伙分账不清、防高息理财与冲动消费；男命逢正财年也易动婚恋念头，想清楚再承诺。'],
  '偏财': ['偏财主“机会”——投资、副业、应酬谈判易有斩获，来财的路不止一条，小步快跑试。', '来得快也去得急：忌加杠杆、忌赌性下注、忌“跟着感觉重仓”；酒局应酬最伤身，横财落袋才算数。'],
  '食神': ['食神主“开花结果”——作品口碑、孕育添丁、口福与享乐都有福气，日子有滋味，表达欲也旺。', '别安逸过头：体重、拖延与“差不多就行”会吃掉好运气；孕产相关家庭留意劳逸与产检安排。'],
  '伤官': ['伤官主“破与立”——才华憋够了就该亮出来，跳槽、创业、新赛道、个人品牌都有窗口。', '伤官也主嘴与笔：口舌是非、官非合同、与领导较劲、冲动裸辞是这一年最常见的坑；话到嘴边留三分，白纸黑字看清楚。'],
  '正印': ['正印主“伞”——贵人、长辈、读书考证、买房安家都旺，靠山最明显，宜借力进阶。', '太顺会被“养懒”：安排多了自己主张就薄了；也要防长辈健康与房产手续的拖沓，机会给你时要接得住。'],
  '偏印': ['偏印主“偏门学问”——研究、玄学、冷门技能、幕后修炼是这一年的正果，闷声能发财。', '多思多虑伤神：行动跟不上想法易误事；防被骗被画饼、防慢性小病拖成老病，定期检查别省。'],
  '比肩': ['比肩主“同路人”——合伙组队、老友重逢、同辈提携，人多力量大，宜结盟共享。', '分饼的人也多：资源摊薄、被借力打力；重大签字别只听兄弟义气，账目合同先立后交。'],
  '劫财': ['劫财主“竞争与争夺”——行动力爆发、敢抢敢拼是好事，运动与冲劲都够旺。', '破财高发年：防盗防骗防担保、忌赌忌投机；感情上防“半路杀出程咬金”，已婚者守好分寸。']
};
function relationRiskLines(gz, r, yunGz) {
  var out = [];
  var yG = gz.charAt(0), yZ = gz.charAt(1);
  var dayGz = r.pillars[2].gan + r.pillars[2].zhi;
  var dZ = r.pillars[2].zhi, mZ = r.pillars[1].zhi;
  var dRel = zRel(yZ, dZ), mRel = zRel(yZ, mZ);
  if (gz === dayGz) out.push('流年与日柱同干支（伏吟）——自我状态“重影”之年：婚育、搬迁、职业切换或健康低谷皆易显现，是十年里最需留神的年份之一，凡事缓三分');
  else if (dRel === '六冲' && ganKeYes(yG, r.dayGan)) out.push('流年与日柱天克地冲（反吟）——气场大洗牌之象：婚恋、健康、工作身份都可能被推着“换一版”，决定务必三思、重要契约找人把关');
  else if (dRel === '六冲') out.push('流年冲夫妻宫——感情多变动：单身者易分分合合、闪聚闪散；已婚者防聚少离多与激烈争执，重要日子留足缓冲');
  else if (dRel === '三刑') out.push('流年刑夫妻宫——关系里容易“较劲”，彼此都累；给空间、别翻旧账，是这一年的感情功课');
  else if (dRel === '六害') out.push('流年害夫妻宫——情感有暗流：多因误会与旧账起波澜，宜当面说清，忌冷战积怨');
  if (mRel === '六冲') out.push('流年冲提纲（月柱）——变动之年：换岗、搬家、求学异地、家宅与长辈事宜集中，动中求安即可，勿在气头上做重大决定');
  else if (mRel === '六合') out.push('流年合提纲——根基被合动：家宅房产、长辈与文书相关有进展，但签约过户务必看仔细');
  if (yunGz && gz === yunGz) out.push('岁运并临——流年与大运同柱，吉凶皆放大一倍：好年勿骄、难年勿躁，这一年“稳住即赢”');
  else if (yunGz) {
    var yr = zRel(yZ, yunGz.charAt(1));
    if (yr === '六冲') out.push('流年与大运相冲——内外夹击之象：宜收紧现金流、稳住主业，忌高风险梭哈与意气之争');
  }
  var taoHit = [], maHit = [];
  r.pillars.forEach(function (p) {
    if (p.zhi !== yZ) return;
    (p.sha || []).forEach(function (s) {
      if (s.name.indexOf('桃花') > -1) taoHit.push(PILLAR_NAME[p.key]);
      if (s.name === '驿马') maHit.push(PILLAR_NAME[p.key]);
    });
  });
  if (maHit.length) out.push('流年逢原局驿马之位——出行远行、出差调动概率高：行程与交通安全多留意，异地合同看清条款再签');
  if (taoHit.length) out.push('流年与原局桃花重逢——异性缘热闹：单身者桃花可期但防“快热快冷”；已有伴侣者，分寸请自己攥好');
  return out;
}
function buildYearAheadHTML(r) {
  var nowY = r.nowY, nextY = nowY + 1;
  var curGz = gzOfYear(nowY), nxtGz = gzOfYear(nextY);
  var curSS = shiShenName(r.dayGan, curGz.charAt(0));
  var nxtSS = shiShenName(r.dayGan, nxtGz.charAt(0));
  var cur = null, nxt = null;
  r.steps.forEach(function (s) { if (nowY >= s.startYear && nowY <= s.endYear) cur = s; });
  r.steps.forEach(function (s) { if (cur && s.index === cur.index + 1) nxt = s; });
  var curYunGz = cur ? cur.gan + cur.zhi : '';
  var h = '<div class="fate-t">未来一年 · 大事提示（不粉饰）</div>';
  h += '<div class="ft-note">原点为当下：' + nowY + ' ' + curGz + ' 岁（至 ' + nextY + ' 年 2 月 4 日立春交入 ' + nxtGz + ' 岁）。流年主“事”，以下把顺的逆的都摊开讲——真正的价值，往往藏在“注意”二字里。</div>';
  h += '<div class="ft-line"><span class="ft-tag g">当下主线</span><b>' + curGz + ' · ' + curSS + '岁：</b>' + (YEAR_TONES[curSS] ? YEAR_TONES[curSS][0] : '') + '</div>';
  h += '<div class="ft-line"><span class="ft-tag r">当下注意</span><b>' + curGz + ' · ' + curSS + '岁：</b>' + (YEAR_TONES[curSS] ? YEAR_TONES[curSS][1] : '') + '</div>';
  h += '<div class="ft-line"><span class="ft-tag g">来岁主线</span><b>' + nxtGz + ' · ' + nxtSS + '岁：</b>' + (YEAR_TONES[nxtSS] ? YEAR_TONES[nxtSS][0] : '') + '</div>';
  h += '<div class="ft-line"><span class="ft-tag r">来岁警示</span><b>' + nxtGz + ' · ' + nxtSS + '岁：</b>' + (YEAR_TONES[nxtSS] ? YEAR_TONES[nxtSS][1] : '') + '</div>';
  var nxtRisks = relationRiskLines(nxtGz, r, curYunGz);
  if (nxtRisks.length) nxtRisks.forEach(function (x) { h += '<div class="ft-line"><span class="ft-tag r">来岁应象</span>' + x + '</div>'; });
  var curRisks = relationRiskLines(curGz, r, curYunGz);
  var curStrong = [];
  curRisks.forEach(function (x) { if (x.indexOf('伏吟') > -1 || x.indexOf('反吟') > -1 || x.indexOf('并临') > -1 || x.indexOf('冲') > -1) curStrong.push(x); });
  curStrong.forEach(function (x) {
    if (nxtRisks.indexOf(x) === -1) h += '<div class="ft-line"><span class="ft-tag r">今岁提醒</span>' + x + '</div>';
  });
  if (nxt) h += '<div class="ft-line"><span class="ft-tag g">换运预告</span>距换入第 ' + nxt.index + ' 步大运「' + nxt.gan + nxt.zhi + '」（' + nxt.startYear + ' 年起）约 ' + (nxt.startYear - nowY) + ' 年。换运前后一两年，人事环境常“先动后稳”：想落子的大决定，宜在这两年想清楚、分批落地。</div>';
  h += '<div class="ft-note">命书说“趋吉”靠的不是嘴硬，是行为：逢克冲之年主动做体检、理财务、修文书，把大事化小、小事化了，才是真正在改运。</div>';
  return h;
}

/* ============================================================
 * 六维断事分析（事业 / 学业 / 财运 / 感情婚姻 / 健康 / 六亲）
 * ============================================================ */
function countSS(r, names) {
  var n = 0;
  r.pillars.forEach(function (p) {
    if (names.indexOf(p.ganSS) > -1 && p.key !== 'd') n++;
    p.hideSS.forEach(function (s) { if (names.indexOf(s) > -1) n++; });
  });
  return n;
}
function topWhere(r, names) {
  var w = [];
  r.pillars.forEach(function (p) {
    if (p.key !== 'd' && names.indexOf(p.ganSS) > -1) w.push(PILLAR_NAME[p.key]);
  });
  return w;
}
function zhiWhere(r, names) {
  var w = [];
  r.pillars.forEach(function (p) {
    if (p.hideSS[0] && names.indexOf(p.hideSS[0]) > -1) w.push(PILLAR_NAME[p.key] + '支');
  });
  return w;
}
function ssAt(r, key) { return r.pillars[['y', 'm', 'd', 't'].indexOf(key)].ganSS; }

function buildDimAnalysis(r) {
  var sexTxt = (r.sex === 1) ? '男' : '女';
  var dm = GAN_DETAIL[r.dayGan];
  var dims = [];
  function addLines(t, lines) { dims.push({ t: t, lines: lines }); }
  function L(s, w) { return { s: s, w: w }; }

  /* ========== 事业 ========== */
  var career = [];
  var guanTop = topWhere(r, ['正官', '七杀']);
  var yinTop = topWhere(r, ['正印', '偏印']);
  var caiTop = topWhere(r, ['正财', '偏财']);
  var shishangTop = topWhere(r, ['食神', '伤官']);
  var biTop = topWhere(r, ['比肩', '劫财']);
  if (guanTop.length) {
    career.push(L('官杀是事业与名分之星，明透于' + guanTop.join('、') + '，宜在规则清晰的环境立身（管理、公职、大机构）；压力会推着你向上走，也需学会放松。',
      '依据：官杀透干主责任与约束，宜向对应的规则型行业发力'));
  } else if (countSS(r, ['正官', '七杀']) === 0) {
    career.push(L('四柱不见官杀明现，事业上不爱被人管、少走体制内的路更自在；宜靠专业、自由职业或合伙创业寻找主场。',
      '依据：官杀不显主约束弱，命主喜自主'));
  }
  if (r.strength === '身强' || r.strength === '偏强') {
    career.push(L('身强有担当，能扛大旗。事业走向宜「' + r.xi.join('、') + '」——用官杀求规范晋升、用食伤发挥才华、用财星做实绩经营。',
      '依据：扶抑法喜克泄耗'));
  } else if (r.strength === '身弱' || r.strength === '偏弱') {
    career.push(L('身弱主劳心，事业上"先跟对人、再选对路"，背后要有靠（印比），不宜孤军奋战冲在最前。',
      '依据：扶抑法喜印比生扶'));
  }
  if (shishangTop.length) career.push(L('食伤透' + shishangTop.join('、') + '，才华输出型选手——技术、创意、表达相关事业容易出成绩；' + (yinTop.length ? '且印星同透，属于"有想法也能落地"的组合。' : '但若印星弱，想得多更要练成体系。'), '依据：食伤主才，印主成'));
  var ma = false, jiang = false;
  r.pillars.forEach(function (p) { p.sha.forEach(function (s) { if (s.name === '驿马') ma = true; if (s.name === '将星') jiang = true; }); });
  if (ma) career.push(L('命带驿马，动中求财——出差、外埠、流动型岗位比"一张桌子坐到老"更旺你。', '依据：驿马坐支主迁移走动'));
  if (jiang) career.push(L('命带将星，天生有带团队、镇场子的气场，宜挑担子、做带头人。', '依据：将星主掌权统御'));
  if (!career.length) career.push(L('事业以"守正出奇"为宜：把本业做扎实，再谋副业与斜杠；每年立春换运时复盘一次方向。', '依据：原局平和，随运而行'));
  addLines('事业 · 职业方向', career);

  /* ========== 学业 ========== */
  var study = [];
  var yinCnt = countSS(r, ['正印', '偏印']);
  var shangCnt = countSS(r, ['食神', '伤官']);
  if (yinCnt >= 2) study.push(L('印星厚重（' + yinCnt + ' 处），读书有天分，属"坐得住、学得进"的类型，学历与师长缘分深。', '依据：印主学问文书庇护'));
  else if (yinCnt === 1) study.push(L('印星有一处，求学得人指点，肯学便有长进；多在关键阶段遇上好老师。', '依据：正偏印主学问贵人'));
  else study.push(L('印星稀薄，课堂之外靠自己悟的多——把兴趣做成擅长，反而更容易出成果。', '依据：印弱则不依赖文凭路线'));
  var wenchangAt = [];
  r.pillars.forEach(function (p) { p.sha.forEach(function (s) { if (s.name === '文昌贵人') wenchangAt.push(PILLAR_NAME[p.key]); }); });
  if (wenchangAt.length) study.push(L('文昌贵人落' + wenchangAt.join('、') + '，考试文书顺遂，笔试、考证、申请之类的事多能心想事成。', '依据：文昌主考试文书'));
  if (shangCnt >= 2) study.push(L('食伤偏旺（' + shangCnt + ' 处），脑子活、学得快，但注意力容易被兴趣带跑；宜用"做项目、考证书"等有反馈的方式学习。', '依据：食伤主才思发散'));
  if (shangCnt >= 1 && yinCnt >= 1) study.push(L('食伤配印，学新东西既能举一反三，也能沉淀成体系，适合深造与跨界。', '依据：印食相济，学而有成'));
  if (r.strength === '身弱' || r.strength === '偏弱') study.push(L('身弱须养，长期冲刺前先保睡眠与运动——状态在线，学习效率才在线。', '依据：身弱者精神易透支'));
  if (!study.length) study.push(L('学业宜"以专取胜"：选定一个方向深扎三年，胜过东一榔头西一棒。', '依据：原局平淡，贵在专注'));
  addLines('学业 · 读书才艺', study);

  /* ========== 财运 ========== */
  var wealth = [];
  var caiCnt = countSS(r, ['正财', '偏财']);
  var zc = countSS(r, ['正财']), pc = countSS(r, ['偏财']);
  var zhengcaiTop = topWhere(r, ['正财']), piancaiTop = topWhere(r, ['偏财']);
  if (zc > pc && zc > 0) wealth.push(L('正财为主、透' + zhengcaiTop.join('、') + '，财路"正"字当头：工资、本业、口碑生意稳扎稳打，最忌一夜暴富的念头。', '依据：正财主正当稳定之财'));
  if (pc >= zc && pc > 0) wealth.push(L('偏财有气、透' + piancaiTop.join('、') + '，对机会与市场的嗅觉敏锐，适合副业、投资、资源撮合；但来去也快，宜设好止盈止损线。', '依据：偏财主流动之财'));
  if (caiCnt === 0) wealth.push(L('财星不显于干支明处，并非无财，而是财"藏得深"——多在能力、积累与时机里；不追快钱，反有厚积之财。', '依据：财不现主深藏待发'));
  if (r.strength === '身强' || r.strength === '偏强') wealth.push(L('身强能担财，敢想敢干有赚钱的底气，宜主动拓财、落袋为安。', '依据：身强胜财'));
  else wealth.push(L('身弱财多须"借力"：宜先做强自己（进修、健身、口碑），再让专业团队替你管钱管项目，切忌全仓押注。', '依据：身弱不胜财，先立身再求财'));
  var ku = [];
  r.pillars.forEach(function (p) {
    var kz = p.zhi;
    var isKu = (kz === '辰' || kz === '戌' || kz === '丑' || kz === '未');
    if (isKu && (p.hideSS[0] === '正财' || p.hideSS[0] === '偏财')) ku.push(PILLAR_NAME[p.key]);
  });
  if (ku.length) wealth.push(L('财星坐库（' + ku.join('、') + '），天生"存得住钱"，适合置业储蓄；逢冲库之运（辰戌丑未被冲）往往是财富变现的应期。', '依据：财入库主储蓄守成'));
  if (biTop.length) wealth.push(L('比劫见' + biTop.join('、') + '，钱上容易被人"惦记"：合伙要签明白账，借钱写欠条，别碍于情面。', '依据：比劫主分夺之象'));
  if (!wealth.length) wealth.push(L('财以稳为主：主业之外培养一项能变现的技能，财运会像滚雪球一样慢慢起来。', '依据：原局财弱以养待时'));
  addLines('财运 · 求财路径', wealth);

  /* ========== 感情婚姻 ========== */
  var love = [];
  var pd = r.pillars[2];
  var spZhi = pd.hideSS[0];
  var sexDesc = (r.sex === 1) ? SIX_MAP.男 : SIX_MAP.女;
  love.push(L('日支是配偶宫，坐「' + pd.zhi + '」藏干 ' + pd.hides.map(function (g, i) { return g + '（' + pd.hideSS[i] + '）'; }).join('、') + '——配偶宫主气为「' + spZhi + '」，',
    '依据：日支配偶宫，主对方与婚姻质量'));
  if (spZhi === '正财' && r.sex === 1) love.push(L('妻星坐配偶宫，正缘靠谱、娶贤持家之人，婚姻多有实在的依托。', '依据：男命正财为妻，坐宫有力'));
  else if (spZhi === '正官' && r.sex === 0) love.push(L('夫星坐配偶宫，正缘端正稳重、能给你安全感，是"嫁对了人"的配置。', '依据：女命正官为夫，坐宫有力'));
  else if (spZhi === '比肩' || spZhi === '劫财') love.push(L('配偶宫坐比劫，感情里易有竞争者，或自己习惯先"爱自己"——宜学会让渡与共享，晚婚反而更稳。', '依据：比劫坐婚宫主竞争与自我'));
  else if (spZhi === '食神' || spZhi === '伤官') love.push(L('配偶宫坐食伤，你对伴侣既宠又挑：付出型但也高标准，宜把"要求"换成"商量"。', '依据：食伤坐婚宫主付出与挑剔并存'));
  else if (spZhi === '正印' || spZhi === '偏印') love.push(L('配偶宫坐印星，另一半常如师如母/如兄如父般照顾你，婚姻里安全感到位。', '依据：印坐婚宫主庇护型伴侣'));

  var stars = sexDesc.spouse;
  var spTop = topWhere(r, stars);
  if (spTop.length) {
    if (r.sex === 1) love.push(L('妻星（财）明透' + spTop.join('、') + '，姻缘信号清晰，' + (r.pillars[0].ganSS === '正财' || r.pillars[0].ganSS === '偏财' ? '年上现则缘来较早' : '年月柱现多在青年期') + '；' + (piancaiTop.length && zhengcaiTop.length ? '正偏财俱透，感情须专一，忌犹豫贪多。' : ''), '依据：男命财星为妻，透处见缘'));
  } else {
    love.push(L('妻星（财）不显于干，姻缘多靠人介绍、相亲成局，或婚后感情渐入佳境——不必羡慕早恋早婚，稳的才长久。', '依据：财星隐，姻缘后发'));
  }
  if (r.sex === 0) {
    if (topWhere(r, ['伤官']).length) love.push(L('女命伤官透，才情与脾气都外放，恋爱中容易"话赶话"伤到对方——柔软一点，关系会顺很多。', '依据：女命伤官克官，宜柔化'));
    var guanShas = countSS(r, ['正官', '七杀']);
    if (guanShas >= 3) love.push(L('官杀多现，异性缘旺但选择多也心乱，宜先想清楚"我要什么"再进入关系。', '依据：官杀混杂主桃花多而杂'));
  } else {
    if (biTop.length >= 2) love.push(L('比劫较重，情路上易遇竞争或破费讨好——把魅力放在本事上，比追在身后更动人。', '依据：比劫夺财之象'));
  }
  var tao = [];
  r.pillars.forEach(function (p) { p.sha.forEach(function (s) { if (s.name.indexOf('桃花') > -1) tao.push(PILLAR_NAME[p.key]); }); });
  if (tao.length) love.push(L('桃花落' + tao.join('、') + '，' + (tao.indexOf('日柱') > -1 || tao.indexOf('时柱') > -1 ? '主命主本人有魅力、正缘桃花在后半场，' : '主早年人缘与异性缘来得早，') + '单身时宜广结善缘；已婚者则注意保持分寸。', '依据：桃花星位置定早缘晚缘'));
  if (!love.length) love.push(L('感情以"真诚慢热"为宜：先做朋友、再看三观，婚姻比恋爱更需要经营。', '依据：原局姻缘平淡，用心则圆'));
  addLines('感情 · 婚姻缘分', love);

  /* ========== 健康 ========== */
  var health = [];
  var most = r.most, least = r.least;
  health.push(L('五行能量最旺为「' + most + '」、最弱为「' + least + '」。传统以旺者为"有余"、弱者为"不足"来提示养护重点，仅供参考。', '依据：五行偏枯论'));
  if (WX_LIFE[most]) health.push(L('「' + most + '」过旺时，注意' + WX_LIFE[most].body + '的疏泄与放松；性格上也别把' + (most === '火' ? '急' : most === '金' ? '刚' : most === '水' ? '郁' : most === '木' ? '绷' : '思') + '都自己扛。', '依据：旺者防其脏腑过载'));
  if (WX_LIFE[least]) health.push(L('「' + least + '」偏弱，日常可多吃补' + least + '之食、' + (WX_LIFE[least].color ? '多亲近' + WX_LIFE[least].color + '色环境' : '') + '，微调不必刻意，但方向可循。', '依据：弱者宜补益'));
  if (r.strength === '身弱' || r.strength === '偏弱') health.push(L('身弱易累，重点在"蓄"：规律睡眠 > 一切补品，别硬扛夜与高压。', '依据：身弱者气易亏'));
  var yang = [];
  r.pillars.forEach(function (p) { p.sha.forEach(function (s) { if (s.name === '羊刃') yang.push(PILLAR_NAME[p.key]); }); });
  if (yang.length) health.push(L('羊刃在' + yang.join('、') + '，气血与爆发力都强，但性子急易有磕碰炎症——运动先热身，开车别斗气。', '依据：羊刃主刚烈冲动'));
  var qi = [];
  r.pillars.forEach(function (p) { p.sha.forEach(function (s) { if (s.name === '七杀') qi.push(PILLAR_NAME[p.key]); }); });
  if (qi.length && false) { /* noop */ }
  if (r.strength === '身弱' || r.strength === '偏弱') {
    if (countSS(r, ['七杀']) >= 2) health.push(L('官杀较重而身不强，精神压力偏大，易失眠、偏头痛——定期"断电"休息很重要。', '依据：杀重身轻，神劳之象'));
  }
  if (!health.length) health.push(L('整体原局平和，养生宜"不过度"：七分饱、常走动、少熬夜，比任何偏方都管用。', '依据：原局平稳，中庸为上'));
  addLines('健康 · 养护提示', health);

  /* ========== 六亲 ========== */
  var fam = [];
  var yP = r.pillars[0], mP = r.pillars[1], tP = r.pillars[3];
  var yinInMon = topWhere(r, ['正印', '偏印']);
  if (yinInMon.indexOf('月柱') > -1 || (mP.hideSS[0] === '正印' || mP.hideSS[0] === '偏印')) {
    fam.push(L('印星在月柱（父母宫位），与母亲的缘分深、受母亲与长辈的照料多，家里常是"温柔的后盾"。', '依据：印为母星，月柱主父母'));
  } else if (countSS(r, ['正印', '偏印']) === 0) {
    fam.push(L('全局不见印星，祖辈荫庇有限，人生多是"自己打天下"；也因此格外独立，贵人也常来自后天自己结的善缘。', '依据：印星缺位主自立'));
  } else {
    fam.push(L('印星有藏，长辈的关怀"关键时刻才显"，平时各忙各的，逢大事时他们反而是你的底气。', '依据：印藏主暗中得助'));
  }
  var caifuAt = topWhere(r, ['偏财']);
  if (r.sex === 1 && caifuAt.length) fam.push(L('偏财（传统亦作父星）透' + caifuAt.join('、') + '，与父亲的缘与助益较明显，父辈的格局与资源常给你平台。', '依据：男命偏财看父'));
  else if (r.sex === 0 && caifuAt.length) fam.push(L('偏财透' + caifuAt.join('、') + '，父亲性格开明能闯，你也遗传了那份洒脱——与父辈宜多沟通勿顶牛。', '依据：偏财主父与洒脱之气'));
  var bx = countSS(r, ['比肩', '劫财']);
  if (bx >= 3) fam.push(L('比劫重重（' + bx + ' 处），兄弟姐妹/同辈缘分厚，家里热闹、外面朋友也多；只是资源需"分杯羹"，账目明白才情长。', '依据：比劫主同辈'));
  else if (bx === 0) fam.push(L('比劫稀薄，多独生或与同辈往来清淡，习惯独来独往——其实主动走亲访友，气运更顺。', '依据：比劫缺主独行'));
  var childAt = topWhere(r, ['食神', '伤官']);
  if (tP.ganSS === '食神' || tP.ganSS === '伤官' || (tP.hideSS[0] === '食神' || tP.hideSS[0] === '伤官')) {
    fam.push(L('食伤在时柱（子女宫位）明现，子女缘佳，中年后常因孩子而收获新的盼头与欢喜。', '依据：食伤为子女星，时柱主子女'));
  } else if (countSS(r, ['食神', '伤官']) === 0) {
    fam.push(L('食伤不显，子女缘来得慢或聚少离多——不妨把这份"培育之心"先用在事业与爱好上，缘分会自然到。', '依据：食伤隐则子息缘缓'));
  }
  if (childAt.length && childAt.indexOf('时柱') === -1) fam.push(L('食伤透' + childAt.join('、') + '但不在时柱，你对晚辈/下属的用心常在，亦宜把学生、徒弟当"子女缘"来经营。', '依据：食伤同气，所出皆缘'));
  if (!fam.length) fam.push(L('六亲缘分讲"用心"：常联系父母、多走动同辈，人丁兴旺气运自旺。', '依据：宫位淡者，人缘补之'));
  addLines('六亲 · 父母子女同辈', fam);

  return dims;
}

/* ============================================================
 * 案例示范（教学性质）
 * ============================================================ */
var CASE_LIB = [
  {
    key: 'A', label: '案例一 · 坤造（女）', byText: '日主「辛」金珠玉 · 生于申月得令，身强 · 伤官生财一路流通',
    opt: { y: 1995, m: 8, d: 8, h: 8, min: 30, sex: 0, sect: 2 },
    dims: '职业/学业：辛金喜水淘洗，时上壬水伤官透出，才华灵动，宜技术、文创、表达类职业，靠本事吃饭最稳。财运：伤官生财、月透甲木正财，求财靠"手艺+口碑"，收入随专业深耕水涨船高。感情婚姻：女命伤官透时，爱憎分明、敢爱敢恨，欣赏强者也常挑剔强者——正缘宜找能接住你锋芒、给你自由的伴侣。健康：金旺须护肺与皮肤，秋冬季注意呼吸道。六亲：日坐未土印库，母缘深、中年得长辈与不动产之助。'
  },
  {
    key: 'B', label: '案例二 · 乾造（男）', byText: '日主「戊」土城墙 · 生于子月失令，双丙偏印护身 · 财旺有印，后劲厚',
    opt: { y: 2000, m: 1, d: 1, h: 8, min: 30, sex: 1, sect: 2 },
    dims: '职业/学业：戊土厚重、双丙印星相护，读书有师长提携，宜土木工程、地产、管理、教育等"根基型"行业。财运：月令子水正财当令，财路规矩扎实、工资进账稳；中年后遇火土大运，置业置产之象明显。感情婚姻：男命正财透而贴近日主，对感情专一有担当，配偶旺夫持家；惟需防兄弟朋友"借光"伤财。健康：土旺湿气重，注意脾胃运化，多运动排汗。六亲：印星重重，与母缘极深，长辈是你最强的后盾。'
  }
];

function fourText(opt) {
  try {
    var r = calcBazi(opt);
    return { four: r.pillars.map(function (p) { return p.gan + p.zhi; }).join(' '), dayGan: r.dayGan, strength: r.strength };
  } catch (e) { return null; }
}

function caseBadges(userFour, userDay, userSt, c) {
  var t = fourText(c.opt);
  if (!t) return '（历法支持范围外）';
  if (userFour && t.four.replace(/ /g, '') === userFour) return '★ 正是您此造原样（作为同盘示范）';
  if (t.dayGan === userDay && t.strength === userSt) return '○ 日主与强弱同您一致（同型参考）';
  if (t.dayGan === userDay) return '○ 日主与您相同';
  return '';
}

function renderCases(r) {
  var userFour = r.pillars.map(function (p) { return p.gan + p.zhi; }).join('');
  var h = '<div class="sec-title">断事示范 · 案例参考</div>';
  h += '<div class="plain small">以下两例以真实历法排出，断语文案为"看盘思路示范"，非针对现实个人的预测。与您同盘或同型时会自动标注，供对照体会六维断法。</div>';
  h += '<div class="case-grid">';
  CASE_LIB.forEach(function (c) {
    var t = fourText(c.opt);
    if (!t) return;
    var badge = caseBadges(userFour, r.dayGan, r.strength, c);
    h += '<div class="case-card">';
    h += '<div class="case-head">' + c.label + '<span class="case-four">' + t.four + '</span></div>';
    if (badge) h += '<div class="case-badge">' + badge + '</div>';
    h += '<div class="case-by">' + c.byText + '</div>';
    h += '<div class="case-dims">' + c.dims + '</div>';
    h += '</div>';
  });
  h += '</div>';
  return h;
}

/* ============================================================
 * HTML 渲染 renderReport（单盘专业细盘）
 * ============================================================ */
function esc(s) { return String(s); }

function shenShaBlock(r) {
  var h = '<div class="sec-title">神煞细览</div>';
  var has = false;
  var rows = '';
  r.pillars.forEach(function (p) {
    (p.sha || []).forEach(function (s) {
      has = true;
      rows += '<div class="ss-line"><b>' + PILLAR_NAME[p.key] + '</b>' + p.gan + p.zhi + '（支）见「' + s.name + '」：' + (SHEN_SHA_TEXT[s.name] || '') + '</div>';
    });
  });
  if (!has) {
    h += '<div class="plain">此造四柱不见常用神煞落位——并非没有，而是所取十数（天乙、文昌、桃花、驿马、华盖、羊刃、禄神、将星、劫煞、孤寡、红鸾等）未在其支。神煞为"彩蛋"式参考，格局与十神才是主菜。</div>';
    return h;
  }
  h += rows;
  return h;
}

function renderReport(r) {
  var h = '';
  computeShenSha(r);

  /* ---- 一句话总评 + 按事问答（放在最上面，先看结论再看盘） ---- */
  try {
    if (typeof BZSummary !== 'undefined' && BZSummary && BZSummary.html) {
      h += BZSummary.html(r, r.topic || 'overall');
    }
  } catch (e) { /* 总评出错不影响主盘渲染 */ }

  /* ---- 命主信息条 ---- */
  var zwx = ZHI_DETAIL[r.pillars[0].zhi];
  var leapTxt = (r.lunar.getMonth() < 0) ? '闰' : '';
  h += '<div class="person">';
  h += '<div><b>公历</b>' + r.solar.toYmdHms().slice(0, 16) + '</div>';
  h += '<div><b>农历</b>' + r.lunar.getYearInChinese() + '年 ' + leapTxt + r.lunar.getMonthInChinese() + '月 ' + r.lunar.getDayInChinese() + '</div>';
  h += '<div><b>生肖</b>' + zwx.shengxiao + ' &nbsp;<b>日主</b>' + r.dayGan + '（' + GAN_DETAIL[r.dayGan].wx + '）&nbsp;<b>性别</b>' + (r.sex === 1 ? '男' : '女') + '&nbsp;<b>今年</b>' + r.nowAge + ' 虚岁 &nbsp;<b>格局</b>' + geJuOf(r).ge + '</div>';
  h += '<div><b>八字</b>' + r.pillars.map(function (p) { return p.gan + p.zhi; }).join(' ') + '</div>';
  h += '</div>';

  /* ---- 四柱专业排盘 ---- */
  h += '<div class="sec-title">四柱排盘 · 专业细盘</div>';
  h += '<div class="pillars">';
  r.pillars.forEach(function (p) { h += pillarHTML(p); });
  h += '</div>';
  h += '<div class="pillars-note">每柱自上而下：天干十神 → 天干 → 地支 → 地支藏干（旁注对应十神）→ 纳音 → 日主到此支的十二长生 → 旬空 → 命带神煞。<br>' +
    PILLAR_MEAN.y + '；' + PILLAR_MEAN.m + '；' + PILLAR_MEAN.d + '；' + PILLAR_MEAN.t + '。</div>';

  /* ---- 格局 / 旺衰 / 喜忌 / 五行 ---- */
  var ge = geJuOf(r);
  h += '<div class="sec-title">格局取用 · 旺衰喜忌</div>';
  h += '<div class="summary-box">';
  h += '<p><b>格局：</b>' + ge.ge + (r.shen.kui ? '（日柱魁罡，刚毅果断）' : '') + '。' + (ge.note.length ? ge.note.join('；') + '。' : '') + '</p>';
  var dm = GAN_DETAIL[r.dayGan];
  h += '<p><b>日主：</b>「' + r.dayGan + '」' + dm.yy + dm.wx + '（' + dm.image + '），' + dm.nature + '</p>';
  h += '<p><b>强弱：</b>' + r.strength + '。' + r.lingDesc + '；地支同类藏干 ' + (r.genCount || 0) + ' 处' +
    (r.rootList.length ? '（' + r.rootList.join('、') + '）' : '') + '为根，年月时干现比印 ' + r.ganHelp + ' 个为助。' +
    (r.strength === '身强' || r.strength === '偏强' ? '气盛宜"克泄耗"，喜用参考「' + r.xi.join('、') + '」' + lifeTip(r.xi[0]) + '，忌「' + r.ji.join('、') + '」再帮。' :
      r.strength === '身弱' || r.strength === '偏弱' ? '偏弱宜"印比生扶"，喜用参考「' + r.xi.join('、') + '」' + lifeTip(r.xi[0]) + '，忌「' + r.ji.join('、') + '」多泄克耗。' : '中和之局贵在流通，不必强分喜忌。') + '</p>';
  h += '</div>';
  h += '<div class="sec-title">五行能量分布</div>';
  h += energyBar(r);
  h += '<div class="plain">' + r.lackNote + '</div>';

  /* ---- 神煞 ---- */
  h += shenShaBlock(r);

  /* ---- 胎元 / 命宫 / 身宫 ---- */
  h += '<div class="sec-title">胎元 · 命宫 · 身宫</div>';
  h += '<div class="person slim"><div><b>胎元</b>' + r.taiYuan + '（' + r.taiYuanNaYin + '）——受胎之始的气场，可看先天禀赋。</div>' +
    '<div><b>命宫</b>' + r.mingGong + '（' + r.mingGongNaYin + '）——安身立命之所，看一生大趋向。</div>' +
    '<div><b>身宫</b>' + r.shenGong + '（' + r.shenGongNaYin + '）——后天作为的舞台，看自我经营。</div></div>';

  /* ---- 大运 / 流年 ---- */
  var forwardTxt = r.yun.isForward() ? '顺行' : '逆行';
  var startSolar = r.yun.getStartSolar();
  var gzYang = isYangGan(r.ec.getYear().charAt(0));
  var dirReason = (gzYang ? '阳' : '阴') + '年' + (r.sex === 1 ? '男' : '女') + ' → ' + forwardTxt;
  h += '<div class="sec-title">起运 · 大运 · 流年</div>';
  h += '<div class="plain">起运：出生后 ' + r.yun.getStartYear() + ' 年 ' + r.yun.getStartMonth() + ' 个月 ' + r.yun.getStartDay() + ' 天（约 ' + (r.yun.getStartYear() + 1) + ' 虚岁），公历约 ' + startSolar.toYmd() + ' 交运。排法：' + dirReason + '，每十年一步大运。</div>';
  h += '<div class="dayun-list">';
  r.steps.forEach(function (s) {
    var on = (r.nowY >= s.startYear && r.nowY <= s.endYear);
    var ssd = SHI_SHEN_DESC[s.ganSS] || {};
    h += '<div class="dayun' + (on ? ' on' : '') + '">';
    h += '<div class="dy-age">' + s.startAge + '–' + s.endAge + '岁</div>';
    h += '<div class="dy-year">' + s.startYear + '–' + s.endYear + '</div>';
    h += '<div class="dy-gz" style="color:' + WX_COLOR[GAN_DETAIL[s.gan].wx] + '">' + s.gan + s.zhi + '</div>';
    h += '<div class="dy-ss">' + s.ganSS + '·' + s.shengxiao + '</div>';
    h += '<div class="dy-hide">藏 ' + s.zhiHide.map(function (g, i) { return g + s.zhiHideSS[i]; }).join(' ') + '</div>';
    h += '<div class="dy-tip">' + (ssd.text || '') + '</div>';
    if (on) h += '<div class="dy-cur">今运</div>';
    h += '</div>';
  });
  h += '</div>';

  h += '<div class="plain"><b>流年干支</b>（以每年立春为界，近十二年）：';
  for (var yy = r.nowY - 1; yy <= r.nowY + 10; yy++) {
    var ly = Solar.fromYmd(yy, 6, 1).getLunar();
    var ygz = ly.getYearInGanZhiExact();
    var ssN = shiShenName(r.dayGan, ygz.charAt(0));
    var isCur = yy === r.nowY;
    h += '<span class="liunian' + (isCur ? ' cur' : '') + '">' + yy + ' ' + ygz + '（' + ssN + (isCur ? '，今年' : '') + '）</span> ';
  }
  h += '</div>';

  /* ---- 六维断事 ---- */
  h += '<div class="sec-title">断事分析 · 六维白话</div>';
  var dims = buildDimAnalysis(r);
  h += '<div class="dim-grid">';
  dims.forEach(function (dim) {
    h += '<div class="dim-card"><div class="dim-t">' + dim.t + '</div>';
    dim.lines.forEach(function (ln) {
      h += '<div class="dim-line"><span class="dim-s">' + ln.s + '</span>' + (ln.w ? '<span class="dim-w">' + ln.w + '</span>' : '') + '</div>';
    });
    h += '</div>';
  });
  h += '</div>';

  /* ---- 案例参考 ---- */
  h += renderCases(r);

  /* ---- 命书白话小结 ---- */
  h += '<div class="sec-title">命书白话小结</div><div class="summary-box">';
  var para = buildSummary(r);
  para.forEach(function (p) { h += '<p>' + p + '</p>'; });
  h += buildTurningPointsHTML(r);
  h += buildYearAheadHTML(r);
  h += '</div>';

  /* ---- 结缘 ---- */
  if (SHOP.wechat) {
    h += '<div class="yujian"><b>结缘留灯：</b>想细问流年应期、事业姻缘，可加微信 ' + SHOP.wechat + ' 详聊。</div>';
  }
  h += '<div class="disclaimer">' + DISCLAIMER + '</div>';
  return h;
}

/* 大运行排参考（外部保留入口） */
var optsSex = 0;
