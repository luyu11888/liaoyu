/* 八字命理 · 一句话总评与按事问答
 * 只做"把盘说成人话"：读取 calcBazi(r) 的结果，产出总评卡、五维打分、按事结论。
 * 依赖：data.js（GAN_DETAIL / ZHI_DETAIL / SHI_SHEN_DESC / WX_LIFE）、bazi.js（geJuOf / shiShenName / gzOfYear / zRel）
 */
(function (global) {
  'use strict';

  var DIMS = [
    { k: 'career', n: '事业' },
    { k: 'wealth', n: '财运' },
    { k: 'love', n: '感情' },
    { k: 'health', n: '健康' },
    { k: 'noble', n: '贵人' }
  ];

  var TOPICS = [
    { k: 'overall', n: '综合 · 我是什么样的人', tips: ['宜：顺着喜用神选行业与城市，别逆着天性硬拗', '忌：拿别人的时间表要求自己'] },
    { k: 'career', n: '事业 · 适合干什么、什么时候起', tips: ['宜：把格局优势变成岗位优势，选对赛道比努力省力', '忌：频繁换道、什么都想做'] },
    { k: 'wealth', n: '财运 · 钱怎么来、能不能留住', tips: ['宜：身强走财运可进取，身弱先练本事再谈投资', '忌：担保、合伙账目不清、冲动投机'] },
    { k: 'love', n: '婚姻感情 · 另一半什么样', tips: ['宜：晚一点定下来更稳，把话说清楚', '忌：冷战、把钱财和感情搅在一起'] },
    { k: 'study', n: '学业考试 · 读书与证书运', tips: ['宜：印星与文昌得力，按时间表推进就有效', '忌：临时抱佛脚、一次报太多'] },
    { k: 'health', n: '健康 · 先天薄弱处', tips: ['宜：按五行偏枯提示保养对应脏腑，作息固定', '忌：熬夜硬扛、小病拖成大病'] },
    { k: 'children', n: '子女 · 缘分与教养', tips: ['宜：食伤为子女星，看时柱强弱定缘分节奏', '忌：把自己的期待当成孩子的目标'] },
    { k: 'year', n: '今年运势 · 今年的重点', tips: ['宜：顺着流年十神的象去做事', '忌：与流年相冲的月份硬碰硬'] }
  ];

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function clamp(v) { return Math.max(28, Math.min(93, Math.round(v))); }

  /* 十神出现次数（天干 + 藏干） */
  function starCount(r, names) {
    var n = 0;
    r.pillars.forEach(function (p) {
      if (names.indexOf(p.ganSS) >= 0) n++;
      (p.hideSS || []).forEach(function (s) { if (names.indexOf(s) >= 0) n++; });
    });
    return n;
  }
  function shaList(r) {
    var out = [];
    r.pillars.forEach(function (p) {
      (p.sha || []).forEach(function (s) { out.push({ name: s.name, pillar: p.key }); });
    });
    return out;
  }
  function shaScore(r, map) {
    var v = 0;
    shaList(r).forEach(function (s) { if (map[s.name]) v += map[s.name]; });
    return v;
  }
  function shaNames(r, map) {
    return shaList(r).filter(function (s) { return map[s.name]; }).map(function (s) { return s.name; });
  }
  function curStep(r) {
    var s0 = null;
    r.steps.forEach(function (s) { if (r.nowY >= s.startYear && r.nowY <= s.endYear) s0 = s; });
    return s0 || r.steps[0];
  }
  function wxGood(r, wx) {
    if (r.xi.indexOf(wx) >= 0) return 1;
    if (r.ji.indexOf(wx) >= 0) return -1;
    return 0;
  }

  /* ---------- 五维打分 ---------- */
  function scoreOne(r, k) {
    var plus = [], minus = [];
    var step = curStep(r);
    var stepWx = (GAN_DETAIL[step.gan] || {}).wx || '';
    var sg = wxGood(r, stepWx);
    var strong = { '身强': 8, '偏强': 5, '中和': 4, '偏弱': 0, '身弱': -4 }[r.strength] || 0;
    var dayZhi = r.pillars[2].zhi;
    var dayZhiWx = (ZHI_DETAIL[dayZhi] || {}).wx || '';
    var zg = wxGood(r, dayZhiWx);
    var s = 46, spouseNames = (r.sex === 1) ? ['正财', '偏财'] : ['正官', '七杀'];

    if (k === 'career') {
      var gs = starCount(r, ['正官', '七杀']), yin = starCount(r, ['正印', '偏印']), ss = starCount(r, ['食神', '伤官']);
      s += strong * 0.7 + gs * 5 + yin * 3.5 + ss * 2 + shaScore(r, { '文昌': 6, '天乙贵人': 4, '将星': 5, '禄神': 3, '羊刃': -3, '劫煞': -5 }) + (sg > 0 ? 6 : sg < 0 ? -6 : 0);
      if (gs) plus.push('官杀透藏 ' + gs + ' 处，有担当、能担责'); else minus.push('官杀不显，宜靠专业立身而非职权');
      if (yin) plus.push('印星 ' + yin + ' 处，有学历与长辈助力');
      if (ss) plus.push('食伤 ' + ss + ' 处，才华外露、能靠本事吃饭');
      shaNames(r, { '文昌': 1, '将星': 1, '禄神': 1, '天乙贵人': 1 }).forEach(function (n) { plus.push('命带' + n); });
      shaNames(r, { '劫煞': 1, '羊刃': 1 }).forEach(function (n) { minus.push('带' + n + '，易有硬碰硬的事'); });
    } else if (k === 'wealth') {
      var cai = starCount(r, ['正财', '偏财']), ss2 = starCount(r, ['食神', '伤官']), jie = starCount(r, ['劫财', '比肩']);
      s += (r.strength === '身强' || r.strength === '偏强' ? 6 : r.strength === '身弱' ? -5 : 0) + cai * 6 + ss2 * 3 - jie * 2.5 +
        shaScore(r, { '禄神': 5, '天乙贵人': 2, '劫煞': -5, '羊刃': -4 }) + (sg > 0 ? 5 : sg < 0 ? -5 : 0);
      if (cai) plus.push('财星 ' + cai + ' 处，钱路清楚、有来财的门道'); else minus.push('财星不显，宜靠技术或职位变现');
      if (ss2) plus.push('食伤 ' + ss2 + ' 处，能生财，手艺与创意可变现');
      if (jie >= 3) minus.push('比劫偏多，钱财易被分走，宜独立账户');
      if (r.strength === '身弱' || r.strength === '偏弱') minus.push('身偏弱，财多恐担不住，先强身再求财');
      shaNames(r, { '禄神': 1 }).forEach(function (n) { plus.push('带' + n + '，衣食有靠'); });
    } else if (k === 'love') {
      var sp = starCount(r, spouseNames);
      s = 48 + sp * 6 + shaScore(r, { '红鸾': 6, '天喜': 5, '桃花': 5, '天乙贵人': 2, '孤辰': -6, '寡宿': -6, '羊刃': -4, '劫煞': -4 }) +
        (zg > 0 ? 5 : zg < 0 ? -5 : 0) + (sg > 0 ? 3 : sg < 0 ? -3 : 0);
      if (sp) plus.push((r.sex === 1 ? '财星' : '官杀') + ' ' + sp + ' 处，' + (r.sex === 1 ? '对感情上心、愿意付出' : '有原则、欣赏有本事的人'));
      else minus.push('配偶星不显，缘分偏晚，宜先立业再谈');
      if (zg > 0) plus.push('日支' + dayZhi + '为喜用，另一半多半能帮到你');
      if (zg < 0) minus.push('日支' + dayZhi + '非喜用，相处要多磨合');
      shaNames(r, { '红鸾': 1, '天喜': 1, '桃花': 1 }).forEach(function (n) { plus.push('带' + n + '，人缘与异性缘佳'); });
      shaNames(r, { '孤辰': 1, '寡宿': 1 }).forEach(function (n) { minus.push('带' + n + '，宜主动社交、别太独'); });
    } else if (k === 'health') {
      s = 56 + ({ '中和': 10, '偏强': 4, '偏弱': 4, '身强': -3, '身弱': -6 }[r.strength] || 0) +
        (/(缺|全无|没有)/.test(r.lackNote || '') ? -5 : 0) +
        shaScore(r, { '天乙贵人': 4, '羊刃': -5, '劫煞': -4, '孤辰': -2, '寡宿': -2 }) + (sg > 0 ? 3 : -3);
      if (r.strength === '中和') plus.push('五行中和，底子平衡、恢复力强');
      if (r.strength === '身强' || r.strength === '偏强') minus.push('日主偏旺，注意"有余之病"：三高、上火、劳心');
      if (r.strength === '身弱' || r.strength === '偏弱') minus.push('日主偏弱，易疲劳，宜规律作息与固本');
      if (/(缺|全无|没有)/.test(r.lackNote || '')) minus.push((r.lackNote || '').slice(0, 40) + '，对应脏腑要留意');
      plus.push('最旺的五行是「' + r.most + '」，最弱是「' + r.least + '」，顺着补弱最有效');
    } else {
      s = 40 + shaScore(r, { '天乙贵人': 11, '文昌': 6, '禄神': 6, '将星': 5, '红鸾': 2, '天喜': 2, '羊刃': -5, '劫煞': -6, '孤辰': -4, '寡宿': -4 }) +
        starCount(r, ['正印', '偏印']) * 1.5 + (sg > 0 ? 4 : -4);
      shaNames(r, { '天乙贵人': 1, '文昌': 1, '禄神': 1, '将星': 1 }).forEach(function (n) { plus.push('命带' + n + '，遇事有人帮'); });
      shaNames(r, { '劫煞': 1, '羊刃': 1, '孤辰': 1, '寡宿': 1 }).forEach(function (n) { minus.push('带' + n + '，助力打折'); });
      if (!plus.length) minus.push('吉神不多，贵人多半来自专业口碑，靠本事结缘');
    }

    return { score: clamp(s), plus: plus, minus: minus };
  }

  function scores(r) {
    return DIMS.map(function (d) {
      var o = scoreOne(r, d.k);
      return { k: d.k, n: d.n, score: o.score, plus: o.plus, minus: o.minus };
    });
  }

  /* ---------- 一句话总评 ---------- */
  function build(r) {
    var dm = GAN_DETAIL[r.dayGan] || {};
    var ge = geJuOf(r);
    var sc = scores(r);
    var step = curStep(r);
    var stepDesc = (SHI_SHEN_DESC[step.ganSS] || {}).text || '';
    var xi = r.xi.join('、'), ji = r.ji.join('、');

    var headline = '你是「' + r.dayGan + dm.wx + '日主 · ' + r.strength + ' · ' + ge.ge + '」的命：' +
      (dm.nature || '') + '喜用参考「' + xi + '」，忌「' + ji + '」；' +
      (r.strength === '身强' || r.strength === '偏强' ? '气盛宜克泄耗，主动出击更能成事。' :
        r.strength === '身弱' || r.strength === '偏弱' ? '偏弱宜印比生扶，先把底子练厚再谈扩张。' :
          '中和之局贵在流通，稳步推进最划算。');

    var tags = [r.dayGan + '日主', r.strength, ge.ge, '喜' + xi, '忌' + ji,
      step.gan + step.zhi + '运（' + step.ganSS + '）', '今 ' + r.nowAge + ' 岁'];
    shaList(r).forEach(function (s) {
      if (['天乙贵人', '文昌', '禄神', '将星', '红鸾', '天喜', '桃花'].indexOf(s.name) >= 0 && tags.indexOf(s.name) < 0) tags.push(s.name);
    });

    var sorted = sc.slice().sort(function (a, b) { return b.score - a.score; });
    var best = sorted[0], worst = sorted[sorted.length - 1];

    var good = [], watch = [], advice = [];
    good.push(dm.nature ? '日主' + r.dayGan + '：' + dm.nature : '');
    if (best.score >= 65) good.push(best.n + '最强（' + best.score + '）：' + best.plus.slice(0, 2).join('；'));
    if (r.strength === '中和' || r.strength === '偏强') good.push('日主有力，担得起财官，机会来了接得住');
    if (wxGood(r, (GAN_DETAIL[step.gan] || {}).wx) > 0) good.push('当前大运' + step.gan + step.zhi + '（' + step.ganSS + '）走在喜用上，这十年顺势');

    if (worst.score <= 55) watch.push(worst.n + '偏弱（' + worst.score + '）：' + worst.minus.slice(0, 2).join('；'));
    if (r.strength === '身弱' || r.strength === '偏弱') watch.push('身偏弱：大事宜借力，别单打独斗');
    if (/(缺|全无|没有)/.test(r.lackNote || '')) watch.push((r.lackNote || '').slice(0, 50));
    shaNames(r, { '羊刃': 1, '劫煞': 1, '孤辰': 1, '寡宿': 1 }).forEach(function (n) { watch.push('带' + n + '，注意' + (n === '羊刃' ? '血光与急脾气' : n === '劫煞' ? '损耗与小人' : '自我封闭')); });
    if (!watch.length) watch.push('盘中无明显破损，主要防松懈与拖延');

    var life = WX_LIFE[r.xi[0]] || {};
    advice.push('喜用「' + xi + '」：宜往' + (life.dir || '') + '方、' + (life.color || '') + '色系、' + (life.job || '') + '类行业靠拢' + (life.digit ? '，数字喜 ' + life.digit : ''));
    advice.push('当前大运' + step.gan + step.zhi + '（' + step.ganSS + '，' + step.startAge + '–' + step.endAge + '岁）：' + String(stepDesc).slice(0, 60));
    if (ge.note && ge.note.length) advice.push('格局提示：' + ge.note.join('；'));
    advice.push('忌「' + ji + '」过重：相关行业、方位与年份宜守不宜进');

    var bottom = '简单说：你的' + best.n + '（' + best.score + ' 分）最占优势，' + worst.n + '（' + worst.score + ' 分）最需要补；' +
      '这盘属于「' + (best.score - worst.score >= 25 ? '长板突出' : '各项均衡') + '」的局，' +
      (best.score - worst.score >= 25 ? '把长板做成饭碗，短板交给人和工具。' : '按大运节奏稳扎稳打最划算。');

    return { headline: headline, tags: tags, scores: sc, good: good.filter(Boolean), watch: watch, advice: advice, bottom: bottom, best: best, worst: worst, step: step };
  }

  /* ---------- 按事问答 ---------- */
  function topic(r, key) {
    var t = null;
    TOPICS.forEach(function (x) { if (x.k === key) t = x; });
    if (!t) t = TOPICS[0];
    var sc = scores(r);
    var step = curStep(r);
    var paras = [], score, level;

    if (t.k === 'year') {
      var gz = '';
      try { gz = gzOfYear(r.nowY); } catch (e) { gz = ''; }
      var ssN = gz ? shiShenName(r.dayGan, gz.charAt(0)) : '';
      var ssD = SHI_SHEN_DESC[ssN] || {};
      var rel = '';
      try { rel = zRel(r.pillars[2].zhi, gz.charAt(1)); } catch (e) { rel = ''; }
      var g = wxGood(r, (GAN_DETAIL[gz.charAt(0)] || {}).wx);
      score = clamp(55 + (g > 0 ? 12 : g < 0 ? -12 : 0) + (rel === '六冲' ? -12 : rel === '六合' || rel === '三合' ? 10 : rel === '六害' || rel === '相刑' ? -8 : 0));
      level = score >= 68 ? '顺' : score >= 52 ? '平' : '要留心';
      paras.push('今年（' + r.nowY + '）流年 ' + gz + '，天干是你的「' + ssN + '」：' + (ssD.role ? ssD.role + '——' : '') + (ssD.text || '').slice(0, 70));
      paras.push('流年五行「' + ((GAN_DETAIL[gz.charAt(0)] || {}).wx || '') + '」' + (g > 0 ? '正是你的喜用，今年顺势做，事半功倍。' : g < 0 ? '属你的忌神，今年宜守宜稳，别硬扩张。' : '不犯喜忌，平顺推进即可。'));
      if (rel) paras.push('流年支与你的日支' + r.pillars[2].zhi + '「' + rel + '」：' + (rel === '六冲' ? '变动大，宜主动安排出差搬迁，别被动挨冲。' : rel === '六合' || rel === '三合' ? '有人缘与合作机会，宜结盟。' : '易有口舌与小耗，宜低调、宜体检。'));
      paras.push('今年同时走在' + step.gan + step.zhi + '大运（' + step.ganSS + '）里，大运定十年基调、流年定这一年，两者叠加看：' + (g > 0 ? '运顺年也顺，可以主动出击。' : '运平年有扰，先把该守的守住。'));
    } else if (t.k === 'overall') {
      var avg = Math.round(sc.reduce(function (a, b) { return a + b.score; }, 0) / sc.length);
      score = avg; level = score >= 68 ? '顺' : score >= 52 ? '平' : '要留心';
      paras.push('你的盘：' + r.pillars.map(function (p) { return p.gan + p.zhi; }).join(' ') + '，日主' + r.dayGan + '，' + r.strength + '，' + geJuOf(r).ge + '。');
      paras.push('你是' + (GAN_DETAIL[r.dayGan] || {}).image + '一样的' + r.dayGan + '日主：' + (GAN_DETAIL[r.dayGan] || {}).nature);
      paras.push('喜用「' + r.xi.join('、') + '」、忌「' + r.ji.join('、') + '」——这是你一生的"顺风口"和"逆风口"，选行业、城市、合伙人都能用上。');
      paras.push('把五维合起来看：' + sc.map(function (x) { return x.n + ' ' + x.score; }).join('、') + '，总分 ' + avg + '，属「' + level + '」的底子。');
    } else {
      var mapKey = { career: 'career', wealth: 'wealth', love: 'love', study: 'noble', health: 'health', children: 'noble' }[t.k] || 'career';
      var o = sc.filter(function (x) { return x.k === mapKey; })[0] || sc[0];
      score = o.score; level = score >= 68 ? '顺' : score >= 52 ? '平' : '要留心';
      if (t.k === 'study') {
        var yin = starCount(r, ['正印', '偏印']), wen = shaNames(r, { '文昌': 1 });
        paras.push('看读书运，主要看印星与文昌：你命里印星 ' + yin + ' 处' + (wen.length ? '，且带文昌' : '，文昌未见') + '。' + (yin ? '印星主学业、师长与记忆力，读书这条路对你有效。' : '印星薄，宜靠实操与兴趣驱动学，别死记硬背。'));
        paras.push('加分：' + (o.plus.slice(0, 3).join('；') || '无明显加分，靠自律'));
        paras.push('要留心：' + (o.minus.slice(0, 3).join('；') || '无明显阻碍'));
      } else if (t.k === 'children') {
        var shang = starCount(r, ['食神', '伤官']);
        paras.push('子女看食伤（女命食伤为子女，男命以官杀为子女）：你命里食伤 ' + shang + ' 处，' + (shang ? '缘分与教养都有抓手，孩子多半随你有才气。' : '食伤不显，缘分偏晚或偏少，宜顺其自然。'));
        paras.push('时柱' + r.pillars[3].gan + r.pillars[3].zhi + '为子女宫，' + (wxGood(r, (ZHI_DETAIL[r.pillars[3].zhi] || {}).wx) > 0 ? '落在喜用上，子女宫得力。' : '非喜用，教养上要多花心思。'));
        paras.push('加分：' + (o.plus.slice(0, 2).join('；') || '中规中矩') + '；要留心：' + (o.minus.slice(0, 2).join('；') || '无明显阻碍'));
      } else {
        var mainName = { career: '官杀与印星', wealth: '财星与食伤', love: '配偶星与日支', health: '五行与强弱' }[t.k] || '相关十神';
        paras.push('这件事主要看' + mainName + '：' + (t.k === 'career' ? '官杀主职位与担当，印主学历与靠山。' : t.k === 'wealth' ? '财星是钱路，食伤是把本事变成钱的通道。' : t.k === 'love' ? '男看财星、女看官杀，日支是配偶的位置。' : '五行是否中和，决定底子与恢复力。'));
        paras.push('加分的地方：' + (o.plus.slice(0, 4).join('；') || '配置平顺，靠自己一步步来'));
        paras.push('要留心的：' + (o.minus.slice(0, 4).join('；') || '没有明显阻碍，最大的敌人是松懈'));
      }
      paras.push('还要连着看当前大运' + step.gan + step.zhi + '（' + step.ganSS + '，' + step.startAge + '–' + step.endAge + '岁）：' + (wxGood(r, (GAN_DETAIL[step.gan] || {}).wx) > 0 ? '走在喜用上，这十年做这件事是顺水。' : '非喜用运，宜积累不宜冒进。'));
    }

    paras.push('结论：这一块' + (level === '顺' ? '底子不错（' + score + ' 分），顺势做就能出成绩，别想太多、先动手。' :
      level === '平' ? '中规中矩（' + score + ' 分），付出多少收获多少，靠方法比靠运气可靠。' :
        '容易卡（' + score + ' 分），宜守宜稳，先补短板再求突破。'));

    return { key: t.k, name: t.n, score: score, level: level, paras: paras, tips: t.tips };
  }

  /* ---------- HTML ---------- */
  function li(arr) { return arr.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join(''); }

  function html(r, topicKey) {
    var s = build(r);
    var t = topic(r, topicKey || 'overall');
    var lv = t.level === '顺' ? 'ok' : (t.level === '平' ? 'mid' : 'no');
    var h = '';

    h += '<div class="sec-title">一 句 话 总 评 <small>看完这一段，就有整体印象</small></div>';
    h += '<div class="sum-card">';
    h += '<div class="sum-head">' + esc(s.headline) + '</div>';
    h += '<div class="sum-tags">' + s.tags.map(function (x) { return '<span class="tag">' + esc(x) + '</span>'; }).join('') + '</div>';
    h += '<div class="sc-list">';
    s.scores.forEach(function (x) {
      var why = x.plus[0] || x.minus[0] || '配置平顺';
      h += '<div class="sc-row"><span class="sc-n">' + esc(x.n) + '</span>' +
        '<span class="sc-bar"><i style="width:' + x.score + '%"></i></span>' +
        '<span class="sc-v">' + x.score + '</span><span class="sc-why">' + esc(why) + '</span></div>';
    });
    h += '</div>';
    h += '<div class="sum-bottom">' + esc(s.bottom) + '</div>';
    h += '</div>';

    h += '<div class="kv2">' +
      '<div class="box"><div class="t ok">你的优势</div><ul>' + li(s.good.slice(0, 5)) + '</ul></div>' +
      '<div class="box"><div class="t no">要注意的</div><ul>' + li(s.watch.slice(0, 5)) + '</ul></div>' +
      '</div>';
    h += '<div class="advice"><div class="t">给你的建议</div><ul>' + li(s.advice.slice(0, 5)) + '</ul></div>';

    h += '<div class="sec-title">我 想 问 的 事 <small>换上方「想问的事」，这里跟着变</small></div>';
    h += '<div class="topic-box">';
    h += '<div class="tp-head"><span class="tp-p">' + esc(t.name) + '</span>' +
      '<span class="tp-s">' + esc(r.pillars.map(function (p) { return p.gan + p.zhi; }).join(' ')) + '</span>' +
      '<span class="tp-lv ' + lv + '">' + esc(t.level) + ' · ' + t.score + ' 分</span></div>';
    t.paras.forEach(function (p) { h += '<p>' + esc(p) + '</p>'; });
    h += '<div class="tp-tips">' + t.tips.map(function (x) { return '<span class="tip-badge">' + esc(x) + '</span>'; }).join('') + '</div>';
    h += '</div>';
    return h;
  }

  /* ---------- 合盘一句话结论 ---------- */
  function hepanHTML(hp) {
    if (!hp) return '';
    var best = null, worst = null;
    (hp.items || []).forEach(function (it) {
      if (!best && (it.rel === '六合' || it.rel === '三合')) best = it;
      if (!worst && (it.rel === '六冲' || it.rel === '六害' || it.rel === '相刑' || it.rel === '相破')) worst = it;
    });
    var h = '<div class="sec-title">一 句 话 看 这 对 <small>先看结论，再看细节</small></div>';
    h += '<div class="sum-card">';
    h += '<div class="sum-head">这一对' + esc(hp.label || '') + '（' + hp.score + ' 分）：' + esc(hp.dayNote || '两人的日支关系就是婚姻的日常底色') +
      '。' + (hp.score >= 80 ? '底子相合，好好经营是能走远的组合。' : hp.score >= 68 ? '有合有冲，属于"磨合型"，处得来就越来越顺。' : '冲克偏多，需要双方都愿意让步才稳。') + '</div>';
    h += '<div class="kv2">';
    h += '<div class="box"><div class="t ok">最合的一点</div><ul><li>' +
      esc(best ? best.rel + '（' + best.posA + '·' + best.zA + ' 与 ' + best.posB + '·' + best.zB + '）：' + (best.note || '') : '暂无明显六合三合，靠性格互补也能处得好') + '</li></ul></div>';
    h += '<div class="box"><div class="t no">最磨的一点</div><ul><li>' +
      esc(worst ? worst.rel + '（' + worst.posA + '·' + worst.zA + ' 与 ' + worst.posB + '·' + worst.zB + '）：' + (worst.note || '') : '没有明显冲克，主要防日常琐碎消耗感情') + '</li></ul></div>';
    h += '</div>';
    if (hp.advices && hp.advices.length) {
      h += '<div class="advice"><div class="t">怎么处</div><ul>' + li(hp.advices.slice(0, 4)) + '</ul></div>';
    }
    h += '</div>';
    return h;
  }

  global.BZSummary = {
    DIMS: DIMS, TOPICS: TOPICS,
    build: build, topic: topic, scores: scores,
    html: html, hepanHTML: hepanHTML
  };
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) module.exports = (typeof window !== 'undefined' ? window : globalThis).BZSummary;
