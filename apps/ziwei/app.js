/* 紫微斗数 · 界面渲染与交互 */
(function () {
  'use strict';

  var A = null;                 // 当前星盘
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };

  function initShichen() {
    var sel = $('in-shichen'), html = '';
    ZW.TIME_INDEX.forEach(function (t) {
      html += '<option value="' + t.v + '">' + t.n + '（' + t.r + '）</option>';
    });
    sel.innerHTML = html;
    sel.value = '6';
  }

  function initTopic() {
    var sel = $('in-topic'), html = '';
    ZW_DATA.TOPICS.forEach(function (t) {
      html += '<option value="' + t.k + '">' + t.n + '</option>';
    });
    sel.innerHTML = html;
    sel.value = 'overall';
  }

  function fmtDate(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }

  /* ---------- 盘面 ---------- */
  function starHtml(s, isMajor) {
    var b = s.brightness || '';
    var cls = 'st' + (isMajor ? ' mj' : ' mn');
    var bh = b ? '<i class="br ' + (ZW_DATA.BRIGHTNESS[b] ? ZW_DATA.BRIGHTNESS[b].cls : '') + '">' + b + '</i>' : '';
    var mh = s.mutagen ? '<i class="mu ' + (ZW_DATA.MUTAGEN[s.mutagen] ? ZW_DATA.MUTAGEN[s.mutagen].cls : '') + '">' + s.mutagen + '</i>' : '';
    return '<span class="' + cls + '">' + esc(s.name) + bh + mh + '</span>';
  }

  function cellHtml(a, idx, dc, hz) {
    var p = a.palaces[idx];
    var cls = ['pc'];
    if (p.name === '命宫') cls.push('ming');
    if (p.isBodyPalace) cls.push('shen');
    if (dc && dc.cur && dc.cur.index === idx) cls.push('limit');
    if (hz && hz.yearly && hz.yearly.index === idx) cls.push('ly');

    var majors = (p.majorStars || []).map(function (s) { return starHtml(s, true); }).join('');
    var minors = (p.minorStars || []).map(function (s) { return starHtml(s, false); }).join('');
    var adjs = (p.adjectiveStars || []).map(function (s) { return s.name; }).join(' ');
    var tags = '';
    if (p.name === '命宫') tags += '<span class="tagm red">命</span>';
    if (p.isBodyPalace) tags += '<span class="tagm gold">身</span>';
    if (dc && dc.cur && dc.cur.index === idx) tags += '<span class="tagm blue">限</span>';
    if (hz && hz.yearly && hz.yearly.index === idx) tags += '<span class="tagm green">流年</span>';

    return '<div class="' + cls.join(' ') + '" data-idx="' + idx + '"><div class="ptags">' + tags + '</div>' +
      '<div class="ph"><span class="pn">' + esc(p.name) + '</span><span class="pb">' + esc(p.heavenlyStem + ZW.BRANCHES[idx]) + '</span></div>' +
      '<div class="pstars">' + (majors || '<span class="st empty">空宫</span>') + '</div>' +
      '<div class="pminor">' + (minors || '&nbsp;') + '</div>' +
      '<div class="padj">' + esc(adjs) + '</div>' +
      '<div class="page">' + (p.decadal && p.decadal.range ? p.decadal.range[0] + '-' + p.decadal.range[1] + '岁' : '') + '</div>' +
      '</div>';
  }

  function centerHtml(a, dc) {
    var mi = ZW.idxOfPalace(a, '命宫');
    var mp = a.palaces[mi];
    var s0 = (mp.majorStars || [])[0];
    return '<div class="pcenter">' +
      '<div class="ct">命 盘</div>' +
      '<div class="cl">五行局<b>' + esc(a.fiveElementsClass) + '</b></div>' +
      '<div class="cl">命宫<b>' + esc(ZW.BRANCHES[mi]) + '</b></div>' +
      '<div class="cl">命主<b>' + esc(a.soul || (s0 ? s0.name : '')) + '</b></div>' +
      '<div class="cl">身主<b>' + esc(a.body || '') + '</b></div>' +
      '<div class="cl">四柱<b>' + esc(a.chineseDate) + '</b></div>' +
      '<div class="cl">农历<b>' + esc(a.lunarDate) + '</b></div>' +
      '<div class="cl cur">大限<b>' + (dc && dc.cur ? dc.cur.palaceName + ' ' + dc.cur.ageRange[0] + '-' + dc.cur.ageRange[1] + '岁' : '') + '</b></div>' +
      '</div>';
  }

  function renderPan(a, dc, hz) {
    var html = '', centerDone = false;
    ZW.LAYOUT.forEach(function (row) {
      row.forEach(function (idx) {
        if (idx < 0) {
          if (!centerDone) { html += centerHtml(a, dc); centerDone = true; }
        } else {
          html += cellHtml(a, idx, dc, hz);
        }
      });
    });
    $('pan').innerHTML = html;
    Array.prototype.forEach.call($('pan').querySelectorAll('.pc'), function (el) {
      el.addEventListener('click', function () { showPalace(parseInt(el.getAttribute('data-idx'), 10)); });
    });
  }

  function showPalace(idx) {
    var a = A, p = a.palaces[idx];
    var info = ZW.palaceBrief(a, idx);
    var majors = (p.majorStars || []).map(function (s) {
      var i = ZW_DATA.starInfo(s.name, s.type);
      return '<div class="line"><b>' + esc(s.name) + (s.brightness ? '（' + s.brightness + '）' : '') +
        (s.mutagen ? '　化' + s.mutagen : '') + '</b>' + esc(i.text) + (i.extra ? '<br><span class="sub">' + esc(i.extra) + '</span>' : '') + '</div>';
    }).join('');
    var minors = (p.minorStars || []).map(function (s) {
      return '<span class="badge">' + esc(s.name) + '：' + esc(ZW_DATA.starInfo(s.name, s.type).text) + '</span>';
    }).join('');
    var adjs = (p.adjectiveStars || []).map(function (s) {
      return '<span class="badge soft">' + esc(s.name) + '：' + esc(ZW_DATA.starInfo(s.name, s.type).text) + '</span>';
    }).join('');
    $('pan-note').innerHTML =
      '<div class="pn-title">' + esc(info.head) + '</div>' +
      '<div class="line"><b>宫位</b>' + esc(info.brief) + '<br><span class="sub">' + esc(info.focus) + '</span></div>' +
      (majors || '<div class="line">本宫无主星，借对宫「' + esc(a.palaces[ZW.duigong(idx)].name) + '」之星论断。</div>') +
      (minors ? '<div class="line"><b>辅星</b>' + minors + '</div>' : '') +
      (adjs ? '<div class="line"><b>杂曜</b>' + adjs + '</div>' : '') +
      '<div class="line"><b>长生</b>' + esc(p.changsheng12 || '') + '　' + esc(ZW_DATA.CHANGSHENG[p.changsheng12] || '') +
      '　<span class="sub">大限 ' + (p.decadal && p.decadal.range ? p.decadal.range[0] + '–' + p.decadal.range[1] + ' 岁' : '') + '</span></div>';
  }

  /* ---------- 一句话总评 ---------- */
  function renderSummary(a, dateStr) {
    var s = ZW.summary(a, dateStr);
    var tags = s.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('');
    var scores = s.scores.map(function (sc) {
      var why = (sc.plus[0] || sc.minus[0] || '配置平顺');
      return '<div class="sc-row"><span class="sc-n">' + esc(sc.n) + '</span>' +
        '<span class="sc-bar"><i style="width:' + sc.score + '%"></i></span>' +
        '<span class="sc-v">' + sc.score + '</span>' +
        '<span class="sc-why">' + esc(why) + '</span></div>';
    }).join('');
    var li = function (arr) { return arr.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join(''); };

    $('summary').innerHTML =
      '<div class="sum-card">' +
        '<div class="sum-head">' + esc(s.headline) + '</div>' +
        '<div class="sum-tags">' + tags + '</div>' +
        '<div class="sc-list">' + scores + '</div>' +
        '<div class="sum-bottom">' + esc(s.bottom) + '</div>' +
      '</div>' +
      '<div class="kv2">' +
        '<div class="box"><div class="t ok">你的优势</div><ul>' + li(s.good.slice(0, 6)) + '</ul></div>' +
        '<div class="box"><div class="t no">要注意的</div><ul>' + li(s.watch.slice(0, 6)) + '</ul></div>' +
      '</div>' +
      '<div class="advice"><div class="t">给你的建议</div><ul>' + li(s.advice.slice(0, 6)) + '</ul></div>';
  }

  /* ---------- 按事问答 ---------- */
  function renderTopic(a, dateStr) {
    var k = $('in-topic').value || 'overall';
    var t = ZW.topic(a, k, dateStr);
    var lv = t.level === '顺' ? 'ok' : (t.level === '平' ? 'mid' : 'no');
    $('topic-box').innerHTML =
      '<div class="tp-head">' +
        '<span class="tp-p">看「' + esc(t.palace) + '」宫（' + esc(t.branch) + '）</span>' +
        '<span class="tp-s">' + esc(t.stars) + '</span>' +
        '<span class="tp-lv ' + lv + '">' + esc(t.level) + ' · ' + t.score + ' 分</span>' +
      '</div>' +
      t.paras.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
      '<div class="tp-tips">' + t.tips.map(function (x) { return '<span class="badge">' + esc(x) + '</span>'; }).join('') + '</div>';
  }

  /* ---------- 其它区块 ---------- */
  function renderBasis(a, dc) {
    var stems = (a.chineseDate || '').split(' ');
    $('basis').innerHTML =
      '<span><b>四柱</b>' + esc(a.chineseDate) + '</span>' +
      '<span><b>农历</b>' + esc(a.lunarDate) + '</span>' +
      '<span><b>时辰</b>' + esc(a.time + ' ' + a.timeRange) + '</span>' +
      '<span><b>生肖</b>' + esc(a.zodiac) + '</span>' +
      '<span><b>星座</b>' + esc(a.sign) + '</span>' +
      '<span><b>五行局</b>' + esc(a.fiveElementsClass) + '　' + esc(ZW_DATA.FIVE_CLASS[a.fiveElementsClass] || '') + '</span>' +
      '<span><b>命宫地支</b>' + esc(a.earthlyBranchOfSoulPalace) + '</span>' +
      '<span><b>身宫地支</b>' + esc(a.earthlyBranchOfBodyPalace) + '</span>' +
      '<span><b>性别</b>' + (a.gender === 'female' ? '女' : '男') + '</span>' +
      '<span><b>当前大限</b>' + (dc && dc.cur ? dc.cur.palaceName + '（' + dc.cur.ageRange[0] + '–' + dc.cur.ageRange[1] + '岁）' : '') + '</span>';
  }

  function renderRead(a, r) {
    $('duan').innerHTML = r.lines.map(function (l) {
      return '<p class="sum-lead">' + esc(l.t) + '</p><p>' + esc(l.s) + '</p>';
    }).join('');

    $('patterns').innerHTML = r.patterns.length
      ? r.patterns.map(function (p) {
        return '<div class="line"><b class="' + (p.good === 'good' ? 'ok' : p.good === 'bad' ? 'no' : '') + '">' + esc(p.name) + '</b>' + esc(p.desc) + '</div>';
      }).join('')
      : '<div class="line">本命盘没有特别明显的传统格局，按各宫主星组合来论即可。</div>';

    $('sihua').innerHTML = r.sihua.length
      ? r.sihua.map(function (s) {
        return '<div class="line"><b class="' + (ZW_DATA.MUTAGEN[s.mu] ? ZW_DATA.MUTAGEN[s.mu].cls : '') + '">' +
          esc(s.star + '化' + s.mu) + '</b>' + esc(s.palace + '宫（' + s.branch + '）') + '　' + esc(s.text) + '</div>';
      }).join('')
      : '<div class="line">本盘生年四化不明显。</div>';
  }

  function renderPalaceList(a) {
    var html = '';
    ZW.LAYOUT.forEach(function (row) {
      row.forEach(function (idx) {
        if (idx < 0) return;
        var b = ZW.palaceBrief(a, idx);
        html += '<div class="line"><b>' + esc(b.name) + '（' + esc(b.branch) + '）</b>' + esc(b.stars) +
          '<br><span class="sub">' + esc(b.main || b.brief) + '</span></div>';
      });
    });
    $('palace-list').innerHTML = html;
  }

  function renderDecadal(a, dc) {
    var html = dc.list.map(function (d) {
      var cur = dc.cur && dc.cur.index === d.index && dc.cur.ageRange[0] === d.ageRange[0];
      return '<div class="dc' + (cur ? ' cur' : '') + '"><div class="da">' + d.ageRange[0] + '–' + d.ageRange[1] + '岁</div>' +
        '<div class="dp">' + esc(d.palaceName) + '</div><div class="dg">' + esc(d.heavenlyStem + d.earthlyBranch) + '</div></div>';
    }).join('');
    $('decadal').innerHTML = html;
  }

  function renderYearly(a, hz) {
    if (!hz || !hz.yearly) { $('yearly').innerHTML = ''; return; }
    var y = hz.yearly;
    var pname = y.palaceNames[y.index];
    $('yearly').innerHTML =
      '<div class="line"><b>流年宫</b>' + esc(pname) + '宫（' + esc(y.heavenlyStem + y.earthlyBranch) + '）　' + esc((ZW_DATA.PALACES[pname] || {}).brief || '') + '</div>' +
      '<div class="line"><b>流年四化</b>' + esc(y.mutagen.join('、')) + '　<span class="sub">顺序：化禄、化权、化科、化忌</span></div>' +
      '<div class="line"><b>流年星</b>' + esc(y.stars.map(function (ss) {
        return ss.map(function (s) { return s.name; }).join('、');
      }).filter(function (t) { return t; }).join('　')) + '</div>' +
      '<div class="line"><b>小限</b>' + esc(hz.age ? hz.age.nominalAge + ' 岁，' + hz.age.heavenlyStem + hz.age.earthlyBranch : '') + '</div>';
  }

  /* ---------- 主流程 ---------- */
  function renderAll() {
    var a = A;
    var year = parseInt($('in-year').value, 10) || new Date().getFullYear();
    var dateStr = year + '-06-01';
    var hz = ZW.horoscope(a, dateStr);
    var r = ZW.read(a, dateStr);
    var dc = r.decadal;

    renderSummary(a, dateStr);
    renderTopic(a, dateStr);
    renderBasis(a, dc);
    renderPan(a, dc, hz);
    showPalace(ZW.idxOfPalace(a, '命宫'));
    renderRead(a, r);
    renderPalaceList(a);
    renderDecadal(a, dc);
    renderYearly(a, hz);
    $('result').classList.add('show');
  }

  function pai() {
    var date = $('in-date').value || fmtDate(new Date());
    A = ZW.pai({
      date: date,
      timeIndex: parseInt($('in-shichen').value, 10),
      gender: $('in-gender').value,
      fixLeap: $('in-fixleap').checked
    });
    $('casting').classList.add('show');
    $('result').classList.remove('show');
    setTimeout(function () {
      $('casting').classList.remove('show');
      renderAll();
      $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 620);
  }

  function bind() {
    $('btn-pai').addEventListener('click', pai);
    $('btn-now').addEventListener('click', function () {
      var d = new Date();
      $('in-date').value = fmtDate(d);
      $('in-shichen').value = String(ZW.timeIndexByHour(d.getHours()));
    });
    $('btn-sample').addEventListener('click', function () {
      var y = 1955 + Math.floor(Math.random() * 50);
      var m = 1 + Math.floor(Math.random() * 12);
      var d = 1 + Math.floor(Math.random() * 28);
      $('in-date').value = y + '-' + (m < 10 ? '0' + m : m) + '-' + (d < 10 ? '0' + d : d);
      $('in-shichen').value = String(Math.floor(Math.random() * 13));
      $('in-gender').value = Math.random() > 0.5 ? 'male' : 'female';
      pai();
    });
    $('in-year').addEventListener('change', function () { if (A) renderAll(); });
    $('in-topic').addEventListener('change', function () {
      if (A) renderTopic(A, ($('in-year').value || new Date().getFullYear()) + '-06-01');
    });
  }

  window.addEventListener('DOMContentLoaded', function () {
    initShichen();
    initTopic();
    var d = new Date();
    $('in-date').value = fmtDate(d);
    $('in-shichen').value = String(ZW.timeIndexByHour(d.getHours()));
    $('in-year').value = d.getFullYear();
    bind();
  });
})();
