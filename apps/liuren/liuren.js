/* =========================================================
 *  大六壬 · 排盘算法（月将加时 / 四课 / 三传九宗门 / 天将 / 白话断课）
 *  算法参考开源项目 jingrongx/liuren(src/utils/daLiuRen.ts) 与
 *  dglijin-oss/chinese-metaphysics-skills/liuren-skill，并按
 *  《大六壬类集》贵神起式歌校正昼贵/夜贵。
 * ========================================================= */
window.LiuRen = (function () {
  'use strict';
  const D = window.LR;
  const dz = function (z) { return D.DZ.indexOf(z); };
  const tg = function (g) { return D.TG.indexOf(g); };

  // ---------- 基础工具 ----------
  function keWx(a, b) { return D.KE[a] === b; }
  function shengWx(a, b) { return D.SHENG[a] === b; }
  function liuQin(dayGan, zhi) {
    const gw = D.TG_WX[dayGan], zw = D.DZ_WX[zhi];
    if (zw === gw) return '兄弟';
    if (shengWx(zw, gw)) return '父母';
    if (shengWx(gw, zw)) return '子孙';
    if (keWx(zw, gw)) return '官鬼';
    if (keWx(gw, zw)) return '妻财';
    return '—';
  }
  // 旺相休囚死（以月建为令）
  function wangShuai(zhi, monthZhi) {
    const mw = D.DZ_WX[monthZhi], zw = D.DZ_WX[zhi];
    if (zw === mw) return '旺';
    if (shengWx(zw, mw)) return '休';   // 我生者相? -> 统一：我生为休
    if (shengWx(mw, zw)) return '相';   // 生我者相? -> 月令生我为相
    if (keWx(zw, mw)) return '囚';      // 我克月令为囚
    if (keWx(mw, zw)) return '死';      // 月令克我为死
    return '—';
  }
  function hourToZhi(h) {
    if (h >= 23 || h < 1) return '子';
    return D.DZ[Math.floor((h + 1) / 2)];
  }
  const SHICHEN_TIME = { '子': '23-01', '丑': '01-03', '寅': '03-05', '卯': '05-07', '辰': '07-09', '巳': '09-11', '午': '11-13', '未': '13-15', '申': '15-17', '酉': '17-19', '戌': '19-21', '亥': '21-23' };

  // 近似节气表（lunar 库不可用时的兜底）
  const JQ_APPROX = [[1, 5, '小寒'], [1, 20, '大寒'], [2, 4, '立春'], [2, 19, '雨水'], [3, 6, '惊蛰'], [3, 21, '春分'], [4, 5, '清明'], [4, 20, '谷雨'], [5, 6, '立夏'], [5, 21, '小满'], [6, 6, '芒种'], [6, 21, '夏至'], [7, 7, '小暑'], [7, 23, '大暑'], [8, 7, '立秋'], [8, 23, '处暑'], [9, 8, '白露'], [9, 23, '秋分'], [10, 8, '寒露'], [10, 23, '霜降'], [11, 7, '立冬'], [11, 22, '小雪'], [12, 7, '大雪'], [12, 22, '冬至']];
  function approxJieQi(m, d) {
    let r = '冬至';
    for (let i = 0; i < JQ_APPROX.length; i++) { const a = JQ_APPROX[i]; if (m > a[0] || (m === a[0] && d >= a[1])) r = a[2]; }
    return r;
  }

  // ---------- 主排盘 ----------
  function paipan(o) {
    const y = o.y, mo = o.m, d = o.d, h = o.h || 12, mi = o.mi || 0;
    let solar = null, lunar = null;
    try {
      solar = Solar.fromYmdHms(y, mo, d, h, mi, 0);
      lunar = Lunar.fromSolar(solar);
    } catch (e) { lunar = null; }

    // 四柱
    let yearGZ = '—', monthGZ = '—', dayGZ = '—';
    if (lunar) {
      try { yearGZ = lunar.getYearInGanZhi(); } catch (e) { }
      try { monthGZ = lunar.getMonthInGanZhi(); } catch (e) { }
      try { dayGZ = lunar.getDayInGanZhi(); } catch (e) { }
    }
    if (!dayGZ || dayGZ.length < 2) { // 兜底：按儒略日推算日干支
      const jd = Math.floor(Date.UTC(y, mo - 1, d) / 86400000) + 2440588;
      const n = (jd + 49) % 60;
      dayGZ = D.TG[n % 10] + D.DZ[n % 12];
    }
    const dayGan = dayGZ[0], dayZhi = dayGZ[1];
    const monthZhi = monthGZ.length > 1 ? monthGZ[1] : '寅';
    const yearZhi = yearGZ.length > 1 ? yearGZ[1] : '子';

    // 节气 / 月将
    let jq = '';
    if (lunar) {
      try { const p = lunar.getPrevJieQi(); if (p && p.getName) jq = p.getName(); } catch (e) { }
      if (!jq) { try { jq = lunar.getJieQi() || ''; } catch (e) { } }
    }
    if (!jq) jq = approxJieQi(mo, d);
    const yueJiang = o.yueJiang || D.JIEQI_TO_YJ[jq] || '亥';

    // 占时
    const shiZhi = o.shichen || hourToZhi(h);
    const shiGan = D.TG[(tg(dayGan) * 2 + dz(shiZhi)) % 10];
    const isDay = D.DAY_SHICHEN.indexOf(shiZhi) >= 0;
    const shiGZ = shiGan + shiZhi;

    // 天盘（月将加时）
    const yjIdx = dz(yueJiang), shiIdx = dz(shiZhi);
    const tianPan = [];
    for (let i = 0; i < 12; i++) tianPan[i] = D.DZ[(yjIdx + i - shiIdx + 24) % 12];

    // 四课
    const jg = D.JI_GONG[dayGan];
    const k1u = tianPan[dz(jg)];
    const k2u = tianPan[dz(k1u)];
    const k3u = tianPan[dz(dayZhi)];
    const k4u = tianPan[dz(k3u)];
    const siKe = [
      { i: 1, name: '第一课 干上', up: k1u, down: dayGan, downName: '日干' + dayGan + '（寄' + jg + '）', dwx: D.TG_WX[dayGan] },
      { i: 2, name: '第二课 干阴', up: k2u, down: k1u, downName: k1u, dwx: D.DZ_WX[k1u] },
      { i: 3, name: '第三课 支上', up: k3u, down: dayZhi, downName: '日支' + dayZhi, dwx: D.DZ_WX[dayZhi] },
      { i: 4, name: '第四课 支阴', up: k4u, down: k3u, downName: k3u, dwx: D.DZ_WX[k3u] }
    ];
    siKe.forEach(function (k) {
      if (keWx(D.DZ_WX[k.up], k.dwx)) { k.ke = '上克下'; k.keType = 'shang'; }
      else if (keWx(k.dwx, D.DZ_WX[k.up])) { k.ke = '下贼上'; k.keType = 'xia'; }
      else if (shengWx(D.DZ_WX[k.up], k.dwx)) k.ke = '上生下';
      else if (shengWx(k.dwx, D.DZ_WX[k.up])) k.ke = '下生上';
      else k.ke = '比和';
    });

    // 天将盘
    const guiZhi = (isDay ? D.GUI_DAY : D.GUI_NIGHT)[dayGan] || '丑';
    const guiPos = tianPan.indexOf(guiZhi);
    const shunPos = [11, 0, 1, 2, 3, 4]; // 亥子丑寅卯辰 -> 顺行
    const isShun = shunPos.indexOf(guiPos) >= 0;
    const tianJiang = new Array(12);
    for (let i = 0; i < 12; i++) {
      const p = isShun ? (guiPos + i) % 12 : (guiPos - i + 12) % 12;
      tianJiang[p] = D.TIAN_JIANG[i].n;
    }
    const jiangOf = function (zhi) { return tianJiang[tianPan.indexOf(zhi)]; };

    // 旬空 / 遁干
    const ganIdx = tg(dayGan), zhiIdx = dz(dayZhi);
    // 旬首支：候选为子戌申午辰寅(0,10,8,6,4,2)，须满足 (日支-旬首)%10 = 日干 且在旬内
    let xunIdx = ((zhiIdx - ganIdx) % 10 + 10) % 10;
    if ((zhiIdx - xunIdx + 12) % 12 > 9) xunIdx = (xunIdx + 10) % 12;
    const xunShouZhi = D.DZ[xunIdx];
    const kongWang = [D.DZ[(xunIdx + 10) % 12], D.DZ[(xunIdx + 11) % 12]];
    const dunGan = function (zhi) {
      const off = (dz(zhi) - xunIdx + 12) % 12;
      return off < 10 ? D.TG[off] : '—';
    };
    const isKong = function (zhi) { return kongWang.indexOf(zhi) >= 0; };

    // ---------- 三传九宗门 ----------
    const fuYin = (yueJiang === shiZhi);
    const fanYin = (D.CHONG[yueJiang] === shiZhi);
    let chu = null, zhong = null, moChuan = null, keti = '', men = '';

    function pickZeike(list) { // list: 候选课；返回初传支 + 课体名
      if (list.length === 1) return { chu: list[0].up, kt: list[0].keType === 'xia' ? '重审' : '元首' };
      const ganYY = D.TG_YY[dayGan];
      const bi = list.filter(function (k) { return D.DZ_YY[k.up] === ganYY; });
      if (bi.length === 1) return { chu: bi[0].up, kt: '知一' };
      const pool = bi.length > 1 ? bi : list;
      // 涉害：孟（寅申巳亥）深、仲（子午卯酉）次、季（辰戌丑未）浅；同级取先见者
      const weight = function (z) { const m = dz(z) % 3; return m === 2 ? 3 : (m === 0 ? 2 : 1); };
      let best = pool[0], bw = -1;
      for (let i = 0; i < pool.length; i++) {
        const w = weight(pool[i].up);
        if (w > bw) { bw = w; best = pool[i]; }
      }
      return { chu: best.up, kt: '涉害' };
    }

    const xiaKe = siKe.filter(function (k) { return k.keType === 'xia'; });
    const shangKe = siKe.filter(function (k) { return k.keType === 'shang'; });

    if (fuYin) {
      men = '伏吟';
      if (xiaKe.length || shangKe.length) {
        const r = pickZeike(xiaKe.length ? xiaKe : shangKe);
        chu = r.chu; keti = '伏吟';
        zhong = tianPan[dz(chu)]; moChuan = tianPan[dz(zhong)];
      } else {
        chu = (D.TG_YY[dayGan] === '阳') ? k1u : k3u;
        keti = '伏吟';
        const xing = function (z) { return D.ZI_XING.indexOf(z) >= 0 ? D.CHONG[z] : D.XING[z]; };
        zhong = xing(chu); moChuan = xing(zhong);
      }
    } else if (fanYin) {
      men = '返吟';
      if (xiaKe.length || shangKe.length) {
        const r = pickZeike(xiaKe.length ? xiaKe : shangKe);
        chu = r.chu; keti = '返吟';
        zhong = tianPan[dz(chu)]; moChuan = tianPan[dz(zhong)];
      } else {
        chu = D.YI_MA[dayZhi] || D.CHONG[dayZhi];
        keti = '返吟'; zhong = k3u; moChuan = k1u;
      }
    } else if (xiaKe.length) {
      men = '贼克';
      const r = pickZeike(xiaKe); chu = r.chu; keti = r.kt;
      zhong = tianPan[dz(chu)]; moChuan = tianPan[dz(zhong)];
    } else if (shangKe.length) {
      men = '贼克';
      const r = pickZeike(shangKe); chu = r.chu; keti = r.kt;
      zhong = tianPan[dz(chu)]; moChuan = tianPan[dz(zhong)];
    } else {
      // 遥克
      const gwx = D.TG_WX[dayGan];
      const hao = siKe.filter(function (k) { return keWx(D.DZ_WX[k.up], gwx); });   // 神克日 -> 蒿矢
      const dan = siKe.filter(function (k) { return keWx(gwx, D.DZ_WX[k.up]); });   // 日克神 -> 弹射
      if (hao.length) {
        men = '遥克'; keti = '蒿矢';
        chu = hao.length === 1 ? hao[0].up : pickZeike(hao).chu;
        zhong = tianPan[dz(chu)]; moChuan = tianPan[dz(zhong)];
      } else if (dan.length) {
        men = '遥克'; keti = '弹射';
        chu = dan.length === 1 ? dan[0].up : pickZeike(dan).chu;
        zhong = tianPan[dz(chu)]; moChuan = tianPan[dz(zhong)];
      } else {
        // 无克无遥
        const onlyTwo = (k1u === k3u);
        const onlyThree = (k1u === k2u) || (k3u === k4u);
        if (onlyTwo) {
          men = '八专'; keti = '八专';
          chu = (D.TG_YY[dayGan] === '阳') ? tianPan[(dz(k1u) + 3) % 12] : tianPan[(dz(k4u) - 3 + 12) % 12];
          zhong = k1u; moChuan = k1u;
        } else if (onlyThree) {
          men = '别责'; keti = '别责';
          if (D.TG_YY[dayGan] === '阳') {
            chu = tianPan[dz(D.JI_GONG[D.GAN_WU_HE[dayGan]])];
          } else {
            let grp = D.SAN_HE.filter(function (g) { return g.indexOf(dayZhi) >= 0; })[0] || ['申', '子', '辰'];
            const p = (grp.indexOf(dayZhi) - 1 + 3) % 3;
            chu = tianPan[dz(grp[p])];
          }
          zhong = k1u; moChuan = k1u;
        } else {
          men = '昴星'; keti = '昴星';
          if (D.TG_YY[dayGan] === '阳') { chu = tianPan[dz('酉')]; zhong = k3u; moChuan = k1u; }
          else { chu = D.DZ[tianPan.indexOf('酉')]; zhong = k1u; moChuan = k3u; }
        }
      }
    }

    const sanChuan = [chu, zhong, moChuan].map(function (z, i) {
      return {
        pos: ['初传（发用）', '中传', '末传'][i],
        zhi: z,
        gan: dunGan(z),
        jiang: jiangOf(z),
        qin: liuQin(dayGan, z),
        ws: wangShuai(z, monthZhi),
        kong: isKong(z)
      };
    });

    // 四课补充信息
    siKe.forEach(function (k) {
      k.gan = dunGan(k.up);
      k.jiang = jiangOf(k.up);
      k.qin = liuQin(dayGan, k.up);
      k.kong = isKong(k.up);
      k.yjName = D.YUE_JIANG[k.up].name;
    });

    // 神煞（日支/日干起）
    const shenSha = [
      { n: '驿马', z: D.YI_MA[dayZhi] }, { n: '桃花', z: D.TAO_HUA[dayZhi] },
      { n: '日禄', z: D.LU[dayGan] }, { n: '日德', z: D.RI_DE[dayGan] },
      { n: '日贵', z: guiZhi }
    ];

    // 小六壬（农历月起、日起、时起，顺数六神）
    let lunarMonth = 1, lunarDay = 1;
    if (lunar) { try { lunarMonth = Math.abs(lunar.getMonth()); lunarDay = lunar.getDay(); } catch (e) { } }

    // 旺相休囚死（用于天将临传判断）
    const base = {
      date: { y: y, m: mo, d: d, h: h, mi: mi },
      yearGZ: yearGZ, monthGZ: monthGZ, dayGZ: dayGZ, shiGZ: shiGZ,
      jieqi: jq, yueJiang: yueJiang, yueJiangName: D.YUE_JIANG[yueJiang].name,
      shiZhi: shiZhi, isDay: isDay, guiZhi: guiZhi, guiPos: guiPos, guiShun: isShun,
      tianPan: tianPan, siKe: siKe, sanChuan: sanChuan,
      tianJiang: tianJiang, jiangOf: jiangOf,
      dayGan: dayGan, dayZhi: dayZhi, monthZhi: monthZhi, yearZhi: yearZhi,
      kongWang: kongWang, xunShouZhi: xunShouZhi, dunGan: dunGan, isKong: isKong,
      keti: keti, men: men, fuYin: fuYin, fanYin: fanYin,
      lunarMD: lunarMonth + '月' + lunarDay, xlr: D.XIAO_LIU_REN[(lunarMonth - 1 + lunarDay - 1 + dz(shiZhi)) % 6],
      shenSha: shenSha, liuQin: liuQin, wangShuai: wangShuai
    };
    base.duan = duan(base, o.question || '综合');
    return base;
  }

  // ---------- 白话断课 ----------
  function duan(p, question) {
    const out = { keti: '', ketiPlain: '', geju: [], chuan: [], leiShen: '', summary: '', score: 0, yi: [], ji: [], yingqi: '' };
    const kt = D.KE_TI[p.keti] || D.KE_TI['元首'];
    out.keti = p.keti + '课';
    out.ketiPlain = kt.plain + '（起法：' + kt.men + '）';

    // 三传逐条
    let score = 0;
    ['初传', '中传', '末传'].forEach(function (_, i) {
      const c = p.sanChuan[i];
      const tj = D.TIAN_JIANG.filter(function (t) { return t.n === c.jiang; })[0] || { jx: '平', plain: '' };
      let w = 0;
      if (tj.jx === '吉') w += 2; else if (tj.jx === '凶') w -= 2;
      if (c.ws === '旺' || c.ws === '相') w += 1; else if (c.ws === '死' || c.ws === '囚') w -= 1;
      if (c.kong) w -= 2;
      if (c.qin === '官鬼') w -= 1;
      if (c.qin === '妻财' || c.qin === '父母') w += 1;
      score += w * [1.4, 1, 1.2][i];
      const marks = [];
      if (c.kong) marks.push('落空亡');
      if (c.ws === '旺' || c.ws === '相') marks.push('旺相有力');
      if (c.ws === '死' || c.ws === '囚') marks.push('衰弱无力');
      out.chuan.push({
        pos: c.pos, zhi: c.zhi, gan: c.gan, jiang: c.jiang, qin: c.qin,
        text: c.pos + ' ' + c.zhi + '（' + c.jiang + '）：' + tj.plain + '。' +
          '于日主为「' + c.qin + '」，临' + c.gan + '干，' + (marks.length ? marks.join('、') + '。' : '平。')
      });
    });
    out.score = Math.round(score);

    // 格局提示
    const z = p.sanChuan.map(function (c) { return c.zhi; });
    const g = [];
    D.SAN_HE.forEach(function (grp) { if (grp.every(function (x) { return z.indexOf(x) >= 0; })) g.push('三传会成 ' + grp.join('') + ' 局，事有聚合之象'); });
    const i0 = dz(z[0]), i1 = dz(z[1]), i2 = dz(z[2]);
    if (Math.abs(i1 - i0) === 1 && Math.abs(i2 - i1) === 1) g.push('三传连茹，事情前后相接、循序渐进');
    if (Math.abs(i1 - i0) === 2 && Math.abs(i2 - i1) === 2) g.push('三传间传，过程有间隔、中间要过一道关');
    if (D.YI_MA[p.dayZhi] === z[0]) g.push('驿马发用，事来迅速、主有变动出行');
    if (p.isKong(z[0]) || p.isKong(z[2])) g.push('传见空亡，结果虚而不实，宜降低预期');
    if (D.MU[D.TG_WX[p.dayGan]] === z[2]) g.push('末传入墓，收尾迟缓、宜早做了断');
    if (shengWx(D.DZ_WX[z[2]], D.TG_WX[p.dayGan])) g.push('末传生我，结局有人相助，先难后易');
    if (keWx(D.DZ_WX[z[2]], D.TG_WX[p.dayGan])) g.push('末传克我，收尾有压力，见好就收');
    if (p.sanChuan[0].jiang === '青龙' || p.sanChuan[0].jiang === '贵人') g.push('吉将发用，开局得力');
    if (p.sanChuan[0].jiang === '白虎' || p.sanChuan[0].jiang === '玄武') g.push('凶将发用，开局宜守');
    out.geju = g;

    // 类神
    const ls = D.LEI_SHEN[question] || D.LEI_SHEN['综合'];
    const gwx = D.TG_WX[p.dayGan];
    const wantWx = (function () {
      if (ls.key === '妻财') return D.KE[gwx];
      if (ls.key === '官鬼') return D.KE_ME[gwx];
      if (ls.key === '父母') return D.SHENG_ME[gwx];
      if (ls.key === '子孙') return D.SHENG[gwx];
      return gwx;
    })();
    const leiZhi = D.DZ.filter(function (x) { return D.DZ_WX[x] === wantWx; });
    const inChuan = leiZhi.filter(function (x) { return z.indexOf(x) >= 0; });
    const inKe = leiZhi.filter(function (x) { return p.siKe.some(function (k) { return k.up === x; }); });
    let lt = '占「' + question + '」，类神取' + ls.key + '（' + wantWx + '：' + leiZhi.join('') + '）。';
    if (inChuan.length) {
      const c = p.sanChuan.filter(function (c) { return inChuan.indexOf(c.zhi) >= 0; })[0];
      lt += '类神' + inChuan.join('、') + '入' + c.pos.slice(0, 2) + '，临' + c.jiang + '，' + (c.kong ? '但落空亡，看着有、实则虚' : '旺衰为' + c.ws + '，事情有实质进展');
    } else if (inKe.length) {
      lt += '类神在四课而不入三传，说明此事有迹象但尚未发动，需等待时机';
    } else {
      lt += '类神不入课传，此事缘分较浅、暂时难成，宜另寻时机或换个方向';
    }
    lt += '。' + ls.tip;
    out.leiShen = lt;
    out.leiZhi = leiZhi;
    out.leiJiang = ls.jiang;

    // 宜忌
    if (out.score >= 3) { out.yi = ['主动推进、当面沟通', '把握初传所指的时机', '求助贵人与长辈']; out.ji = ['拖延观望、反复改主意']; }
    else if (out.score >= 0) { out.yi = ['稳中求进，先做小范围试探', '把关键环节落在书面', '多听一位信得过的人意见']; out.ji = ['孤注一掷', '轻信口头承诺（天空、玄武临传）']; }
    else { out.yi = ['守成为主，先止损再谈进', '低调处理、避免正面冲突', '把健康与安全放第一位']; out.ji = ['冒进投资、签约许诺', '与健康、法律相关的侥幸心理']; }
    if (p.keti === '伏吟') out.yi.unshift('维持现状，等下一轮时机');
    if (p.keti === '返吟') out.yi.unshift('接受反复，做好两手准备');
    if (p.keti === '八专' || p.keti === '别责') out.yi.unshift('把条件补齐再动手');

    // 应期
    const mo = p.sanChuan[2];
    let grp = D.SAN_HE.filter(function (x) { return x.indexOf(mo.zhi) >= 0; })[0] || [mo.zhi];
    out.yingqi = '末传' + mo.zhi + '为结局，应期多应在' + mo.zhi + '日/' + mo.zhi + '月，或' + grp.join('') + '三合之日；' +
      (mo.ws === '旺' || mo.ws === '相' ? '旺相则来得快' : '衰弱则要拖得久一些');

    // 总断
    const tone = out.score >= 3 ? '整体偏吉，可以往前走' : (out.score >= 0 ? '吉凶参半，宜稳不宜急' : '整体偏凶，宜守不宜进');
    out.summary = '此课' + out.keti + '，' + tone + '。初传' + p.sanChuan[0].zhi + p.sanChuan[0].jiang +
      '起头，中传' + p.sanChuan[1].zhi + p.sanChuan[1].jiang + '转折，末传' + p.sanChuan[2].zhi + p.sanChuan[2].jiang +
      '收尾——初看发端如何，中看过程转折，末看最后落点。';
    return out;
  }

  return { paipan: paipan, hourToZhi: hourToZhi, SHICHEN_TIME: SHICHEN_TIME };
})();
