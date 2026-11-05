(function() {
  var game;
  var ui;

  var DateOptions = {hour: 'numeric',
                 minute: 'numeric',
                 second: 'numeric',
                 year: 'numeric',
                 month: 'short',
                 day: 'numeric' };

  var main = function(dendryUI) {
    ui = dendryUI;
    game = ui.game;
    // the engine has no hook after it fills the save slots
    var populate = ui.populateSaveSlots;
    ui.populateSaveSlots = function() {
        populate.apply(this, arguments);
        window.updateSaveButtons();
    };
  };

  var TITLE = "Social Democracy: An Alternate History" + '_' + "Autumn Chen";

  // ==================================================================== helpers
  var RG = window.RG = window.RG || {};

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

  var FACTION_IDS = ['luxemburgist', 'offensive', 'unionist', 'ultraleft'];
  var FACTION_FALLBACK = {luxemburgist: 'Spartacists', offensive: 'Left', unionist: 'Right', ultraleft: 'Left Radicals'};

  function Qs() {
    try {
      return window.dendryUI.dendryEngine.state.qualities || {};
    } catch (e) {
      return {};
    }
  }
  function num(Q, k) {
    var v = Q[k];
    return (typeof v === 'number' && !isNaN(v)) ? v : null;
  }
  function str(Q, k) {
    var v = Q[k];
    return (typeof v === 'string' && v.length) ? v : null;
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function factionName(Q, f) {
    return (Q.faction_names && Q.faction_names[f]) || FACTION_FALLBACK[f] || 'Unaligned';
  }
  function isFaction(f) { return FACTION_IDS.indexOf(f) >= 0; }
  function fdot(f) {
    return '<i class="fdot" style="--fc: var(--f-' + (isFaction(f) ? f : 'none') + ')"></i>';
  }
  function initials(name) {
    var parts = String(name).replace(/[^A-Za-zÀ-ž\s-]/g, '').split(/\s+/).filter(Boolean);
    if (!parts.length) { return '?'; }
    if (parts.length === 1) { return parts[0].slice(0, 2).toUpperCase(); }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  function meter(value, opts) {
    opts = opts || {};
    var v = clamp(value, 0, 100);
    var cls = 'meter' + (opts.tone ? ' tone-' + opts.tone : '');
    var style = opts.color ? ' style="--mc: ' + opts.color + '"' : '';
    if (opts.tone === 'tug') {
      var left = Math.min(v, 50), width = Math.abs(v - 50);
      return '<span class="' + cls + '" role="img" aria-label="' + Math.round(v) + ' of 100"><i class="' + (v < 50 ? 'neg' : '') + '" style="left:' + left + '%;width:' + width + '%"></i></span>';
    }
    return '<span class="' + cls + '"' + style + ' role="img" aria-label="' + Math.round(v) + ' of 100"><i style="width:' + v + '%"></i></span>';
  }
  function dateText(Q) {
    var m = num(Q, 'month'), y = num(Q, 'year');
    if (!m || !y) { return 'January 1919'; }
    return MONTHS[(m - 1 + 12) % 12] + ' ' + y;
  }
  function inGame(Q) { return num(Q, 'started') === 1; }

  // ==================================================================== language (kept for mods)
  window.loadMod = function(url) {
      ui.loadGame(url);
  };

  var LABELS_EN = {
      'main_tab': "Party", 'factions_tab': "Factions", 'districts_tab': "Districts", 'map_tab': "Map",
      'germany_tab': "Germany", 'moscow_tab': "Moscow", 'parties_tab': "Parties", 'forces_tab': "Forces",
      'comrades_tab': "Comrades", 'crisis_tab': "Crisis", 'congress_tab': "Congress",
      'stats-link': "Library", 'save-link': "Save/Load", 'options-link': "Options"
  };
  var LABELS_DE = {
      'main_tab': "Partei", 'factions_tab': "Strömungen", 'districts_tab': "Bezirke", 'map_tab': "Karte",
      'germany_tab': "Deutschland", 'moscow_tab': "Moskau", 'parties_tab': "Parteien", 'forces_tab': "Kräfte",
      'comrades_tab': "Genossen", 'crisis_tab': "Krise", 'congress_tab': "Parteitag",
      'stats-link': "Bibliothek", 'save-link': "Speichern/Laden", 'options-link': "Einstellungen"
  };
  function applyLabels(map) {
      for (var elementId in map) {
          var el = document.getElementById(elementId);
          if (el) { el.textContent = map[elementId]; }
      }
  }
  window.loadGerman = function() {
      ui.loadGame('game-de.json');
      dendryUI.language = "de";
      localStorage[game.title + '_language'] = "de";
      applyLabels(LABELS_DE);
  };
  window.loadEnglish = function() {
      ui.loadGame('game.json');
      dendryUI.language = "en";
      localStorage[game.title + '_language'] = "en";
      applyLabels(LABELS_EN);
  };

  // ==================================================================== save/load
  window.updateSaveButtons = function() {
      var de = window.dendryUI.language && window.dendryUI.language == "de";
      for (var element of document.getElementsByClassName("save_button")) {
          if (de) {
              if (element.textContent == "Save") { element.textContent = "Speichern"; }
              else if (element.textContent == "Load") { element.textContent = "Laden"; }
          } else {
              if (element.textContent == "Speichern") { element.textContent = "Save"; }
              else if (element.textContent == "Laden") { element.textContent = "Load"; }
          }
      }
      // name the scene in the slot's description by its date, when we can
      for (var info of document.getElementsByClassName("save_info")) {
          info.textContent = info.textContent.replace(/^root\S*/, 'Title page').replace(/^(?!Empty|Title page)[a-z0-9_.]+(?=\n|$)/i, 'In play');
      }
  };
  window.onSave = function() { window.updateSaveButtons(); };
  window.onPopulateSaveSlots = function() { window.updateSaveButtons(); };

  // ==================================================================== library
  window.showStats = function() {
      var lib = document.getElementById('library');
      document.getElementById('library_body').innerHTML = libraryHTML();
      lib.style.display = 'block';
      if (!lib.onclick) {
          lib.onclick = function(evt) { if (evt.target == lib) { window.hideLibrary(); } };
      }
  };
  window.hideLibrary = function() {
      document.getElementById('library').style.display = 'none';
  };
  function libraryHTML() {
      var Q = Qs();
      var h = [];
      h.push('<section><h4>A month in the Zentrale</h4>' +
        '<p>Each month, draw from the piles and play one card from your hand. Then the month\'s events arrive. ' +
        'Advisers can act every few months; their dossiers sit below your hand.</p>' +
        '<p>In a great crisis the clock slows to weeks: only crisis cards can be drawn, and each card is one week.</p></section>');
      h.push('<section><h4>The four currents</h4>');
      var desc = {
        luxemburgist: 'Luxemburg, Jogiches, Levi, Zetkin. A mass party, democracy inside the party, independence from Moscow.',
        offensive: 'Later led by Ruth Fischer and Arkadi Maslow. Armed action soon: the theory of the offensive.',
        unionist: 'Later led by Heinrich Brandler and August Thalheimer. Union work and the united front with the SPD and USPD.',
        ultraleft: 'The Bremen and Hamburg radicals, later the KAPD. Boycott parliament and the unions: councils only.'
      };
      FACTION_IDS.forEach(function(f) {
        h.push('<p>' + fdot(f) + '<b>' + esc(factionName(Q, f)) + '</b>. ' + desc[f] + '</p>');
      });
      h.push('</section>');
      h.push('<section><h4>The party line</h4>' +
        '<p>The current that holds the Zentrale sets the line. Some actions are <span class="lock-0" data-lock>open</span>, ' +
        'some are <span class="lock-1" data-lock>against the line</span> and cost Unity, and some are ' +
        '<span class="lock-2" data-lock>forbidden</span>.</p></section>');
      h.push('<section><h4>Reading the map</h4>' +
        '<p>Each district is coloured by the current that runs it. The stronger the colour, the more loyal the district is to the Zentrale.</p>' +
        '<ul><li>A red flag: the district is on strike.</li><li>A red disc: armed red guards, with their number.</li>' +
        '<li>Black bars: heavy repression.</li><li>A star in a dashed ring: a red republic holds the district.</li></ul></section>');
      var ledger = Array.isArray(Q.ledger) ? Q.ledger.filter(function(x) { return typeof x === 'string' && x; }) : [];
      if (ledger.length) {
        h.push('<section><h4>The party\'s record</h4><ul>' + ledger.map(function(x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>');
      }
      h.push('<section><h4>About</h4><p>Red Germany: 1919–1923 is a total conversion by Maarten of <em>Social Democracy: An Alternate History</em> by Autumn Chen, made with Dendry.</p></section>');
      return h.join('');
  }

  window.showMods = function() {
    window.hideOptions();
    if (window.dendryUI.dendryEngine.state.sceneId.startsWith('mod_loader')) {
        window.dendryUI.dendryEngine.goToScene('backSpecialScene');
    } else {
        window.dendryUI.dendryEngine.goToScene('mod_loader');
    }
  };

  // ==================================================================== audio (the engine still calls these)
  window.updateAudio = function(song) {
      var now_playing = document.getElementById('currently_playing');
      if (!now_playing) { return; }
      var s = song || window.dendryUI.currentAudioURL || '';
      var a = s.split('/');
      now_playing.textContent = a[a.length - 1];
  };
  window.setVolume = function(volume) {
      if (window.dendryUI.currentAudio) {
          window.dendryUI.volume = volume / 100;
          window.dendryUI.currentAudio.volume = volume / 100;
      }
  };
  window.shuffle = function() {
      if (window.dendryUI.currentAudio) {
          window.dendryUI.currentAudio.currentTime = 9999;
      }
  };
  window.togglePausePlay = function() {
      var audio = window.dendryUI.currentAudio;
      if (!audio) { return; }
      if (audio.paused) {
        audio.play();
        document.getElementById('pause-button-text').textContent = "Pause";
      } else {
        audio.pause();
        document.getElementById('pause-button-text').textContent = "Play";
      }
  };

  // ==================================================================== options
  window.showOptions = function() {
      var el = document.getElementById('options');
      window.populateOptions();
      el.style.display = "block";
      if (!el.onclick) {
          el.onclick = function(evt) {
              if (evt.target == el) { window.hideOptions(); }
          };
      }
  };
  window.hideOptions = function() {
      document.getElementById('options').style.display = "none";
  };
  document.addEventListener('keydown', function(evt) {
      if (evt.key === 'Escape') {
          window.hideOptions();
          window.hideLibrary();
          if (window.dendryUI) { window.dendryUI.hideSaveSlots(); }
      }
  });

  window.disableBg = function() {
      window.dendryUI.disable_bg = true;
      document.body.style.backgroundImage = 'none';
      window.dendryUI.saveSettings();
  };
  window.enableBg = function() {
      window.dendryUI.disable_bg = false;
      window.dendryUI.setBg(window.dendryUI.dendryEngine.state.bg);
      window.dendryUI.saveSettings();
  };
  window.disableAnimate = function() { window.dendryUI.animate = false; window.dendryUI.saveSettings(); };
  window.enableAnimate = function() { window.dendryUI.animate = true; window.dendryUI.saveSettings(); };
  window.disableAnimateBg = function() { window.dendryUI.animate_bg = false; window.dendryUI.saveSettings(); };
  window.enableAnimateBg = function() { window.dendryUI.animate_bg = true; window.dendryUI.saveSettings(); };
  window.disableAudio = function() { window.dendryUI.toggle_audio(false); window.dendryUI.saveSettings(); };
  window.enableAudio = function() { window.dendryUI.toggle_audio(true); window.dendryUI.saveSettings(); };
  window.enableImages = function() { window.dendryUI.show_portraits = true; window.dendryUI.saveSettings(); };
  window.disableImages = function() { window.dendryUI.show_portraits = false; window.dendryUI.saveSettings(); };

  // The engine does not store the colour scheme or the text size, so we do.
  function store(key, value) {
      try { localStorage['rg_' + key] = value; } catch (e) {}
  }
  function stored(key) {
      try { return localStorage['rg_' + key]; } catch (e) { return undefined; }
  }
  function setDark(dark) {
      window.dendryUI.dark_mode = dark;
      document.body.classList.toggle('dark-mode', dark);
      document.documentElement.classList.toggle('dark-pre', dark);
      store('dark_mode', dark ? 'true' : 'false');
      window.updateSidebar();
  }
  window.enableLightMode = function() { setDark(false); };
  window.enableDarkMode = function() { setDark(true); };

  window.populateOptions = function() {
    var d = window.dendryUI;
    var check = function(id) { var el = document.getElementById(id); if (el) { el.checked = true; } };
    check(d.disable_bg ? 'backgrounds_no' : 'backgrounds_yes');
    check(d.animate ? 'animate_yes' : 'animate_no');
    check(d.disable_audio ? 'audio_no' : 'audio_yes');
    check(d.show_portraits ? 'images_yes' : 'images_no');
    check(d.dark_mode ? 'dark_mode' : 'light_mode');
    check(d.language == "de" ? 'german' : 'english');
    showFontSize();
  };

  // text size: a scale factor on the content and the sidebar
  var FONT_MIN = 0.85, FONT_MAX = 1.4;
  function applyFontSize() {
      var fs = window.dendryUI.font_size;
      document.body.style.setProperty('--fs', fs.toFixed(2));
      showFontSize();
  }
  function showFontSize() {
      var el = document.getElementById('font_size_value');
      var fs = (window.dendryUI && typeof window.dendryUI.font_size === 'number') ? window.dendryUI.font_size : 1;
      if (el) { el.textContent = Math.round(fs * 100) + '%'; }
  }
  function changeFontSize(delta) {
      var fs = (typeof window.dendryUI.font_size === 'number') ? window.dendryUI.font_size : 1;
      fs = clamp(Math.round((fs + delta) * 100) / 100, FONT_MIN, FONT_MAX);
      window.dendryUI.font_size = fs;
      store('font_size', fs);
      applyFontSize();
  }
  window.increaseFontSize = function() { changeFontSize(0.05); };
  window.decreaseFontSize = function() { changeFontSize(-0.05); };

  // ==================================================================== text hooks
  window.displayText = function(text) {
      return text;
  };
  window.handleSignal = function(signal, event, scene_id) {
  };
  window.onNewPage = function() {
    var scene = window.dendryUI.dendryEngine.state.sceneId;
    if (scene != 'root' && !window.justLoaded) {
        window.dendryUI.autosave();
    }
    if (window.justLoaded) {
        window.justLoaded = false;
    }
  };

  // ==================================================================== body state, masthead
  function updateBodyState(Q) {
      var b = document.body.classList;
      b.toggle('crisis-mode', !!Q.crisis);
      b.toggle('congress-mode', !!Q.congress);
      b.toggle('at-title', !inGame(Q));
  }

  function partyLine(Q) {
      var p = str(Q, 'party_name') || 'KPD';
      var y = num(Q, 'year') || 1919;
      if (p === 'KPD' && y <= 1920) { return 'Central organ of the KPD (Spartacus League)'; }
      if (p === 'VKPD') { return 'Central organ of the United Communist Party, VKPD'; }
      if (num(Q, 'comintern_member') === 1) { return 'Central organ of the ' + p + ', section of the Communist International'; }
      return 'Central organ of the ' + p;
  }

  function updateMasthead(Q) {
      var date = document.getElementById('mh-date');
      var party = document.getElementById('mh-party');
      var issue = document.getElementById('mh-issue');
      var zen = document.getElementById('mh-zentrale');
      if (!date) { return; }
      if (!inGame(Q)) {
          date.textContent = 'Berlin, January 1919';
          party.innerHTML = '<span class="pl-long">Central organ of the KPD (Spartacus League)</span><span class="pl-short">KPD</span>';
          issue.previousElementSibling.textContent = 'Founded';
          issue.textContent = '30 Dec 1918';
          zen.innerHTML = fdot('luxemburgist') + 'Spartacists';
          return;
      }
      var place = num(Q, 'kpd_banned') === 1 ? 'Printed illegally' : 'Berlin';
      var html = esc(place) + ', ' + esc(dateText(Q));
      if (Q.crisis && num(Q, 'week')) { html += ' <span class="week">· Week ' + num(Q, 'week') + '</span>'; }
      date.innerHTML = html;
      party.innerHTML = '<span class="pl-long">' + esc(partyLine(Q)) + '</span><span class="pl-short">' + esc(str(Q, 'party_name') || 'KPD') + '</span>';
      issue.previousElementSibling.textContent = 'Issue';
      issue.textContent = 'No. ' + (num(Q, 'time') || 1);
      var lead = Q.leading_faction;
      zen.innerHTML = isFaction(lead) ? fdot(lead) + esc(factionName(Q, lead)) : 'Vacant';
  }

  function updateCongressBar(Q) {
      var bar = document.getElementById('congress-bar');
      if (!bar) { return; }
      if (!Q.congress) { bar.innerHTML = ''; return; }
      var name = str(Q, 'congress_name') || 'Party congress';
      var sess = num(Q, 'congress_session');
      var stake = str(Q, 'congress_stake');
      bar.innerHTML = '<div class="cb-head"><span class="cb-name">' + esc(name) + '</span>' +
        (sess ? '<span class="cb-session">Session ' + sess + '</span>' : '') + '</div>' +
        (stake ? '<div class="cb-stake">' + esc(stake) + '</div>' : '') + delegatesHTML(Q);
  }

  function delegatesHTML(Q) {
      var segs = [], total = 0;
      FACTION_IDS.forEach(function(f) {
          var n = num(Q, 'congress_delegates_' + f);
          if (n !== null && n > 0) { segs.push([f, n]); total += n; }
      });
      if (!total) { return '<div class="ui-empty">The delegates are still being counted.</div>'; }
      var h = '<div class="delegates"><div class="del-bar" role="img" aria-label="Delegates by current">';
      segs.forEach(function(s) {
          var pct = 100 * s[1] / total;
          h += '<span class="del-seg" style="width:' + pct.toFixed(2) + '%; --f: var(--f-' + s[0] + ')">' + (pct >= 9 ? Math.round(s[1]) : '') + '</span>';
      });
      h += '<span class="del-half" title="Majority"></span></div><div class="del-legend">';
      segs.forEach(function(s) {
          h += '<span>' + fdot(s[0]) + esc(factionName(Q, s[0])) + ' <b>' + Math.round(s[1]) + '</b></span>';
      });
      h += '<span>Majority <b>' + (Math.floor(total / 2) + 1) + '</b> of ' + Math.round(total) + '</span></div></div>';
      return h;
  }

  // ==================================================================== sidebar
  window.updateSidebar = function() {
      var Q = Qs();
      updateBodyState(Q);
      updateMasthead(Q);
      updateCongressBar(Q);
      updateAlertTabs(Q);
      $('#qualities').empty();
      var scene = dendryUI.game.scenes[window.statusTab];
      if (!scene) {
          window.statusTab = 'status';
          scene = dendryUI.game.scenes.status;
      }
      dendryUI.dendryEngine._runActions(scene.onArrival);
      var displayContent = dendryUI.dendryEngine._makeDisplayContent(scene.content, true);
      $('#qualities').append(dendryUI.contentToHTML.convert(displayContent));
      decorateSidebar(Q);
      updateSummary(Q);
  };

  function updateAlertTabs(Q) {
      var crisisTab = document.getElementById('crisis_tab');
      var congressTab = document.getElementById('congress_tab');
      var inCrisis = !!Q.crisis, inCongress = !!Q.congress;
      if (crisisTab) {
          crisisTab.style.display = inCrisis ? '' : 'none';
          if (inCrisis) {
              var cn = str(Q, 'crisis_name');
              crisisTab.innerHTML = 'Crisis' + (cn ? '<span class="tab-sub">' + esc(cn) + '</span>' : '');
          }
      }
      if (congressTab) {
          congressTab.style.display = inCongress ? '' : 'none';
          if (inCongress) {
              var gn = str(Q, 'congress_name');
              congressTab.innerHTML = 'Congress' + (gn ? '<span class="tab-sub">' + esc(gn) + '</span>' : '');
          }
      }
      if ((!inCrisis && window.statusTab == 'status.crisis') || (!inCongress && window.statusTab == 'status.congress')) {
          setActiveTab('main_tab');
          window.statusTab = 'status';
      }
  }

  function setActiveTab(tabId) {
      var tabButtons = document.getElementsByClassName('tab_button');
      for (var i = 0; i < tabButtons.length; i++) {
          tabButtons[i].classList.remove('active');
          tabButtons[i].removeAttribute('aria-current');
      }
      var tabButton = document.getElementById(tabId);
      if (tabButton) {
          tabButton.classList.add('active');
          tabButton.setAttribute('aria-current', 'page');
      }
  }

  window.changeTab = function(newTab, tabId) {
      if (tabId == 'poll_tab' && dendryUI.dendryEngine.state.qualities.historical_mode) {
          window.alert('Polls are not available in historical mode.');
          return;
      }
      setActiveTab(tabId);
      window.statusTab = newTab;
      window.updateSidebar();
  };

  function decorateSidebar(Q) {
      var root = document.getElementById('qualities');
      // meters
      root.querySelectorAll('[data-bar]').forEach(function(el) {
          var v = num(Q, el.getAttribute('data-bar'));
          if (v === null) { return; }
          var opts = {tone: el.getAttribute('data-bar-tone')};
          var f = el.getAttribute('data-bar-fid');
          var p = el.getAttribute('data-bar-party');
          if (f) { opts.color = 'var(--f-' + f + ')'; }
          if (p) { opts.color = 'var(--p-' + p + ')'; }
          var host = el.parentNode;
          host.insertAdjacentHTML('beforeend', meter(v, opts));
          if (opts.tone === 'tug') {
              host.insertAdjacentHTML('beforeend', '<span class="tug-cap"><span>Reaction</span><span>Revolution</span></span>');
          }
      });
      // locks
      root.querySelectorAll('[data-lock]').forEach(function(el) {
          var v = num(Q, el.getAttribute('data-lock'));
          el.classList.add('lock-' + (v === null ? 0 : clamp(Math.round(v), 0, 2)));
      });
      // faction dots
      root.querySelectorAll('[data-fq]').forEach(function(el) {
          var f = Q[el.getAttribute('data-fq')];
          if (isFaction(f)) { el.insertAdjacentHTML('afterbegin', fdot(f)); }
      });
      root.querySelectorAll('[data-fid]').forEach(function(el) {
          el.insertAdjacentHTML('afterbegin', fdot(el.getAttribute('data-fid')));
      });
      // funds as coins
      root.querySelectorAll('[data-pips]').forEach(function(el) {
          var v = num(Q, el.getAttribute('data-pips'));
          if (v === null || v <= 0 || v > 12) { return; }
          var pips = '<span class="pips" aria-hidden="true">' + new Array(Math.round(v) + 1).join('<i></i>') + '</span>';
          el.insertAdjacentHTML('afterbegin', pips);
      });
      // drawn blocks
      root.querySelectorAll('[data-ui]').forEach(function(el) {
          var fn = BLOCKS[el.getAttribute('data-ui')];
          if (!fn) { return; }
          try {
              fn(el, Q);
          } catch (e) {
              console.error('sidebar block ' + el.getAttribute('data-ui'), e);
              el.innerHTML = '';
          }
      });
  }

  function updateSummary(Q) {
      var el = document.getElementById('files-summary');
      if (!el || !inGame(Q)) { return; }
      var bits = [];
      bits.push(str(Q, 'party_name') || 'KPD');
      if (num(Q, 'resources') !== null) { bits.push(num(Q, 'resources') + ' funds'); }
      if (str(Q, 'members_display')) { bits.push(Q.members_display + 'k members'); }
      if (num(Q, 'unity') !== null) { bits.push('unity ' + Math.round(Q.unity)); }
      el.textContent = bits.join(' · ');
  }

  window.toggleFiles = function(force) {
      var sb = document.getElementById('stats_sidebar');
      var collapsed = typeof force === 'boolean' ? !force : !sb.classList.contains('collapsed');
      sb.classList.toggle('collapsed', collapsed);
      document.getElementById('files-toggle').setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      if (typeof force !== 'boolean') { store('files_open', collapsed ? 'false' : 'true'); }
  };

  // -------------------------------------------------------------------- sidebar blocks
  var selectedDistrict = 'berlin';
  var BLOCKS = {};

  BLOCKS['faction-stack'] = function(el, Q) {
      var parts = FACTION_IDS.map(function(f) { return [f, num(Q, f + '_strength') || 0]; })
        .filter(function(p) { return p[1] > 0.5; });
      if (!parts.length) { return; }
      var h = '<div class="fstack" role="img" aria-label="Share of members by current">';
      parts.forEach(function(p) {
          h += '<span style="width:' + p[1].toFixed(1) + '%; --fc: var(--f-' + p[0] + ')" title="' + esc(factionName(Q, p[0])) + ': ' + Math.round(p[1]) + '%"></span>';
      });
      h += '</div><div class="fstack-cap"><span class="mini-label">Share of members</span>';
      if (isFaction(Q.leading_faction)) {
          h += '<span class="mini-label">Zentrale: ' + esc(factionName(Q, Q.leading_faction)) + '</span>';
      }
      el.innerHTML = h + '</div>';
  };

  BLOCKS.districts = function(el, Q) {
      var h = '<ul class="dlist">';
      RG.DISTRICTS.forEach(function(d) {
          var info = RG.districtInfo(Q, d);
          h += '<li data-district="' + d + '" title="Show on the map">';
          h += '<span class="d-name">' + esc(info.name) + '</span>';
          h += '<span class="d-mem">' + (info.members !== null ? info.members.toFixed(1) + 'k' : '') + '</span>';
          h += '<span class="d-fac">' + fdot(info.faction) + esc(info.factionName) + '</span>';
          h += '<span class="d-loy">' + (info.loyalty !== null ? 'loyalty ' + Math.round(info.loyalty) : '') + '</span>';
          if (info.loyalty !== null) { h += meter(info.loyalty, {color: 'var(--f-' + (info.faction || 'none') + ')'}); }
          var marks = districtMarks(info);
          if (marks) { h += '<span class="d-marks">' + marks + '</span>'; }
          h += '</li>';
      });
      el.innerHTML = h + '</ul><div class="map-hint">Bars show loyalty to the Zentrale. Select a district to see it on the map.</div>';
      el.querySelectorAll('li[data-district]').forEach(function(li) {
          li.addEventListener('click', function() {
              selectedDistrict = li.getAttribute('data-district');
              window.changeTab('status.map', 'map_tab');
          });
      });
  };

  function districtMarks(info) {
      var m = '';
      if (info.republic) { m += '<span class="mark mark-soviet">' + RG.icon('star') + 'Red republic</span>'; }
      if (info.strike === 1) { m += '<span class="mark mark-strike">' + RG.icon('flag') + 'On strike</span>'; }
      if (info.guards !== null && info.guards > 0) { m += '<span class="mark mark-guards">Red guards ' + Math.round(info.guards) + '</span>'; }
      if (info.repression !== null && info.repression >= 50) { m += '<span class="mark mark-repr">Repression</span>'; }
      return m;
  }

  function levelWord(v) {
      if (v < 10) { return 'very low'; }
      if (v < 30) { return 'low'; }
      if (v < 60) { return 'medium'; }
      if (v < 85) { return 'high'; }
      return 'very high';
  }

  BLOCKS.map = function(el, Q) {
      var h = '<div class="map-wrap">' + RG.mapSVG(Q, {selected: selectedDistrict}) + '</div>';
      h += '<div class="map-legend">';
      FACTION_IDS.forEach(function(f) {
          if (num(Q, f + '_gone') === 1) { return; }
          h += '<span>' + fdot(f) + esc(factionName(Q, f)) + '</span>';
      });
      h += '<span><i class="shade"></i>Loyalty</span>';
      h += '<span><span style="color: var(--red); display: inline-flex; width: 13px">' + RG.icon('flag') + '</span>Strike</span>';
      h += '<span><svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="var(--red)"/></svg>Red guards</span>';
      h += '<span><span style="color: var(--ink); display: inline-flex; width: 13px">' + RG.icon('bars') + '</span>Repression</span>';
      h += '<span><svg viewBox="0 0 14 14"><polygon points="' + RG.starPoints(7, 7.4, 6.5, 2.6) + '" fill="var(--red)"/></svg>Red republic</span>';
      h += '</div><div class="map-detail" id="map-detail"></div>';
      el.innerHTML = h;
      var showDetail = function(d) {
          selectedDistrict = d;
          el.querySelectorAll('.hex-g').forEach(function(g) { g.classList.toggle('sel', g.getAttribute('data-district') === d); });
          var info = RG.districtInfo(Q, d);
          var box = el.querySelector('#map-detail');
          box.style.setProperty('--fc', 'var(--f-' + (info.faction || 'none') + ')');
          var dl = '<dt>Current</dt><dd>' + fdot(info.faction) + esc(info.factionName) + '</dd>';
          if (info.members !== null) { dl += '<dt>Members</dt><dd>' + info.members.toFixed(1) + ' thousand</dd>'; }
          if (info.loyalty !== null) { dl += '<dt>Loyalty</dt><dd>' + levelWord(info.loyalty) + '</dd>'; }
          if (info.militancy !== null) { dl += '<dt>Militancy</dt><dd>' + levelWord(info.militancy) + '</dd>'; }
          if (info.guards !== null) { dl += '<dt>Red guards</dt><dd>' + (info.guards > 0 ? Math.round(info.guards) + ' units' : 'none') + '</dd>'; }
          if (info.repression !== null) { dl += '<dt>Repression</dt><dd>' + levelWord(info.repression) + '</dd>'; }
          if (info.strike !== null) { dl += '<dt>Strike</dt><dd>' + (info.strike === 1 ? 'the district is out' : 'no') + '</dd>'; }
          var h2 = '<h3>' + esc(info.name) + '</h3>';
          if (info.republic) { h2 += '<div class="d-marks"><span class="mark mark-soviet">' + RG.icon('star') + esc(info.republic) + '</span></div>'; }
          h2 += '<dl>' + dl + '</dl>';
          if (info.loyalty !== null) { h2 += meter(info.loyalty, {color: 'var(--f-' + (info.faction || 'none') + ')'}); }
          box.innerHTML = h2;
      };
      el.querySelectorAll('.hex-g').forEach(function(g) {
          var d = g.getAttribute('data-district');
          g.addEventListener('click', function() { showDetail(d); });
          g.addEventListener('keydown', function(e) {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showDetail(d); }
          });
      });
      showDetail(selectedDistrict);
  };

  var PARTY_ORDER = ['kpd', 'kapd', 'uspd', 'spd', 'ddp', 'zentrum', 'bvp', 'dvp', 'dnvp', 'nsdap'];
  BLOCKS.hemicycle = function(el, Q) {
      var pname = str(Q, 'parliament_name');
      var size = num(Q, 'parliament_size');
      if (!pname || !size) {
          el.innerHTML = '<div class="ui-empty">No parliament has been elected yet.</div>';
          return;
      }
      var names = Q.party_names || {};
      var data = [], counted = 0;
      PARTY_ORDER.forEach(function(p) {
          var seats = num(Q, p + '_seats');
          if (seats !== null && seats > 0) {
              data.push({id: p, legend: p === 'kpd' ? (str(Q, 'party_name') || 'KPD') : (names[p] || p.toUpperCase()), seats: Math.round(seats),
                color: 'var(--p-' + p + ')', gov: num(Q, p + '_in_government') === 1});
              counted += Math.round(seats);
          }
      });
      if (size > counted) {
          data.push({id: 'other', legend: 'Others', seats: Math.round(size - counted), color: 'var(--p-other)', gov: false});
      }
      var W = 300;
      var h = '<div class="hemi-wrap"><svg class="hemi-svg" viewBox="0 0 ' + W + ' ' + (W / 2 + 4) + '" role="img" aria-label="' + esc(pname) + ' seats"></svg></div>';
      h += '<div class="hemi-legend">';
      data.forEach(function(p) {
          h += '<span class="' + (p.id === 'kpd' ? 'is-kpd' : '') + '"><i class="pdot" style="--pc:' + p.color + '"></i><span class="hemi-name' + (p.gov ? ' in-gov' : '') + '">' + esc(p.legend) + '</span><b>' + p.seats + '</b></span>';
      });
      h += '</div>';
      el.innerHTML = h;
      var svg = el.querySelector('svg');
      if (typeof d3 !== 'undefined' && d3.parliament && data.length) {
          var parl = d3.parliament().width(W).innerRadiusCoef(0.42);
          parl.enter.fromCenter(false);
          parl.enter.smallToBig(false);
          parl.update.animate(false);
          d3.select(svg).datum(data).call(parl);
      }
      svg.insertAdjacentHTML('beforeend',
        '<text class="hemi-num" x="' + W / 2 + '" y="' + (W / 2 - 14) + '">' + Math.round(size) + '</text>' +
        '<text class="hemi-cap" x="' + W / 2 + '" y="' + (W / 2 - 1) + '">' + esc(pname) + '</text>');
  };

  var ECCI = [
      ['lenin', 'Lenin', 'Chairman of Sovnarkom'],
      ['zinoviev', 'Zinoviev', 'President of the Executive'],
      ['radek', 'Radek', 'Secretary for German affairs'],
      ['trotsky', 'Trotsky', 'People\'s Commissar for War'],
      ['bukharin', 'Bukharin', 'Editor of Pravda']
  ];
  BLOCKS.ecci = function(el, Q) {
      var rows = ECCI.filter(function(p) { return num(Q, 'ecci_' + p[0]) !== null; });
      if (!rows.length) { return; }
      var fav = num(Q, 'moscow_favour');
      var h = '<div class="ecci"><div class="ecci-head"><span class="mini-label">The Executive\'s favour</span>' +
        (fav !== null ? '<span class="ecci-fav">' + Math.round(fav) + '<small>/100</small></span>' : '') + '</div>';
      var t = (num(Q, 'year') || 1919) * 12 + (num(Q, 'month') || 1);
      rows.forEach(function(p) {
          var v = num(Q, 'ecci_' + p[0]);
          var role = p[2];
          var faded = false;
          if (p[0] === 'lenin' && t >= 1922 * 12 + 6) { role = 'Ill since the spring of 1922'; faded = true; }
          h += '<div class="ecci-row' + (faded ? ' faded' : '') + '"><span class="mono">' + esc(p[1].charAt(0)) + '</span>' +
            '<span><span class="ecci-name">' + esc(p[1]) + '<small>' + esc(role) + '</small></span>' + meter(v, {}) + '</span>' +
            '<span class="ecci-val">' + Math.round(v) + '</span></div>';
      });
      el.innerHTML = h + '</div>';
  };

  BLOCKS.directive = function(el, Q) {
      if (!Q.directive_active) { return; }
      var text = str(Q, 'directive_text') || 'Instructions from the Executive.';
      var due = num(Q, 'directive_deadline');
      var h = '<div class="directive"><div class="directive-head"><span>Directive</span><span>ECCI · Moscow</span></div>' +
        '<div class="directive-text">' + esc(text) + '</div>';
      if (due !== null) {
          h += '<span class="directive-due' + (due <= 1 ? ' urgent' : '') + '">' +
            (due <= 0 ? 'Due now' : 'Due in ' + due + (due === 1 ? ' month' : ' months')) + '</span>';
      }
      el.innerHTML = h + '</div>';
  };

  // the leading comrades, when the roster is not kept by the game yet
  var COMRADES_FALLBACK = [
      ['luxemburg', 'Rosa Luxemburg', 'luxemburgist', 'Theorist, Die Rote Fahne'],
      ['liebknecht', 'Karl Liebknecht', 'luxemburgist', 'Agitator'],
      ['jogiches', 'Leo Jogiches', 'luxemburgist', 'Organiser'],
      ['levi', 'Paul Levi', 'luxemburgist', 'Lawyer, Zentrale'],
      ['zetkin', 'Clara Zetkin', 'luxemburgist', 'Women\'s movement'],
      ['pieck', 'Wilhelm Pieck', 'luxemburgist', 'Organiser'],
      ['brandler', 'Heinrich Brandler', 'unionist', 'Chemnitz trade unionist'],
      ['thalheimer', 'August Thalheimer', 'unionist', 'Theorist'],
      ['fischer', 'Ruth Fischer', 'offensive', 'Berlin Left'],
      ['maslow', 'Arkadi Maslow', 'offensive', 'Berlin Left'],
      ['thalmann', 'Ernst Thälmann', 'offensive', 'Hamburg Left'],
      ['radek', 'Karl Radek', null, 'Comintern envoy']
  ];
  function fallbackComrades(Q) {
      var t = num(Q, 'time') || 1;
      var out = [];
      var alive = function(k) { var v = num(Q, k); return v === null ? true : v === 1; };
      COMRADES_FALLBACK.forEach(function(c) {
          var id = c[0], status = 'free', show = true;
          if (id === 'luxemburg') { status = alive('luxemburg_alive') ? 'free' : 'dead'; }
          if (id === 'liebknecht') { status = alive('liebknecht_alive') ? 'free' : 'dead'; }
          if (id === 'jogiches') { status = alive('jogiches_alive') ? 'free' : 'dead'; }
          if (id === 'levi') {
              if (num(Q, 'levi_split') === 1 || num(Q, 'levi_in_party') === 0) { status = 'expelled'; }
          }
          if (id === 'brandler' || id === 'thalheimer') { show = t >= 13 && num(Q, 'unionist_gone') !== 1; }
          if (id === 'fischer' || id === 'maslow' || id === 'thalmann') { show = t >= 25 && num(Q, 'offensive_gone') !== 1; }
          if (id === 'radek') {
              var rep = str(Q, 'comintern_rep') || '';
              show = rep.indexOf('Radek') >= 0;
          }
          if (show) { out.push({id: id, name: c[1], faction: c[2], role: c[3], status: status}); }
      });
      return out;
  }
  var STATUS_LABEL = {free: 'At liberty', prison: 'In prison', exile: 'In exile', dead: 'Dead', expelled: 'Expelled'};
  BLOCKS.comrades = function(el, Q) {
      var list = Array.isArray(Q.comrades) ? Q.comrades.filter(function(c) { return c && (c.name || c.id); }) : null;
      var fromRoster = !!(list && list.length);
      if (!fromRoster) { list = fallbackComrades(Q); }
      var order = {free: 0, prison: 1, exile: 2, expelled: 3, dead: 4};
      list = list.slice().sort(function(a, b) { return (order[a.status] || 0) - (order[b.status] || 0); });
      var h = '<ul class="roster">';
      list.forEach(function(c) {
          var st = STATUS_LABEL[c.status] ? c.status : 'free';
          var name = c.name || c.id;
          var f = isFaction(c.faction) ? c.faction : null;
          h += '<li class="st-' + st + '"><span class="mono" style="--fc: var(--f-' + (f || 'none') + ')">' + esc(initials(name)) + '</span>' +
            '<span class="c-name">' + esc(name) + '<span class="c-role">' + (f ? esc(factionName(Q, f)) + (c.role ? ' · ' : '') : '') + esc(c.role || '') + '</span></span>' +
            '<span class="stamp">' + STATUS_LABEL[st] + '</span></li>';
      });
      h += '</ul>';
      if (!fromRoster) { h += '<div class="roster-note">The party\'s leading figures, from the Zentrale\'s own files.</div>'; }
      el.innerHTML = h;
  };

  BLOCKS.congress = function(el, Q) {
      if (!Q.congress) { el.innerHTML = '<div class="ui-empty">No congress is sitting.</div>'; return; }
      var sess = num(Q, 'congress_session');
      var stake = str(Q, 'congress_stake');
      el.innerHTML = '<div class="congress-name">' + esc(str(Q, 'congress_name') || 'Party congress') + '</div>' +
        '<div class="congress-meta"><span class="mini-label">' + (sess ? 'Session ' + sess : 'In session') + '</span></div>' +
        (stake ? '<div class="congress-stake">' + esc(stake) + '</div>' : '') + delegatesHTML(Q);
  };

  BLOCKS.crisis = function(el, Q) {
      var w = num(Q, 'week');
      var ct = num(Q, 'crisis_time');
      if (!Q.crisis || !w) { return; }
      el.innerHTML = '<div class="crisis-week"><span class="big">' + w + '</span><span class="lbl">Week ' + w + ' of ' + esc(dateText(Q)) +
        '<br>' + (ct !== null && ct > 0 ? ct + (ct === 1 ? ' week' : ' weeks') + ' since it began' : 'It has just begun') + '</span></div>';
  };

  // ==================================================================== the table: piles, hand, advisers
  var DECK_LABEL = {party: 'Party Affairs', movement: 'The Movement', germany: 'Germany', international: 'The International',
    crisis: 'The Crisis', congress: 'Congress', other: 'Card'};
  function deckKindFromId(id) {
      var s = String(id).split('.').pop();
      if (/congress/.test(s)) { return 'congress'; }
      if (/crisis/.test(s)) { return 'crisis'; }
      if (/party/.test(s)) { return 'party'; }
      if (/movement/.test(s)) { return 'movement'; }
      if (/germany/.test(s)) { return 'germany'; }
      if (/international/.test(s)) { return 'international'; }
      return 'other';
  }
  function cardKind(cardId) {
      var sc = dendryUI.game.scenes[cardId];
      var tags = (sc && sc.tags) || [];
      if (tags.indexOf('congress') >= 0) { return 'congress'; }
      if (tags.indexOf('crisis') >= 0) { return 'crisis'; }
      if (tags.indexOf('party_affairs') >= 0) { return 'party'; }
      if (tags.indexOf('movement') >= 0) { return 'movement'; }
      if (tags.indexOf('germany') >= 0) { return 'germany'; }
      if (tags.indexOf('international') >= 0) { return 'international'; }
      return 'other';
  }
  function sectionHead(label, note, count) {
      return '<div class="section-head"><span class="sh-label">' + esc(label) + '</span>' +
        (note ? '<span class="sh-note">' + esc(note) + '</span>' : '') +
        (count ? '<span class="sh-count">' + esc(count) + '</span>' : '') + '</div>';
  }
  function cardLink(card) {
      return $('<a>').addClass('card').attr({href: '#', 'card-id': card.id, title: card.title});
  }

  window.displayDecks = function(decks) {
      var Q = Qs();
      var $content = dendryUI.$content;
      insertFrontPage(Q);
      // a full redraw of the table: piles, then the hand, then the advisers
      $content.children('.ui-piles, .ui-hand, .ui-advisors').remove();
      if (!decks.length) { return; }
      var $sec = $('<section>').addClass('table-section ui-piles');
      var note = Q.crisis ? 'Only crisis cards can be drawn now.' : 'Click a pile to draw a card into your hand.';
      $sec.append(sectionHead(Q.crisis ? 'Crisis cards' : 'The piles', note));
      var $ul = $('<ul>').addClass('decks');
      decks.forEach(function(deck) {
          var kind = deckKindFromId(deck.id);
          var $li = $('<li>').addClass('deck k-' + kind);
          var $a = cardLink(deck).addClass('deck-back');
          if (deck.image) { $a.append($('<img>').addClass('deck-img card-img').attr({src: deck.image, alt: ''})); }
          $a.append($('<span>').addClass('deck-art').html(RG.icon(kind)));
          $a.append($('<span>').addClass('deck-name').text(deck.title));
          if (!deck.canChoose) {
              $li.addClass('unavailable-card');
              $a.attr({'aria-disabled': 'true', title: deck.title + ': ' + (deck.subtitle || 'empty')});
              $a.append($('<span>').addClass('deck-empty').text('Empty'));
          } else if (deck.subtitle) {
              $a.attr('title', deck.title + ': ' + deck.subtitle);
          }
          $li.append($a);
          $ul.append($li);
      });
      $sec.append($ul);
      $content.append($sec);
  };

  // the opening lines of a card's own text, for cards without a subtitle
  var teaserCache = {};
  function cardTeaser(id) {
      var key = id + '|' + (Qs().time || 0) + '|' + (Qs().week || 0);
      if (teaserCache[key] !== undefined) { return teaserCache[key]; }
      var out = '';
      try {
          var sc = dendryUI.game.scenes[id];
          if (sc && sc.content) {
              var paras = dendryUI.dendryEngine._makeDisplayContent(sc.content, true);
              for (var i = 0; i < paras.length && !out; i++) {
                  if (paras[i].type === 'paragraph') {
                      var div = document.createElement('div');
                      div.innerHTML = dendryUI.contentToHTML.convertLine(paras[i].content);
                      out = div.textContent.replace(/\s+/g, ' ').trim();
                  }
              }
          }
      } catch (e) {
          out = '';
      }
      if (out.length > 170) { out = out.slice(0, 165).replace(/\s+\S*$/, '') + '\u2026'; }
      teaserCache[key] = out;
      return out;
  }

  window.displayHand = function(hand, maxCards) {
      var Q = Qs();
      var $content = dendryUI.$content;
      var $sec = $content.children('.ui-hand');
      var fresh = !$sec.length;
      if (fresh) {
          $sec = $('<section>').addClass('table-section ui-hand');
      }
      $sec.empty();
      var unit = (str(Q, 'turn_label') || (Q.crisis ? 'week' : 'month'));
      var held = hand.filter(Boolean).length;
      $sec.append(sectionHead('Your hand', 'Play one card to end the ' + unit + '.', held + ' of ' + maxCards));
      var $ul = $('<ul>').addClass('hand');
      for (var i = 0; i < maxCards; i++) {
          var $li = $('<li>').addClass('card-in-hand');
          var card = hand[i];
          if (card) {
              var kind = cardKind(card.id);
              $li.addClass('k-' + kind);
              var $a = cardLink(card).addClass('leaflet');
              $a.append($('<span>').addClass('lf-band')
                .append($('<span>').addClass('lf-icon').html(RG.icon(kind)))
                .append($('<span>').text(DECK_LABEL[kind])));
              if (card.image) {
                  $a.append($('<span>').addClass('lf-img').append($('<img>').addClass('card-img').attr({src: card.image, alt: ''})));
              }
              $a.append($('<span>').addClass('lf-title').text(card.title));
              $a.append($('<span>').addClass('lf-rule'));
              var blurb = card.subtitle || cardTeaser(card.id);
              if (blurb) { $a.append($('<span>').addClass('lf-blurb' + (card.subtitle ? '' : ' lf-teaser')).text(blurb)); }
              $a.append($('<span>').addClass('lf-play').text('Play'));
              $li.append($a);
          } else {
              $li.addClass('empty').append($('<div>').addClass('blank-card').text('Empty slot'));
          }
          $ul.append($li);
      }
      $sec.append($ul);
      if (fresh) {
          // the hand sits after the piles, before the advisers
          var $adv = $content.children('.ui-advisors');
          if ($adv.length) { $sec.insertBefore($adv); } else { $content.append($sec); }
      }
  };

  var ADVISERS = {
      luxemburg: ['luxemburgist', 'Theorist'], liebknecht: ['luxemburgist', 'Agitator'], jogiches: ['luxemburgist', 'Organiser'],
      levi: ['luxemburgist', 'Lawyer, Zentrale'], zetkin: ['luxemburgist', 'Women\'s movement'], pieck: ['luxemburgist', 'Organiser'],
      thalheimer: ['unionist', 'Theorist'], brandler: ['unionist', 'Trade unionist'], meyer: ['unionist', 'Zentrale'],
      fischer: ['offensive', 'Berlin Left'], maslow: ['offensive', 'Berlin Left'], thalmann: ['offensive', 'Hamburg docks'],
      radek: [null, 'Comintern envoy']
  };
  window.displayPinnedCards = function(cards) {
      var Q = Qs();
      var $content = dendryUI.$content;
      $content.children('.ui-advisors').remove();
      if (!cards.length) { return; }
      var desc = str(Q, 'pinnedCardsDescription') || window.pinnedCardsDescription || '';
      var note = desc.indexOf(' - ') >= 0 ? desc.split(' - ').slice(1).join(' - ') : desc;
      note = note ? note.charAt(0).toUpperCase() + note.slice(1) : '';
      var ready = num(Q, 'advisor_action_timer') !== null && Q.advisor_action_timer <= 0;
      var $sec = $('<section>').addClass('table-section ui-advisors');
      $sec.append(sectionHead('Advisers', note));
      var $ul = $('<ul>').addClass('pinned-cards');
      var roster = Array.isArray(Q.comrades) ? Q.comrades : [];
      cards.forEach(function(card) {
          var key = String(card.id).replace(/^adv_/, '');
          var meta = ADVISERS[key] || [null, ''];
          var faction = meta[0], role = meta[1];
          roster.forEach(function(c) {
              if (c && c.id === key) {
                  if (isFaction(c.faction)) { faction = c.faction; }
                  if (c.role) { role = c.role; }
              }
          });
          var $li = $('<li>').addClass('pinned-card');
          var $a = cardLink(card).addClass('dossier').attr('data-tab', key === 'radek' ? 'ECCI' : 'Dossier');
          var $photo = $('<span>').addClass('ds-photo').css('--fc', 'var(--f-' + (faction || 'none') + ')');
          if (card.image) {
              $photo.append($('<img>').attr({src: card.image, alt: ''}));
          } else {
              $photo.append($('<span>').addClass('ds-ini').text(initials(card.title)));
          }
          $photo.append($('<span>').addClass('ds-fstripe'));
          $a.append($photo);
          $a.append($('<span>').addClass('ds-plate').text(card.title));
          if (role) { $a.append($('<span>').addClass('ds-role').text(role)); }
          if (ready) { $a.append($('<span>').addClass('ds-ready').attr('title', 'An action is available')); }
          $li.append($a);
          $ul.append($li);
      });
      $sec.append($ul);
      $content.append($sec);
  };

  // ==================================================================== front page
  function fallbackHeadline(Q) {
      if (Q.crisis && str(Q, 'crisis_name')) { return str(Q, 'crisis_name'); }
      if (num(Q, 'kpd_banned') === 1) { return 'The party is banned'; }
      if ((num(Q, 'inflation') || 0) >= 80) { return 'The mark in free fall'; }
      if ((num(Q, 'repression') || 0) >= 70) { return 'Police raids on party offices'; }
      if ((num(Q, 'militancy') || 0) >= 75) { return 'Unrest in the factories'; }
      if ((num(Q, 'unity') || 50) < 25) { return 'Quarrels in the Zentrale'; }
      if ((num(Q, 'worker_support') || 0) >= 50) { return 'The workers turn to the party'; }
      return 'No great news from the districts';
  }
  function insertFrontPage(Q) {
      var content = document.getElementById('content');
      var old = content.querySelector('.frontpage');
      if (old) { old.remove(); }
      if (!inGame(Q)) { return; }
      var headline = str(Q, 'news_headline') || fallbackHeadline(Q);
      var items = Array.isArray(Q.news_items) ? Q.news_items.filter(function(x) { return typeof x === 'string' && x.trim(); }).slice(0, 4) : [];
      var crisis = !!Q.crisis;
      var h = '<div class="fp-top"><span class="fp-kicker">' + (crisis ? 'Telegram' : 'The news') + '</span>' +
        '<span class="fp-date">' + esc(dateText(Q)) + (crisis && num(Q, 'week') ? ' · Week ' + num(Q, 'week') : '') + '</span></div>';
      h += '<h2 class="fp-headline">' + esc(headline) + '</h2>';
      if (crisis && str(Q, 'news_headline') && str(Q, 'crisis_name')) {
          h += '<p class="fp-deck">' + esc(str(Q, 'crisis_name')) + '</p>';
      }
      if (items.length) {
          h += '<ul class="fp-items">' + items.map(function(x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      }
      var section = document.createElement('section');
      section.className = 'frontpage';
      section.setAttribute('aria-label', 'The news');
      section.innerHTML = h;
      // the month's date heading from post_event becomes the front page's dateline
      var heads = content.querySelectorAll('h1');
      var dateHead = null;
      for (var i = 0; i < heads.length; i++) {
          if (/^(January|February|March|April|May|June|July|August|September|October|November|December) \d{4}/.test(heads[i].textContent.trim())) {
              dateHead = heads[i];
          }
      }
      if (dateHead) {
          dateHead.classList.add('ui-dateline');
          dateHead.insertAdjacentElement('afterend', section);
      } else {
          content.insertBefore(section, content.firstChild);
      }
  }

  // ==================================================================== choices: line badges and faction accents
  var FACTION_PATTERNS = [
      ['ultraleft', /\bLeft Radical/],
      ['luxemburgist', /\bSpartacist/],
      ['offensive', /\b(?:the|The) Left(?!\s+Radical)\b|\bLeft's\b/],
      ['unionist', /\b(?:the|The) Right\b|\bRight's\b/]
  ];
  function enhanceChoices(ul) {
      if (ul.getAttribute('data-ui')) { return; }
      ul.setAttribute('data-ui', '1');
      ul.querySelectorAll('li').forEach(function(li) {
          var sub = li.querySelector('div.subtitle');
          if (!sub) { return; }
          sub.innerHTML = sub.innerHTML.replace(/Against the party line: costs Unity\.?/, '<span class="against">Against the line</span>Costs Unity.');
          var text = sub.textContent;
          var found = [];
          FACTION_PATTERNS.forEach(function(p) {
              if (p[1].test(text) && found.indexOf(p[0]) < 0) { found.push(p[0]); }
          });
          if (found.length === 1) {
              li.setAttribute('data-faction', found[0]);
              li.style.setProperty('--fc', 'var(--f-' + found[0] + ')');
          }
      });
  }

  // title screen: a front page for the game itself
  function decorateTitle(Q) {
      var content = document.getElementById('content');
      if (inGame(Q) || content.querySelector('.title-hero')) { return; }
      var h1 = content.querySelector('h1');
      if (!h1 || !/Red Germany/.test(h1.textContent)) { return; }
      var hero = document.createElement('div');
      hero.className = 'title-hero';
      hero.innerHTML = '<div><div class="th-kicker">Special edition</div>' +
        '<div class="th-head">The revolution is not over</div>' +
        '<p class="th-text">January 1919. The Kaiser has fled and the Republic is two months old. In Berlin, the Spartacus League and its allies have just founded a new party. You hold its Zentrale.</p></div>' +
        '<div class="th-map">' + RG.mapSVG({}, {decorative: true}) + '</div>';
      content.insertBefore(hero, content.firstChild);
  }

  window.onDisplayContent = function() {
      window.updateSidebar();
      decorateTitle(Qs());
  };

  // watch the page for new choices
  function watchContent() {
      var content = document.getElementById('content');
      if (!content || !window.MutationObserver) { return; }
      var obs = new MutationObserver(function(muts) {
          muts.forEach(function(m) {
              m.addedNodes.forEach(function(n) {
                  if (n.nodeType === 1 && n.matches && n.matches('ul.choices')) { enhanceChoices(n); }
              });
          });
      });
      obs.observe(content, {childList: true});
  }

  // kept from the base game
  window.generateBar = function(quality, qualityName, max, min, colors) {
      var bar = document.createElement('div');
      bar.className = 'bar';
      var value = document.createElement('div');
      value.className = 'barValue';
      var width = clamp((quality - min) / (max - min), 0, 1);
      value.style.width = Math.round(width * 100) + '%';
      bar.textContent = qualityName + ': ' + quality;
      bar.appendChild(value);
      return bar;
  };

  window.justLoaded = true;
  window.statusTab = "status";
  window.dendryModifyUI = main;
  console.log("Modifying stats: see dendryUI.dendryEngine.state.qualities");

  window.onload = function() {
    var d = window.dendryUI;
    d.loadSettings({show_portraits: false});
    if (localStorage[game.title + '_language'] == "de") {
        window.loadGerman();
    }
    // colour scheme: the saved choice, else the system's
    var savedDark = stored('dark_mode');
    var dark = savedDark ? savedDark === 'true' : !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    d.dark_mode = dark;
    document.body.classList.toggle('dark-mode', dark);
    document.documentElement.classList.toggle('dark-pre', dark);
    // text size (the engine does not keep it)
    var fs = parseFloat(stored('font_size'));
    d.font_size = (fs >= FONT_MIN && fs <= FONT_MAX) ? fs : 1;
    applyFontSize();
    // the party files start folded on small screens
    var open = stored('files_open');
    if (window.innerWidth <= 880) {
        window.toggleFiles(open === 'true');
    }
    window.pinnedCardsDescription = "Advisers - actions are only usable once every few months.";
    watchContent();
    document.querySelectorAll('#content ul.choices').forEach(enhanceChoices);
    window.updateSidebar();
  };

}());
