/* BuildMate 共通機能（読了バー / 導入効果シミュレーター / LINE風ご相談ガイド / 記事末尾導線） */
(function () {
  var isArticle = document.body && document.body.classList.contains('bm-article-page');
  var pathName = (window.location.pathname || '').toLowerCase();
  var isNewsDir = pathName.indexOf('/news/') !== -1 || isArticle;
  var base = isNewsDir ? '../' : '';

  /* 1. 記事ページの読了プログレスバー（モーション軽減設定時はオフ） */
  function initReadProgress() {
    if (!document.body.classList.contains('bm-article-page')) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var bar = document.createElement('div');
    bar.className = 'bm-read-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    var ticking = false;
    function updateBar() {
      ticking = false;
      var doc = document.documentElement;
      var scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        bar.style.transform = 'scaleX(0)';
        return;
      }
      var ratio = Math.min(Math.max(window.scrollY / scrollable, 0), 1);
      bar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateBar);
      }
    }, { passive: true });
    updateBar();
  }

  /* 2. 導入効果シミュレーター（services.html #roi-simulator） */
  function initSimulator() {
    var staffRange = document.getElementById('bmStaffRange');
    var hoursRange = document.getElementById('bmHoursRange');
    if (!staffRange || !hoursRange) return;

    var staffOut = document.getElementById('bmStaffOut');
    var hoursOut = document.getElementById('bmHoursOut');
    var monthlyHoursEl = document.getElementById('bmMonthlyHours');
    var yearlyHoursEl = document.getElementById('bmYearlyHours');
    var yearlyYenEl = document.getElementById('bmYearlyYen');
    var beforeLabel = document.getElementById('bmBeforeLabel');
    var afterLabel = document.getElementById('bmAfterLabel');
    var afterBar = document.getElementById('bmAfterBar');
    var translateBox = document.getElementById('bmTranslateBox');
    var adviceText = document.getElementById('bmAdviceText');
    var simCta = document.getElementById('bmSimCta');
    var taskBtns = Array.prototype.slice.call(document.querySelectorAll('.bm-sim-task'));

    var lastState = {};

    function calcSim() {
      var staff = Number(staffRange.value);
      var weeklyHours = Number(hoursRange.value);
      staffOut.textContent = staff;
      hoursOut.textContent = weeklyHours;

      var rate = 0.16;
      var tips = [];
      var selectedNames = [];
      var selectedCats = [];
      taskBtns.forEach(function (btn) {
        if (btn.getAttribute('aria-pressed') === 'true') {
          rate += Number(btn.getAttribute('data-rate'));
          tips.push('「' + btn.getAttribute('data-tip') + '」');
          var labelSpan = btn.querySelectorAll('span')[1];
          if (labelSpan) selectedNames.push(labelSpan.textContent);
          var cat = btn.getAttribute('data-cat');
          if (cat && selectedCats.indexOf(cat) === -1) selectedCats.push(cat);
        }
      });
      rate = Math.min(rate, 0.55);

      var beforeMonthly = staff * weeklyHours * 4;
      var savedMonthly = Math.round(beforeMonthly * rate);
      var afterMonthly = Math.max(1, beforeMonthly - savedMonthly);
      var afterPct = Math.round((afterMonthly / beforeMonthly) * 100);
      var yearly = savedMonthly * 12;
      var yenMan = Math.round((yearly * 2500) / 10000);
      var workDays = Math.round(yearly / 8);
      var meetingsPerMonth = Math.max(1, Math.round(savedMonthly / 1.5));

      monthlyHoursEl.innerHTML = '約 ' + savedMonthly.toLocaleString() + '<small>時間 / 月</small>';
      yearlyHoursEl.innerHTML = '約 ' + yearly.toLocaleString() + '<small>時間</small>';
      yearlyYenEl.innerHTML = '約 ' + yenMan.toLocaleString() + '<small>万円 / 年</small>';
      beforeLabel.textContent = beforeMonthly.toLocaleString() + ' 時間';
      afterLabel.textContent = afterMonthly.toLocaleString() + ' 時間（-' + Math.round(rate * 100) + '%）';
      afterBar.style.width = afterPct + '%';

      translateBox.innerHTML =
        'これは年間で <strong>約 ' + workDays.toLocaleString() + ' 営業日分</strong>、お客様との打ち合わせなら <strong>毎月 約 ' + meetingsPerMonth.toLocaleString() + ' 回分</strong> のゆとりに相当します。';

      if (tips.length > 0) {
        adviceText.textContent = tips.slice(0, 2).join('・') + 'から着手すると、初月から効果を実感しやすいです。';
      } else {
        adviceText.textContent = 'まずは1〜2つ、今いちばん負担が大きい業務を選んでみてください。';
      }

      lastState = {
        staff: staff,
        weeklyHours: weeklyHours,
        savedMonthly: savedMonthly,
        yearly: yearly,
        yenMan: yenMan,
        selectedNames: selectedNames,
        selectedCats: selectedCats
      };
    }

    staffRange.addEventListener('input', calcSim);
    hoursRange.addEventListener('input', calcSim);
    taskBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pressed = btn.getAttribute('aria-pressed') === 'true';
        btn.setAttribute('aria-pressed', String(!pressed));
        btn.querySelector('.bm-sim-dot').textContent = pressed ? '' : '✓';
        calcSim();
      });
    });

    if (simCta) {
      simCta.addEventListener('click', function () {
        try {
          var summary =
            '【導入効果シミュレーターの試算結果】\n' +
            '・対象人数：' + lastState.staff + '名\n' +
            '・1人あたり週の事務時間：約' + lastState.weeklyHours + '時間\n' +
            '・減らしたい業務：' + (lastState.selectedNames.length ? lastState.selectedNames.join('／') : '未選択') + '\n' +
            '・試算目安：月 約' + lastState.savedMonthly + '時間削減（年間 約' + lastState.yearly + '時間／約' + lastState.yenMan + '万円相当）\n\n' +
            'この内容をもとに、自社でどこから進めるのが良さそうか相談したいです。';
          sessionStorage.setItem('bm_contact_prefill', JSON.stringify({
            sourceLabel: '導入効果シミュレーター',
            categories: lastState.selectedCats,
            message: summary
          }));
        } catch (err) {}
      });
    }

    calcSim();
  }

  /* 3. コラム記事末尾の重複相談枠整理・3択導線カード・スマホ固定バー一括適用 */
  function initArticleCta() {
    if (document.querySelector('.mobile-sticky-cta')) {
      document.body.classList.add('has-mobile-sticky');
    }
    if (!document.body.classList.contains('bm-article-page')) return;

    // 記事ページへスマホ下部固定CTAバーを一括挿入
    if (!document.querySelector('.mobile-sticky-cta')) {
      var sticky = document.createElement('div');
      sticky.className = 'mobile-sticky-cta';
      sticky.innerHTML =
        '<div class="mobile-sticky-cta-grid">' +
          '<a href="' + base + 'diagnosis.html" class="m-sub">1分AI診断</a>' +
          '<a href="' + base + 'contact.html" class="m-main">無料相談する</a>' +
        '</div>';
      document.body.appendChild(sticky);
      document.body.classList.add('has-mobile-sticky');
    }

    var article = document.querySelector('article');
    if (!article) return;

    // 全132記事の直書き相談枠を非表示化し、著者欄がある場合はその直後に配置
    var insertAnchor = article;
    var sib = article.nextElementSibling;
    while (sib) {
      if (sib.querySelector && sib.querySelector('img[src*="HP_profile"]')) {
        insertAnchor = sib;
      } else if (
        !sib.classList.contains('bm-article-cta') &&
        sib.querySelector &&
        sib.querySelector('a[href$="contact.html"]') &&
        !sib.querySelector('img[src*="HP_profile"]')
      ) {
        sib.style.display = 'none';
        sib.setAttribute('aria-hidden', 'true');
      }
      sib = sib.nextElementSibling;
    }

    if (document.querySelector('.bm-article-cta')) return;

    var box = document.createElement('section');
    box.className = 'bm-article-cta';
    box.setAttribute('aria-label', '次のステップのご案内');
    box.innerHTML =
      '<span class="bm-article-cta-eyebrow">NEXT STEP / 自社の業務に当てはめてみる</span>' +
      '<h2 class="bm-article-cta-title">「うちの場合は何から始めるべき？」を整理しませんか</h2>' +
      '<p class="bm-article-cta-text">高額な専用システムは不要です。まずは1分の無料診断や導入効果の試算から、御社に合うムリのない進め方を確認してみてください。</p>' +
      '<div class="bm-article-cta-grid">' +
        '<a href="' + base + 'diagnosis.html" class="bm-article-cta-btn">' +
          '<span class="bm-article-cta-sub">1分で完了・無料</span>' +
          '<span class="bm-article-cta-label">AI活用ポテンシャル診断 →</span>' +
        '</a>' +
        '<a href="' + base + 'services.html#roi-simulator" class="bm-article-cta-btn">' +
          '<span class="bm-article-cta-sub">30秒で試算</span>' +
          '<span class="bm-article-cta-label">削減時間シミュレーター →</span>' +
        '</a>' +
        '<a href="' + base + 'contact.html" class="bm-article-cta-btn is-primary">' +
          '<span class="bm-article-cta-sub">オンライン30分・準備不要</span>' +
          '<span class="bm-article-cta-label">木村に無料相談する →</span>' +
        '</a>' +
      '</div>';

    insertAnchor.parentNode.insertBefore(box, insertAnchor.nextSibling);
  }

  /* 4. LINE風「ご相談ガイド」（全ページ共通・3往復・コラム記事案内・記憶機能） */
  function initChatGuide() {
    // 問い合わせフォーム・完了ページでは邪魔にならないよう非表示
    if (/(?:^|\/)(?:contact|thanks)\.html$/i.test(pathName)) return;
    if (document.getElementById('bmChatPanel')) return;

    var avatarSrc = base + 'HP_profile.webp';
    var state = { topic: '', detail: '', level: '', categories: [] };

    // ランチャー＆吹き出し
    var wrap = document.createElement('div');
    wrap.className = 'bm-chat-wrap';
    wrap.innerHTML =
      '<div class="bm-chat-callout" id="bmChatCallout">' +
        '<span>お悩みに合う記事をご案内します</span>' +
        '<button type="button" class="bm-chat-callout-close" id="bmCalloutClose" aria-label="閉じる">×</button>' +
      '</div>' +
      '<button type="button" class="bm-chat-trigger" id="bmChatTrigger" aria-expanded="false" aria-controls="bmChatPanel">' +
        '<img src="' + avatarSrc + '" alt="木村" class="bm-chat-trigger-avatar">' +
        '<span>ご相談ガイド</span>' +
      '</button>';

    // チャットパネル
    var panel = document.createElement('aside');
    panel.className = 'bm-chat-panel';
    panel.id = 'bmChatPanel';
    panel.setAttribute('aria-label', 'BuildMate ご相談ガイド');
    panel.innerHTML =
      '<div class="bm-chat-head">' +
        '<div class="bm-chat-head-left">' +
          '<img src="' + avatarSrc + '" alt="BuildMate 木村" class="bm-chat-head-avatar">' +
          '<div>' +
            '<span class="bm-chat-title">BuildMate ご相談ガイド</span>' +
            '<span class="bm-chat-status"><span class="bm-chat-dot"></span>選ぶだけで合う記事をご案内</span>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="bm-chat-close" id="bmChatClose" aria-label="閉じる">×</button>' +
      '</div>' +
      '<div class="bm-chat-body" id="bmChatBody"></div>';

    document.body.appendChild(wrap);
    document.body.appendChild(panel);

    var trigger = document.getElementById('bmChatTrigger');
    var closeBtn = document.getElementById('bmChatClose');
    var callout = document.getElementById('bmChatCallout');
    var calloutClose = document.getElementById('bmCalloutClose');
    var bodyEl = document.getElementById('bmChatBody');

    try {
      if (sessionStorage.getItem('bm_callout_closed') === '1' && callout) {
        callout.style.display = 'none';
      }
    } catch (err) {}

    // 記事データベース（実在するコラム記事のみ）
    var articles = {
      nippo_beg: { tag: 'おすすめコラム', title: '紙の日報はもう古い？音声入力で終わらせる現場報告', url: 'news/013-voice-daily-report.html' },
      nippo_auto: { tag: 'おすすめコラム', title: '工務店の日報・週報作成をAIで自動化する方法｜60分→10分に短縮', url: 'news/067-nippo-ai.html' },
      shashin_auto: { tag: 'あわせて読みたい', title: '工務店の施工写真整理・報告書作成をAI・GASで自動化する方法｜1時間→10分', url: 'news/049-koji-shashin-gas.html' },
      mitsumori_beg: { tag: 'おすすめコラム', title: '見積書作成のミスをAIチェックで防ぐ方法', url: 'news/024-estimate-ai-check.html' },
      mitsumori_auto: { tag: 'おすすめコラム', title: '工務店の原価計算・見積書の作成をAI・GASで自動化する方法｜3時間→30分', url: 'news/095-genka-gas.html' },
      gyosha_beg: { tag: 'おすすめコラム', title: '協力業者とのFAXやり取りを卒業するステップ', url: 'news/052-fax-to-digital.html' },
      gyosha_auto: { tag: 'おすすめコラム', title: '工務店の業者への工程変更・発注内容をLINE×GASで自動通知する方法', url: 'news/007-line-gyosha-gas.html' },
      first_3: { tag: 'おすすめコラム', title: '月8万円の削減！工務店がAI導入で最初にやるべき3つのこと', url: 'news/001-ai-cost-reduction.html' },
      all_76: { tag: '完全まとめ', title: '工務店のAI・GAS導入完全ガイド｜業務効率化76本まとめ【2026年版】', url: 'news/116-koumutenai-guide.html' },
      sns_beg: { tag: 'おすすめコラム', title: '工務店のHP・SNS更新をAIで自動化する方法｜3時間の作業を30分に短縮', url: 'news/056-sns-ai.html' },
      sns_auto: { tag: 'おすすめコラム', title: '工務店のSNS投稿ネタをGemini APIとGASで毎朝自動提案する方法', url: 'news/123-sns-gemini-gas.html' },
      tenken_auto: { tag: 'おすすめコラム', title: '工務店の定期点検スケジュール管理をGASで自動化する方法｜月2時間→自動化', url: 'news/099-tenken-gas.html' },
      after_all: { tag: '完全まとめ', title: '工務店のアフター対応業務をAI・GASで効率化する方法【完全まとめ】', url: 'news/113-after-matome.html' },
      ob_letter: { tag: 'おすすめコラム', title: '「売りっぱなし」と言わせない。AIで書く心のこもった手紙術', url: 'news/002-afterservice-letter.html' },
      ob_dm: { tag: 'おすすめコラム', title: '工務店のOB客向けDM・ニュースレターをAI・GASで自動化する方法｜月4時間→30分', url: 'news/027-ob-dm-gas.html' },
      analog_ceo: { tag: '対談記事', title: '【対談】アナログ一筋だった社長がDXに目覚めたきっかけ', url: 'news/039-analog-ceo-dx.html' },
      agent_basic: { tag: 'NEW・AIエージェント', title: '工務店のAIエージェント入門｜チャットAIとの違いと全体像', url: 'news/126-ai-agent-basics.html' },
      agent_gas: { tag: 'NEW・AIエージェント', title: 'AIエージェントで工務店のGAS自動化ツールを自作する手順', url: 'news/130-ai-agent-gas-automation.html' },
      agent_comp: { tag: 'NEW・徹底比較', title: 'Codex・Claude Code・Antigravity徹底比較｜工務店向け', url: 'news/132-ai-agent-comparison-koumuten.html' }
    };

    function savePrefillForContact() {
      try {
        var lines = ['【ご相談ガイドでのやり取り内容】'];
        if (state.topic) lines.push('・気になるテーマ：' + state.topic);
        if (state.detail) lines.push('・具体的なお悩み：' + state.detail);
        if (state.level) lines.push('・AIの活用状況：' + state.level);
        lines.push('', '上記の内容について、自社に合う進め方を相談したいです。');
        sessionStorage.setItem('bm_contact_prefill', JSON.stringify({
          sourceLabel: 'ご相談ガイド',
          categories: state.categories,
          message: lines.join('\n')
        }));
      } catch (err) {}
    }

    function addBotMessage(html, cards, cta, choices, showReset) {
      var row = document.createElement('div');
      row.className = 'bm-chat-row-bot';
      var bubble = document.createElement('div');
      bubble.className = 'bm-chat-bubble-bot';
      bubble.innerHTML = html;

      if (cards && cards.length) {
        cards.forEach(function (c) {
          var a = document.createElement('a');
          a.className = 'bm-chat-article-card';
          a.href = base + c.url;
          a.innerHTML =
            '<span class="bm-chat-article-tag">' + c.tag + '</span>' +
            '<span class="bm-chat-article-title">' + c.title + ' →</span>';
          bubble.appendChild(a);
        });
      }

      if (cta) {
        var link = document.createElement('a');
        link.className = 'bm-chat-cta-link';
        link.href = base + cta.url;
        link.textContent = cta.label;
        if (cta.prefill) {
          link.addEventListener('click', savePrefillForContact);
        }
        bubble.appendChild(link);
      }

      row.innerHTML = '<img src="' + avatarSrc + '" alt="木村" class="bm-chat-avatar">';
      row.appendChild(bubble);
      bodyEl.appendChild(row);

      if (choices && choices.length) {
        var cWrap = document.createElement('div');
        cWrap.className = 'bm-chat-choices';
        choices.forEach(function (ch) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'bm-chat-choice' + (ch.sub ? ' bm-chat-subchoice' : '');
          btn.innerHTML = '<span>' + ch.label + '</span><span>→</span>';
          btn.addEventListener('click', function () {
            onUserChoice(ch);
          });
          cWrap.appendChild(btn);
        });
        bodyEl.appendChild(cWrap);
      }

      if (showReset) {
        var rBtn = document.createElement('button');
        rBtn.type = 'button';
        rBtn.className = 'bm-chat-reset';
        rBtn.textContent = '↺ 最初の質問に戻る';
        rBtn.addEventListener('click', startChat);
        bodyEl.appendChild(rBtn);
      }

      bodyEl.scrollTop = bodyEl.scrollHeight;
    }

    function onUserChoice(ch) {
      bodyEl.querySelectorAll('.bm-chat-choices, .bm-chat-reset').forEach(function (el) { el.remove(); });

      if (ch.href) {
        if (ch.prefill) savePrefillForContact();
        window.location.href = base + ch.href;
        return;
      }

      var uRow = document.createElement('div');
      uRow.className = 'bm-chat-row-user';
      var uBub = document.createElement('div');
      uBub.className = 'bm-chat-bubble-user';
      uBub.textContent = ch.label;
      uRow.appendChild(uBub);
      bodyEl.appendChild(uRow);

      var typing = document.createElement('div');
      typing.className = 'bm-chat-row-bot';
      typing.innerHTML = '<img src="' + avatarSrc + '" alt="木村" class="bm-chat-avatar"><div class="bm-chat-bubble-bot"><div class="bm-chat-typing"><span></span><span></span><span></span></div></div>';
      bodyEl.appendChild(typing);
      bodyEl.scrollTop = bodyEl.scrollHeight;

      setTimeout(function () {
        typing.remove();
        ch.action();
      }, 280);
    }

    // ステップ3：AIの慣れ具合を聞いて、最適な実在コラム記事を案内
    function askLevel(detailKey, detailLabel, empathyText, catCode) {
      state.detail = detailLabel;
      if (catCode && state.categories.indexOf(catCode) === -1) state.categories.push(catCode);

      addBotMessage(
        empathyText + '<br>ちなみに今、<strong>ChatGPTなどのAIは普段どれくらい使っていますか？</strong>',
        null,
        null,
        [
          {
            label: 'まだほとんど触ったことがない',
            action: function () { showRecommendation(detailKey, 'beginner', 'まだほとんど触ったことがない'); }
          },
          {
            label: '少し試したが、仕事に活かしきれていない',
            action: function () { showRecommendation(detailKey, 'middle', '少し試したが、仕事に活かしきれていない'); }
          },
          {
            label: '使っているので、もっと自動化したい',
            action: function () { showRecommendation(detailKey, 'auto', '使っているので、もっと自動化したい'); }
          }
        ],
        true
      );
    }

    function showRecommendation(detailKey, levelKey, levelLabel) {
      state.level = levelLabel;
      var text = '';
      var cards = [];

      if (detailKey === 'nippo') {
        if (levelKey === 'beginner') {
          text = 'それなら難しい設定は不要です！<strong>スマホに向かって話すだけで日報が終わる方法</strong>をまとめていますので、まずこちらを読んでみてください。';
          cards = [articles.nippo_beg];
        } else {
          text = 'すでに触られているなら、<strong>日報や施工写真の自動整理</strong>まで一気に進めると毎月かなり楽になりますよ！こちらの実例が参考になります。';
          cards = [articles.nippo_auto, articles.shashin_auto];
        }
      } else if (detailKey === 'mitsumori') {
        if (levelKey === 'beginner') {
          text = 'まずは<strong>「見積書のミスをAIにチェックしてもらう」</strong>だけでも安心感が全然違いますよ。こちらの記事からどうぞ！';
          cards = [articles.mitsumori_beg];
        } else {
          text = '原価計算や見積作成は、<strong>AIとGoogleスプレッドシート（GAS）の組み合わせ</strong>が一番効くところです。手順を詳しくまとめています。';
          cards = [articles.mitsumori_auto];
        }
      } else if (detailKey === 'gyosha') {
        if (levelKey === 'beginner') {
          text = '職人さんや協力業者さんとのやり取りは、一気に変えず<strong>段階的にデジタル化するコツ</strong>があります。こちらの記事がぴったりです。';
          cards = [articles.gyosha_beg];
        } else {
          text = '工程変更や発注連絡は、<strong>LINE×GASで自動通知</strong>できると「言った言わない」も防げます。具体的な仕組みはこちらです！';
          cards = [articles.gyosha_auto];
        }
      } else if (detailKey === 'seiri') {
        if (levelKey === 'auto') {
          text = 'すでにAIを使われているなら、ファイル操作やGAS作成まで任せられる<strong>「AIエージェント」</strong>の活用が次のステップにぴったりです！';
          cards = [articles.agent_comp, articles.agent_gas];
        } else {
          text = '「何から手を付けるか」が一番迷いますよね。まずは<strong>効果が出やすい3つの業務</strong>か、AIエージェントの入門ガイドを眺めてみてください。';
          cards = [articles.first_3, articles.agent_basic];
        }
      } else if (detailKey === 'sns') {
        if (levelKey === 'auto') {
          text = 'ネタ出しから自動化するなら、<strong>毎朝AIが投稿ネタを提案してくれる仕組み</strong>が便利です！こちらに手順を載せています。';
          cards = [articles.sns_auto];
        } else {
          text = 'ブログやSNSは、ゼロから書かずに<strong>AIに8割の下書きを作ってもらう</strong>だけで3時間が30分になりますよ。まずこちらを読んでみてください。';
          cards = [articles.sns_beg];
        }
      } else if (detailKey === 'tenken') {
        text = '定期点検やアフター対応の漏れは、<strong>Googleの無料ツール（GAS）で自動リマインド</strong>するだけでゼロにできます！こちらが参考になります。';
        cards = [articles.tenken_auto, articles.after_all];
      } else if (detailKey === 'ob') {
        if (levelKey === 'beginner') {
          text = 'OB客への手紙やハガキは、<strong>「温かみを残したままAIで下書きする」</strong>と続けやすくなります。こちらの記事をどうぞ！';
          cards = [articles.ob_letter];
        } else {
          text = '毎月のDMやニュースレターも、AI×GASで仕組み化すると<strong>月4時間→30分</strong>まで縮まりますよ。';
          cards = [articles.ob_dm];
        }
      }

      addBotMessage(
        text,
        cards,
        null,
        [
          { label: '自社だと何時間浮くか試算してみる（30秒）', href: 'services.html#roi-simulator', sub: true },
          { label: '1分でできるAI活用度診断を試す', href: 'diagnosis.html', sub: true },
          { label: 'この内容をもとに木村へ無料相談する', href: 'contact.html', prefill: true, sub: true }
        ],
        true
      );
    }

    function startChat() {
      state = { topic: '', detail: '', level: '', categories: [] };
      bodyEl.innerHTML = '';
      addBotMessage(
        'こんにちは！BuildMate 代表の木村です。<br>今日はどんなことが気になって見に来てくれましたか？<br><span style="font-size:12.5px;color:#6B7280;">※選んだ内容に合うコラム記事や実例をご案内します</span>',
        null,
        null,
        [
          {
            label: '事務や現場記録の負担を減らしたい',
            action: function () {
              state.topic = '事務や現場記録の負担を減らしたい';
              addBotMessage(
                '現場の合間に事務をこなすのは本当に大変ですよね。<br>今いちばん時間が取られているのはどれに近いですか？',
                null,
                null,
                [
                  { label: '日報・施工写真の整理', action: function () { askLevel('nippo', '日報・施工写真の整理', '夕方、現場から戻って日報や写真を整理するのはしんどいですよね…。', 'efficiency'); } },
                  { label: '見積・原価・請求書づくり', action: function () { askLevel('mitsumori', '見積・原価・請求書づくり', '見積や原価チェックはミスも許されないので気を使いますよね。', 'efficiency'); } },
                  { label: '協力業者との連絡・FAX', action: function () { askLevel('gyosha', '協力業者との連絡・FAX', '業者さんへの連絡や手配の抜け漏れは現場に直結しますよね。', 'gas_automation'); } },
                  { label: 'まず何から始めるか整理したい', action: function () { askLevel('seiri', 'まず何から始めるか整理したい', '実は「どこから手をつければいいか分からない」という社長が一番多いんです。', 'other'); } }
                ],
                true
              );
            }
          },
          {
            label: '集客・OB客フォローを仕組み化したい',
            action: function () {
              state.topic = '集客・OB客フォローを仕組み化したい';
              addBotMessage(
                '目の前の現場が忙しいと、発信やOB客フォローはどうしても後回しになりますよね。<br>特に気になっているのはどれですか？',
                null,
                null,
                [
                  { label: 'ブログ・SNSのネタ切れ・更新', action: function () { askLevel('sns', 'ブログ・SNSのネタ切れ・更新', '「何を書けばいいか分からない」で止まってしまう工務店様は多いです。', 'marketing'); } },
                  { label: '定期点検・アフター管理の漏れ', action: function () { askLevel('tenken', '定期点検・アフター管理の漏れ', '引き渡し件数が増えるほど、点検時期の管理は手作業だと限界が来ますよね。', 'after_follow'); } },
                  { label: 'OB客への手紙・ニュースレター', action: function () { askLevel('ob', 'OB客への手紙・ニュースレター', '紹介受注を増やすにはOB客との接点が一番大事ですよね。', 'after_follow'); } }
                ],
                true
              );
            }
          },
          {
            label: 'AIに興味はあるが、うちでも使えるか不安',
            action: function () {
              state.topic = 'AIに興味はあるが、うちでも使えるか不安';
              addBotMessage(
                'そのお気持ち、すごくよく分かります！<br>特に気になっている不安はどれに近いですか？',
                null,
                null,
                [
                  {
                    label: 'パソコンやITが苦手でも大丈夫？',
                    action: function () {
                      state.detail = 'パソコンやITが苦手でも大丈夫か不安';
                      addBotMessage(
                        '大丈夫です！実は「パソコンが得意ではない」という工務店様が一番多いんです。<br>アナログ一筋だった社長がスマホから変わられた実例記事がありますので、まず気軽に読んでみてください。',
                        [articles.analog_ceo],
                        null,
                        [
                          { label: '初心者向け「AI活用入門」を見る', href: 'ai-guide.html', sub: true },
                          { label: '不安なことを木村に直接聞いてみる', href: 'contact.html', prefill: true, sub: true }
                        ],
                        true
                      );
                    }
                  },
                  {
                    label: '高額な専用ソフトが必要になる？',
                    action: function () {
                      state.detail = '高額な専用ソフトが必要か気になる';
                      state.categories.push('plan');
                      addBotMessage(
                        '高額な専用ソフトは使いません！<strong>無料〜月額3,000円ほどの汎用AI</strong>と、今お使いのGoogleツールだけで小さく始めるのがBuildMateの方針です。',
                        [articles.first_3],
                        null,
                        [
                          { label: 'サービス・費用の考え方を見る', href: 'services.html', sub: true },
                          { label: '自社でどれくらい時間が浮くか試算する', href: 'services.html#roi-simulator', sub: true }
                        ],
                        true
                      );
                    }
                  },
                  {
                    label: '従業員が少ない会社でも効果はある？',
                    action: function () {
                      state.detail = '少人数の会社でも効果があるか知りたい';
                      addBotMessage(
                        'むしろ<strong>1〜10名ほどの少人数工務店様こそ効果が大きい</strong>です！「事務員をもう1人雇うコスト」をかけずに社長の時間を戻せますよ。<br>まず30秒のシミュレーターで御社の人数を入れて試してみてください。',
                        null,
                        { label: '導入効果シミュレーターで試算する →', url: 'services.html#roi-simulator' },
                        [
                          { label: '1分AI活用度診断を試す', href: 'diagnosis.html', sub: true },
                          { label: '木村に30分だけ相談してみる', href: 'contact.html', prefill: true, sub: true }
                        ],
                        true
                      );
                    }
                  }
                ],
                true
              );
            }
          },
          {
            label: '進め方や費用の考え方を知りたい',
            action: function () {
              state.topic = '進め方や費用の考え方を知りたい';
              state.categories.push('plan');
              addBotMessage(
                'BuildMateでは、<strong>「スポット整理」「定着伴走」「社内研修」</strong>の3つの関わり方をご用意しています。<br>「1つの業務だけ」から始められますので、まずはサービス一覧や試算をご覧ください。',
                null,
                { label: 'サービス・費用の考え方を見る →', url: 'services.html' },
                [
                  { label: '自社だと何時間浮くか試算してみる', href: 'services.html#roi-simulator', sub: true },
                  { label: '無料相談で個別に相談してみる', href: 'contact.html', prefill: true, sub: true }
                ],
                true
              );
            }
          }
        ],
        false
      );
    }

    function togglePanel(open) {
      panel.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', String(open));
      if (open) {
        if (callout) callout.style.display = 'none';
        if (!bodyEl.innerHTML) startChat();
      }
    }

    trigger.addEventListener('click', function () {
      togglePanel(!panel.classList.contains('is-open'));
    });
    closeBtn.addEventListener('click', function () {
      togglePanel(false);
    });
    if (calloutClose) {
      calloutClose.addEventListener('click', function () {
        if (callout) callout.style.display = 'none';
        try { sessionStorage.setItem('bm_callout_closed', '1'); } catch (err) {}
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        togglePanel(false);
      }
    });
  }

  function initAll() {
    initReadProgress();
    initSimulator();
    initArticleCta();
    initChatGuide();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
