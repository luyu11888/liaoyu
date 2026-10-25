/* 紫微斗数 · 排盘与白话解读
 * 排盘算法来自开源项目 iztro（github.com/sylarlong/iztro，MIT 协议）
 * 本文件只做：调用 iztro 排盘 → 整理成界面需要的结构 → 生成白话解读。
 */
(function (global) {
  'use strict';

  var D = global.ZW_DATA;

  /* iztro 的 palaces 数组按地支顺序排列，从寅宫起 */
  var BRANCHES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];

  /* 传统 4x4 盘面布局：外圈十二宫，-1 表示中宫（写命盘信息） */
  var LAYOUT = [
    [3, 4, 5, 6],
    [2, -1, 7],
    [1, -1, 8],
    [0, 11, 10, 9]
  ];

  var TIME_INDEX = [
    { v: 0, n: '早子时', r: '00:00~01:00' },
    { v: 1, n: '丑时', r: '01:00~03:00' },
    { v: 2, n: '寅时', r: '03:00~05:00' },
    { v: 3, n: '卯时', r: '05:00~07:00' },
    { v: 4, n: '辰时', r: '07:00~09:00' },
    { v: 5, n: '巳时', r: '09:00~11:00' },
    { v: 6, n: '午时', r: '11:00~13:00' },
    { v: 7, n: '未时', r: '13:00~15:00' },
    { v: 8, n: '申时', r: '15:00~17:00' },
    { v: 9, n: '酉时', r: '17:00~19:00' },
    { v: 10, n: '戌时', r: '19:00~21:00' },
    { v: 11, n: '亥时', r: '21:00~23:00' },
    { v: 12, n: '晚子时', r: '23:00~24:00' }
  ];

  /* 按小时推算时辰序号（iztro：0 早子、1 丑 … 12 晚子） */
  function timeIndexByHour(h) {
    if (h === 0) return 0;
    if (h === 23) return 12;
    return Math.floor((h + 1) / 2);
  }

  /* 排盘 */
  function pai(opt) {
    var astro = global.iztro.astro;
    return astro.bySolar(opt.date, opt.timeIndex, opt.gender === 'female' ? 'female' : 'male', !!opt.fixLeap, 'zh-CN');
  }

  /* 取流年/大限盘 */
  function horoscope(a, dateStr) {
    return a.horoscope(dateStr);
  }

  function idxOfPalace(a, name) {
    for (var i = 0; i < a.palaces.length; i++) if (a.palaces[i].name === name) return i;
    return 0;
  }
  function branchOf(idx) { return BRANCHES[idx]; }
  function sanfang(idx) { return [idx, (idx + 4) % 12, (idx + 8) % 12]; }
  function duigong(idx) { return (idx + 6) % 12; }

  function allStars(a, idxs) {
    var out = [];
    idxs.forEach(function (i) {
      var p = a.palaces[i];
      (p.majorStars || []).forEach(function (s) { out.push({ star: s, palace: p.name, idx: i }); });
      (p.minorStars || []).forEach(function (s) { out.push({ star: s, palace: p.name, idx: i }); });
    });
    return out;
  }
  function hasStar(list, name) {
    return list.some(function (x) { return x.star.name === name; });
  }
  function starIn(a, name) {
    var r = null;
    a.palaces.forEach(function (p, i) {
      (p.majorStars || []).concat(p.minorStars || []).forEach(function (s) {
        if (s.name === name) r = { palace: p.name, idx: i, star: s, branch: BRANCHES[i] };
      });
    });
    return r;
  }
  function samePalace(a, n1, n2) {
    for (var i = 0; i < 12; i++) {
      var names = (a.palaces[i].majorStars || []).concat(a.palaces[i].minorStars || []).map(function (s) { return s.name; });
      if (names.indexOf(n1) >= 0 && names.indexOf(n2) >= 0) return a.palaces[i];
    }
    return null;
  }
  function adjNames(p) {
    return (p.adjectiveStars || []).map(function (s) { return s.name; });
  }

  /* 亮度好坏 */
  function brightLevel(b) {
    if (b === '庙' || b === '旺') return 2;
    if (b === '得' || b === '利') return 1;
    if (b === '平') return 0;
    return -1; // 不、陷
  }

  /* ---------- 格局 ---------- */
  function patterns(a) {
    var mi = idxOfPalace(a, '命宫');
    var sf = sanfang(mi);
    var list = allStars(a, sf).concat(allStars(a, [duigong(mi)]));
    var out = [];

    function add(name, good, desc) { out.push({ name: name, good: good, desc: desc }); }

    var mingNames = (a.palaces[mi].majorStars || []).map(function (s) { return s.name; });
    var mingAll = list.filter(function (x) { return x.idx === mi; });

    // 空宫借星
    if (!mingNames.length) {
      var d = a.palaces[duigong(mi)];
      var borrowed = (d.majorStars || []).map(function (s) { return s.name; }).join('、') || '（对宫也无主星）';
      add('命宫空宫 · 借对宫星', null, '命宫本无主星，性格与外界互动较大，看对宫「' + d.name + '」的 ' + borrowed + ' 来论：你容易受环境与身边人影响，宜早立自己的原则。');
    }

    // 君臣庆会
    var help = ['左辅', '右弼', '天魁', '天钺'].filter(function (n) { return hasStar(list, n); });
    if (hasStar(mingAll.concat(list), '紫微') || hasStar(mingAll, '天府')) {
      if (help.length >= 3) add('君臣庆会', 'good', '紫微/天府坐命，三方四正又有 ' + help.join('、') + ' 相拱：有人捧、有人帮，宜走管理与公众路线，切忌独断专行。');
      else add('孤君无辅', 'bad', '紫微系坐命但辅星少（' + (help.length ? help.join('、') : '几乎没有') + '）：能力强却常要自己扛，学会授权与结盟是关键。');
    }

    // 杀破狼
    if (hasStar(list, '七杀') && hasStar(list, '破军') && hasStar(list, '贪狼')) {
      add('杀破狼格', null, '七杀、破军、贪狼交会：一生变动大、开创力强，适合闯荡与创业；代价是起伏明显，宜留后手、忌孤注一掷。');
    }
    // 机月同梁
    var jm = ['天机', '太阴', '天同', '天梁'].filter(function (n) { return hasStar(list, n); });
    if (jm.length >= 3) add('机月同梁格', 'good', '天机、太阴、天同、天梁中的 ' + jm.join('、') + ' 会照：适合幕僚、服务、文教、专业顾问型工作，稳中求进最划算。');

    // 日月并明 / 反背
    var sun = starIn(a, '太阳'), moon = starIn(a, '太阴');
    if (sun && moon) {
      var sb = brightLevel(sun.star.brightness), mb = brightLevel(moon.star.brightness);
      if (sb >= 1 && mb >= 1) add('日月并明', 'good', '太阳在' + sun.branch + '宫' + (sun.star.brightness || '') + '、太阴在' + moon.branch + '宫' + (moon.star.brightness || '') + '，双双得地：动静皆宜，事业与家庭可兼顾。');
      if (sb <= -1 || mb <= -1) add('日月反背', 'bad', '太阳或太阴落陷：付出与回报易不成正比，适合在幕后或夜间型行业发展，别拿别人的时间表要求自己。');
    }

    // 火贪 / 铃贪
    if (samePalace(a, '贪狼', '火星')) add('火贪格', 'good', '贪狼与火星同宫：有横发之机，敢拼敢冲能出头；但要见好就收，忌贪大冒进。');
    if (samePalace(a, '贪狼', '铃星')) add('铃贪格', 'good', '贪狼与铃星同宫：暗中发力、后发制人，机会来得晚一点但往往不小。');

    // 马头带剑
    var qy = starIn(a, '擎羊');
    if (qy && qy.branch === '午') add('马头带剑', null, '擎羊在午宫：刚烈有冲劲，宜武职、技术、竞技类；脾气上来得快，宜练一门"降火"的运动。');

    // 石中隐玉
    var jm2 = starIn(a, '巨门');
    if (jm2 && (jm2.branch === '子' || jm2.branch === '午') && (jm2.star.mutagen === '禄' || jm2.star.mutagen === '权')) {
      add('石中隐玉', 'good', '巨门在' + jm2.branch + '宫化' + jm2.star.mutagen + '：厚积薄发型，早年沉潜、中年发光，靠专业与口才立身。');
    }

    // 梁马飘荡
    if (samePalace(a, '天梁', '天马')) add('梁马飘荡', null, '天梁与天马同宫：一生走动多、离乡发展或常出差；心也爱飘，宜给生活一个锚点。');

    // 阳梁昌禄
    if (hasStar(list, '太阳') && hasStar(list, '天梁') && hasStar(list, '文昌') && hasStar(list, '禄存')) {
      add('阳梁昌禄', 'good', '太阳、天梁、文昌、禄存会照：利于考试、名声与公职，读书这条路对你格外划算。');
    }

    // 双禄交驰 / 权禄巡逢
    var lu = list.filter(function (x) { return x.star.mutagen === '禄'; }).map(function (x) { return x.star.name; });
    var lu2 = allStars(a, sf).filter(function (x) { return x.star.name === '禄存'; });
    if (lu.length + lu2.length >= 2) add('双禄交驰', 'good', '化禄与禄存交会（' + lu.concat(['禄存']).slice(0, 3).join('、') + '）：财路顺、机会多，宜把握但要防贪多。');
    var quan = list.filter(function (x) { return x.star.mutagen === '权'; }).map(function (x) { return x.star.name; });
    if (quan.length && lu.length) {
      var same = a.palaces.some(function (p) {
        var ns = (p.majorStars || []).concat(p.minorStars || []);
        return ns.some(function (s) { return s.mutagen === '权'; }) && ns.some(function (s) { return s.mutagen === '禄'; });
      });
      if (same) add('权禄巡逢', 'good', '化权与化禄同宫：既有资源又有话语权，是能做成事的配置，宜主动争取。');
    }

    // 空劫
    var mingAdj = adjNames(a.palaces[mi]);
    var kong = (a.palaces[mi].minorStars || []).map(function (s) { return s.name; }).filter(function (n) { return n === '地空' || n === '地劫'; });
    if (kong.length) add('空劫坐命', 'bad', '命宫见 ' + kong.join('、') + '：想法多、创意好，但钱财与计划容易落空；宜务实、宜把想法落到纸面和现金流上。');

    // 桃花
    var th = mingAdj.concat((a.palaces[mi].minorStars || []).map(function (s) { return s.name; }))
      .filter(function (n) { return n === '红鸾' || n === '天喜' || n === '咸池' || n === '天姚'; });
    if (th.length) add('桃花照命', null, '命宫见 ' + th.join('、') + '：人缘与异性缘佳，宜用在社交与审美行业；感情上宜慢一点，先看清楚再投入。');

    // 辅星双全
    if (samePalace(a, '左辅', '右弼')) add('左右同宫', 'good', '左辅右弼同宫：贵人缘扎实，遇事总有人搭把手，团队运是你的加分项。');

    return out;
  }

  /* ---------- 四化提示 ---------- */
  function sihua(a) {
    var out = [];
    a.palaces.forEach(function (p, i) {
      (p.majorStars || []).concat(p.minorStars || []).forEach(function (s) {
        if (s.mutagen) {
          out.push({
            palace: p.name, branch: BRANCHES[i], star: s.name, mu: s.mutagen,
            text: s.name + '化' + s.mutagen + '于' + p.name + '：' + (D.MUTAGEN[s.mutagen] ? D.MUTAGEN[s.mutagen].txt : '') +
              (D.MUTAGEN_PALACE[p.name] ? '（' + p.name + '四化：' + D.MUTAGEN_PALACE[p.name].split('；').filter(function (t) { return t.indexOf('化' + s.mutagen) === 0; }).join('') + '）' : '')
          });
        }
      });
    });
    return out;
  }

  /* ---------- 每宫一句话速览 ---------- */
  function palaceBrief(a, idx) {
    var p = a.palaces[idx];
    var majors = (p.majorStars || []).map(function (s) {
      return s.name + (s.brightness ? '（' + s.brightness + '）' : '') + (s.mutagen ? '化' + s.mutagen : '');
    });
    var minors = (p.minorStars || []).map(function (s) { return s.name + (s.mutagen ? '化' + s.mutagen : ''); });
    var info = D.PALACES[p.name] || { brief: '', focus: '' };
    var head = '「' + p.name + '」在' + BRANCHES[idx] + '宫（' + p.heavenlyStem + BRANCHES[idx] + '）';
    var starTxt = majors.length ? '主星 ' + majors.join('、') : '本宫无主星，借对宫「' + a.palaces[duigong(idx)].name + '」之星';
    var minorTxt = minors.length ? '；辅星 ' + minors.join('、') : '';
    var m0 = (p.majorStars || [])[0];
    var mTxt = '';
    if (m0 && D.MAJOR[m0.name]) {
      var m = D.MAJOR[m0.name];
      if (p.name === '财帛') mTxt = '求财方式：' + m.money;
      else if (p.name === '官禄') mTxt = '事业气质：' + m.career;
      else if (p.name === '夫妻') mTxt = '感情模式：' + m.love;
      else mTxt = m.brief;
    } else if (p.name === '命宫' && !m0) {
      mTxt = '命宫空宫，性格受对宫影响大';
    }
    return {
      idx: idx, name: p.name, branch: BRANCHES[idx],
      head: head, stars: starTxt + minorTxt,
      brief: info.brief, focus: info.focus, main: mTxt,
      adj: adjNames(p),
      changsheng: p.changsheng12,
      decadal: p.decadal
    };
  }

  /* ---------- 大限 ---------- */
  function decadalInfo(a, dateStr) {
    var list = a.decadalList();
    var h = a.horoscope(dateStr);
    var age = h.age ? h.age.nominalAge : list[0].ageRange[0];
    var cur = null;
    list.forEach(function (d) { if (age >= d.ageRange[0] && age <= d.ageRange[1]) cur = d; });
    if (!cur) cur = list[list.length - 1];
    return { list: list, cur: cur, age: age };
  }

  /* ---------- 总解读 ---------- */
  function read(a, dateStr) {
    var mi = idxOfPalace(a, '命宫');
    var bi = a.palaces.findIndex(function (p) { return p.isBodyPalace; });
    var mp = a.palaces[mi];
    var soulStar = (mp.majorStars || [])[0];
    var lines = [];

    // 命宫
    if (soulStar) {
      var m = D.MAJOR[soulStar.name];
      var bTxt = soulStar.brightness ? '（' + soulStar.brightness + '：' + (D.BRIGHTNESS[soulStar.brightness] ? D.BRIGHTNESS[soulStar.brightness].txt : '') + '）' : '';
      lines.push({
        t: '命宫 · ' + soulStar.name + bTxt,
        s: (m ? m.brief : '') + '　优点：' + (m ? m.good : '') + '；要注意：' + (m ? m.bad : '') + '。' + (m ? m.tip : '')
      });
    } else {
      lines.push({ t: '命宫 · 空宫', s: '命宫没有主星，性格像一张白纸，受对宫与后天环境影响很大，越早立定方向越有利。' });
    }

    // 身宫
    if (bi >= 0) {
      var bp = a.palaces[bi];
      lines.push({
        t: '身宫 · ' + bp.name,
        s: '身宫落在「' + bp.name + '」，代表你后天的着力点：' + (D.PALACES[bp.name] ? D.PALACES[bp.name].brief : '') + '一生的追求多在这一宫的事上。'
      });
    }

    // 事业 / 财 / 感情
    ['官禄', '财帛', '夫妻', '迁移', '疾厄'].forEach(function (nm) {
      var idx = idxOfPalace(a, nm);
      var p = a.palaces[idx];
      var s0 = (p.majorStars || [])[0];
      var key = nm === '官禄' ? 'career' : nm === '财帛' ? 'money' : nm === '夫妻' ? 'love' : null;
      var txt;
      if (s0 && D.MAJOR[s0.name]) {
        txt = '「' + nm + '」宫（' + BRANCHES[idx] + '）主星 ' + s0.name + (s0.brightness ? '（' + s0.brightness + '）' : '') +
          '：' + (key ? D.MAJOR[s0.name][key] : D.MAJOR[s0.name].brief);
      } else {
        txt = '「' + nm + '」宫（' + BRANCHES[idx] + '）无主星，借对宫「' + a.palaces[duigong(idx)].name + '」之星来看：' + (D.PALACES[nm] ? D.PALACES[nm].focus : '');
      }
      lines.push({ t: nm + '宫', s: txt });
    });

    // 大限
    var dc = decadalInfo(a, dateStr);
    var curPalace = dc.cur ? a.palaces[dc.cur.index] : null;
    if (curPalace) {
      var cs = (curPalace.majorStars || [])[0];
      lines.push({
        t: '当前大限 ' + dc.cur.ageRange[0] + '–' + dc.cur.ageRange[1] + ' 岁 · ' + dc.cur.palaceName,
        s: '这十年走在「' + dc.cur.palaceName + '」宫（' + dc.cur.heavenlyStem + dc.cur.earthlyBranch + '）' +
          (cs ? '，主星 ' + cs.name + (cs.brightness ? '（' + cs.brightness + '）' : '') : '，本宫无主星借对宫') +
          '。' + (D.PALACES[curPalace.name] ? D.PALACES[curPalace.name].brief : '') +
          '大限四化：' + dc.cur.mutagen.slice(0, 4).join('、') + '。'
      });
    }

    // 流年
    var h = a.horoscope(dateStr);
    if (h && h.yearly) {
      lines.push({
        t: h.yearly.heavenlyStem + h.yearly.earthlyBranch + ' 年流年 · ' + h.yearly.palaceNames[h.yearly.index],
        s: '流年宫落在「' + h.yearly.palaceNames[h.yearly.index] + '」，' + (D.PALACES[h.yearly.palaceNames[h.yearly.index]] ? D.PALACES[h.yearly.palaceNames[h.yearly.index]].brief : '') +
          '流年四化：' + h.yearly.mutagen.join('、') + '（按禄权科忌顺序）。把这一年的重点放在该宫的事上，顺势而为。'
      });
    }

    return { lines: lines, patterns: patterns(a), sihua: sihua(a), decadal: dc, horoscope: h };
  }

  /* ---------- 单宫打分：把星曜吉凶翻译成一个好懂的分数 ---------- */
  var JISTAR = {
    '左辅': 6, '右弼': 6, '天魁': 6, '天钺': 6, '文昌': 5, '文曲': 5, '禄存': 8, '天马': 3,
    '天寿': 3, '解神': 3, '恩光': 3, '天贵': 3, '天福': 3, '天才': 3, '龙池': 2, '凤阁': 2,
    '三台': 2, '八座': 2, '天官': 2, '台辅': 2, '封诰': 2, '天巫': 2, '天厨': 2, '红鸾': 2, '天喜': 2
  };
  var SHASTAR = {
    '擎羊': 8, '陀罗': 7, '火星': 7, '铃星': 7, '地空': 7, '地劫': 7, '天空': 5, '天刑': 6,
    '天姚': 3, '咸池': 3, '阴煞': 3, '破碎': 3, '蜚廉': 3, '天哭': 3, '天虚': 3,
    '孤辰': 2, '寡宿': 2, '劫煞': 2, '灾煞': 2, '天煞': 2, '指背': 2, '天伤': 3, '天使': 3
  };
  var MU_SCORE = { '禄': 12, '权': 9, '科': 9, '忌': -12 };
  var BR_SCORE = { '庙': 14, '旺': 12, '得': 7, '利': 6, '平': 0, '不': -8, '陷': -10 };

  function scorePalace(a, idx) {
    var p = a.palaces[idx];
    var s = 60, plus = [], minus = [];
    var majors = p.majorStars || [], minors = p.minorStars || [];
    if (!majors.length) { s -= 4; minus.push('本宫无主星，要借对宫之星来看，稳定性打折'); }
    majors.forEach(function (st) {
      var b = BR_SCORE[st.brightness];
      if (b) {
        s += b;
        if (b > 0) plus.push(st.name + '落' + st.brightness + '地，力量足');
        else minus.push(st.name + st.brightness + '，优点不容易发挥');
      }
      if (st.mutagen) {
        var v = MU_SCORE[st.mutagen] || 0;
        s += v;
        if (v >= 0) plus.push(st.name + '化' + st.mutagen + '（' + (D.MUTAGEN[st.mutagen] ? D.MUTAGEN[st.mutagen].txt : '') + '）');
        else minus.push(st.name + '化忌，这一块最容易卡住、也最让你在意');
      }
    });
    minors.forEach(function (st) {
      if (JISTAR[st.name]) { s += JISTAR[st.name]; plus.push(st.name + '照应'); }
      if (SHASTAR[st.name]) { s -= SHASTAR[st.name]; minus.push(st.name + '添扰'); }
      if (st.mutagen) { s += MU_SCORE[st.mutagen] || 0; }
    });
    (p.adjectiveStars || []).forEach(function (st) {
      if (SHASTAR[st.name]) { s -= 2; minus.push(st.name + '带来小困扰'); }
      if (st.name === '解神') { s += 3; plus.push('解神可减三分凶'); }
    });
    return { score: Math.max(20, Math.min(97, Math.round(s))), plus: plus, minus: minus };
  }

  /* 贵人运：命宫三方四正有几颗助星 */
  function scoreNoble(a) {
    var mi = idxOfPalace(a, '命宫');
    var list = allStars(a, sanfang(mi).concat([duigong(mi)]));
    var names = ['左辅', '右弼', '天魁', '天钺', '文昌', '文曲'];
    var hit = names.filter(function (n) { return hasStar(list, n); });
    var sha = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'].filter(function (n) { return hasStar(list, n); });
    return {
      score: Math.max(25, Math.min(97, 42 + hit.length * 11 - sha.length * 4)),
      plus: hit.map(function (n) { return n + '相扶'; }),
      minus: sha.map(function (n) { return n + '在旁'; })
    };
  }

  /* ---------- 一句话总评：打开就能看懂的那张卡 ---------- */
  function summary(a, dateStr) {
    var mi = idxOfPalace(a, '命宫');
    var mp = a.palaces[mi];
    var s0 = (mp.majorStars || [])[0];
    var m = s0 ? D.MAJOR[s0.name] : null;
    var dc = decadalInfo(a, dateStr);
    var pats = patterns(a);

    /* 一句话定调 */
    var headline;
    if (m) {
      headline = '你是「' + s0.name + (s0.brightness ? '（' + s0.brightness + '）' : '') + '坐命」的' +
        (D.KEYWORDS[s0.name] ? D.KEYWORDS[s0.name][0] : '') + '型人：' + m.brief +
        '最要留意的是' + m.bad + '。' + m.tip + '。';
    } else {
      headline = '你是「命宫空宫」的人：本宫无主星，性格像一张白纸，环境与身边人对你的影响特别大，越早立定自己的方向越有利。';
    }

    /* 关键词标签 */
    var tags = [];
    if (s0) {
      tags.push(s0.name + '坐命');
      (D.KEYWORDS[s0.name] || []).forEach(function (k) { tags.push(k); });
    } else tags.push('空宫借星');
    tags.push(a.fiveElementsClass);
    pats.slice(0, 2).forEach(function (p) { tags.push(p.name); });
    sihua(a).forEach(function (s) {
      if (['命宫', '财帛', '官禄'].indexOf(s.palace) >= 0) tags.push(s.star + '化' + s.mu);
    });
    if (dc && dc.cur) tags.push(dc.cur.ageRange[0] + '-' + dc.cur.ageRange[1] + '岁走' + dc.cur.palaceName);

    /* 五维打分 */
    var scores = D.DIMENSIONS.map(function (d) {
      var idx = idxOfPalace(a, d.palace);
      var sc = d.k === 'noble' ? scoreNoble(a) : scorePalace(a, idx);
      return { k: d.k, n: d.n, palace: d.palace, branch: BRANCHES[idx], score: sc.score, plus: sc.plus, minus: sc.minus };
    });

    /* 优势 / 注意 / 建议 */
    var good = [], watch = [], advice = [];
    if (m) { good.push(m.good); watch.push(m.bad); advice.push(m.tip); }
    scores.forEach(function (sc) {
      if (sc.score >= 70) good.push(sc.n + '宫（' + sc.palace + '）' + sc.score + '分：' + (sc.plus.slice(0, 2).join('、') || '配置平顺'));
      if (sc.score <= 55) watch.push(sc.n + '宫（' + sc.palace + '）' + sc.score + '分：' + (sc.minus.slice(0, 2).join('、') || '需要多花心思'));
    });
    pats.forEach(function (p) {
      if (p.good === 'good') good.push(p.name + '：' + p.desc);
      else if (p.good === 'bad') watch.push(p.name + '：' + p.desc);
      else advice.push(p.name + '：' + p.desc);
    });
    if (dc && dc.cur) {
      advice.push('当前大限（' + dc.cur.ageRange[0] + '–' + dc.cur.ageRange[1] + '岁）走在「' + dc.cur.palaceName +
        '」：这十年把重心放在' + dc.cur.palaceName + '宫的事上（' + (D.PALACES[dc.cur.palaceName] ? D.PALACES[dc.cur.palaceName].brief : '') + '）');
    }

    /* 一句话总结：最好的一项 + 最要补的一项 */
    var sorted = scores.slice().sort(function (x, y) { return y.score - x.score; });
    var best = sorted[0], worst = sorted[sorted.length - 1];
    var bottom = '简单说：你的' + best.n + '（' + best.palace + '宫）最占优势，' + worst.n + '（' + worst.palace + '宫）最需要用心经营；' +
      '这盘属于「' + (best.score - worst.score >= 25 ? '长板突出' : '各项均衡') + '」的命局，' +
      (best.score - worst.score >= 25 ? '把长板做成饭碗，短板找人互补即可。' : '稳扎稳打、按大限节奏走最划算。');

    return {
      headline: headline, bottom: bottom, tags: tags, scores: scores,
      good: good, watch: watch, advice: advice,
      best: best, worst: worst
    };
  }

  /* ---------- 按事问答：想知道什么就问什么 ---------- */
  function starTextOf(p) {
    return (p.majorStars || []).map(function (s) {
      return s.name + (s.brightness ? '（' + s.brightness + '）' : '') + (s.mutagen ? '化' + s.mutagen : '');
    }).concat((p.minorStars || []).map(function (s) { return s.name + (s.mutagen ? '化' + s.mutagen : ''); }));
  }

  function topic(a, key, dateStr) {
    var t = null;
    D.TOPICS.forEach(function (x) { if (x.k === key) t = x; });
    if (!t) t = D.TOPICS[0];
    var hz = a.horoscope(dateStr);
    var idx, extra = '', palaceName;

    if (t.k === 'year') {
      idx = hz.yearly.index;
      palaceName = hz.yearly.palaceNames[idx];
      extra = '太岁落在「' + palaceName + '」宫，流年四化是 ' + hz.yearly.mutagen.join('、') + '（禄权科忌），这一年的主题就在这一宫。';
    } else {
      idx = idxOfPalace(a, t.main);
      palaceName = t.main;
    }

    var p = a.palaces[idx];
    var sc = scorePalace(a, idx);
    var names = starTextOf(p);
    var majors = (p.majorStars || []);
    var s0 = majors[0];
    var m = s0 ? D.MAJOR[s0.name] : null;
    var level = sc.score >= 72 ? '顺' : (sc.score >= 55 ? '平' : '要留心');

    var paras = [];

    /* 第一段：看哪一宫、星是什么 */
    var h1 = '这件事看「' + palaceName + '」宫（' + p.heavenlyStem + BRANCHES[idx] + '）' +
      (names.length ? '：' + names.join('、') : '：本宫无主星，借对宫「' + a.palaces[duigong(idx)].name + '」之星');
    if (m) {
      var key2 = palaceName === '财帛' ? 'money' : palaceName === '官禄' ? 'career' : palaceName === '夫妻' ? 'love' : null;
      h1 += '。' + s0.name + (s0.brightness ? '落' + s0.brightness + '地' : '') + '，' + (key2 ? m[key2] : m.brief);
      if (t.k === 'overall') h1 += '　' + m.good + '，要注意的是' + m.bad;
    }
    paras.push(h1);

    /* 第二段：好的方面 */
    if (sc.plus.length) paras.push('加分的地方：' + sc.plus.slice(0, 4).join('；') + '。');
    else paras.push('加分的地方：本宫配置平顺，没有明显的助力星，靠自己一步一步来更实在。');

    /* 第三段：要留心的 */
    if (sc.minus.length) paras.push('要留心的：' + sc.minus.slice(0, 4).join('；') + '。');
    else paras.push('要留心的：本宫没有明显煞星，最大的敌人往往是松懈和拖延。');

    /* 第四段：参考宫 */
    if (t.k !== 'year' && t.ref && t.ref.length) {
      var refTxt = t.ref.map(function (rn) {
        var ri = idxOfPalace(a, rn);
        var rp = a.palaces[ri];
        var rs = (rp.majorStars || [])[0];
        return rn + '宫（' + BRANCHES[ri] + '）' + (rs ? rs.name + (rs.brightness ? '（' + rs.brightness + '）' : '') : '无主星');
      }).join('，');
      paras.push('还要连着看：' + refTxt + '——这几宫一起看，结论才完整。');
    }
    if (extra) paras.push(extra);

    /* 第五段：结论 */
    var tail;
    if (level === '顺') tail = '结论：这一块底子不错（' + sc.score + ' 分），顺势做就能出成绩，别想太多、先动手。';
    else if (level === '平') tail = '结论：这一块中规中矩（' + sc.score + ' 分），付出多少收获多少，靠方法比靠运气可靠。';
    else tail = '结论：这一块容易卡（' + sc.score + ' 分），宜守宜稳，先补短板再求突破，别硬碰硬。';
    if (m) tail += m.tip + '。';
    paras.push(tail);

    /* 宜忌 */
    var tips = t.tips.slice();
    if (m && m.tip && tips.indexOf(m.tip) < 0) tips.push('宜：' + m.tip);
    if (t.k === 'year' && hz.yearly) tips.push('宜：' + hz.yearly.heavenlyStem + hz.yearly.earthlyBranch +
      '年把重点放在「' + palaceName + '」宫的事上，' + (D.PALACES[palaceName] ? D.PALACES[palaceName].focus : ''));

    return {
      key: t.k, name: t.n, palace: palaceName, branch: BRANCHES[idx],
      stars: names.join('、') || '空宫', score: sc.score, level: level,
      paras: paras, tips: tips
    };
  }

  global.ZW = {
    BRANCHES: BRANCHES,
    LAYOUT: LAYOUT,
    TIME_INDEX: TIME_INDEX,
    timeIndexByHour: timeIndexByHour,
    pai: pai,
    horoscope: horoscope,
    read: read,
    summary: summary,
    topic: topic,
    scorePalace: scorePalace,
    palaceBrief: palaceBrief,
    starInfo: function (n, t) { return D.starInfo(n, t); },
    idxOfPalace: idxOfPalace,
    duigong: duigong,
    sanfang: sanfang,
    branchOf: branchOf
  };
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) module.exports = (typeof window !== 'undefined' ? window : globalThis).ZW;
