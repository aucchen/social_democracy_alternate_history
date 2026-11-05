/*
 * Red Germany: drawing helpers for the interface.
 * - RG.icon(name): small inline SVG icons for the decks and markers
 * - RG.mapSVG(Q, opts): a schematic hex map of the eight party districts
 * Everything reads the qualities defensively: values that are not set yet
 * (district life, red republics) simply draw nothing.
 */
(function() {
  'use strict';
  var RG = window.RG = window.RG || {};

  var SVGNS = 'http://www.w3.org/2000/svg';

  // ------------------------------------------------------------------ icons
  function starPoints(cx, cy, R, r) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var rad = (i % 2 === 0) ? R : r;
      pts.push((cx + rad * Math.cos(a)).toFixed(2) + ',' + (cy + rad * Math.sin(a)).toFixed(2));
    }
    return pts.join(' ');
  }
  RG.starPoints = starPoints;

  var ICONS = {
    // Party Affairs: the star
    party: '<polygon points="' + starPoints(24, 25.5, 21, 8.4) + '" fill="currentColor"/>',
    // The Movement: a factory with saw-tooth roofs and chimneys
    movement: '<path d="M3 44V25l10 6v-6l10 6v-6l10 6V9h4v22h3V5h4v39z" fill="currentColor"/>' +
      '<rect x="8" y="35" width="4" height="4" fill="var(--deck-bg, #000)"/><rect x="17" y="35" width="4" height="4" fill="var(--deck-bg, #000)"/><rect x="26" y="35" width="4" height="4" fill="var(--deck-bg, #000)"/>',
    // Germany: the portico of the Reichstag
    germany: '<path d="M24 4L44 14H4z" fill="currentColor"/><rect x="5" y="16" width="38" height="3" fill="currentColor"/>' +
      '<rect x="8" y="21" width="4" height="17" fill="currentColor"/><rect x="16" y="21" width="4" height="17" fill="currentColor"/>' +
      '<rect x="22" y="21" width="4" height="17" fill="currentColor"/><rect x="28" y="21" width="4" height="17" fill="currentColor"/>' +
      '<rect x="36" y="21" width="4" height="17" fill="currentColor"/><rect x="3" y="40" width="42" height="4" fill="currentColor"/>',
    // The International: the globe
    international: '<g fill="none" stroke="currentColor" stroke-width="3"><circle cx="24" cy="24" r="19"/><ellipse cx="24" cy="24" rx="8" ry="19"/>' +
      '<path d="M5 24h38M8.5 14h31M8.5 34h31"/></g>',
    // The Crisis: the lightning bolt
    crisis: '<polygon points="27,2 8,27 21,27 16,46 40,18 27,18 33,2" fill="currentColor"/>',
    // Congress: the speaker's platform
    congress: '<circle cx="24" cy="8" r="5" fill="currentColor"/><path d="M17 15h14l2 6H15z" fill="currentColor"/>' +
      '<path d="M8 22h32l-3 6H11z" fill="currentColor"/><path d="M14 29h20l-2 15H16z" fill="currentColor"/>',
    other: '<rect x="8" y="8" width="32" height="32" fill="none" stroke="currentColor" stroke-width="4"/>',
    // markers
    flag: '<path d="M10 4v40" stroke="currentColor" stroke-width="4"/><path d="M12 6h26l-7 9 7 9H12z" fill="currentColor"/>',
    rifle: '<circle cx="24" cy="24" r="18" fill="currentColor"/>',
    bars: '<rect x="4" y="4" width="40" height="40" fill="currentColor"/><path d="M14 8v32M24 8v32M34 8v32" stroke="var(--paper-2, #fff)" stroke-width="4" style="vector-effect: none"/>',
    star: '<polygon points="' + starPoints(24, 25.5, 21, 8.4) + '" fill="currentColor"/>'
  };
  RG.icon = function(name, cls) {
    var body = ICONS[name] || ICONS.other;
    return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' + body + '</svg>';
  };

  // ------------------------------------------------------------------ districts
  RG.DISTRICTS = ['berlin', 'hamburg', 'bremen', 'ruhr', 'saxony', 'thuringia', 'bavaria', 'halle'];
  RG.DISTRICT_NAMES = {
    berlin: 'Berlin-Brandenburg', hamburg: 'Hamburg', bremen: 'Bremen', ruhr: 'Rhineland-Westphalia',
    saxony: 'Saxony', thuringia: 'Thuringia', bavaria: 'Bavaria', halle: 'Halle-Merseburg'
  };
  RG.DISTRICT_SHORT = {
    berlin: 'Berlin', hamburg: 'Hamburg', bremen: 'Bremen', ruhr: 'Ruhr',
    saxony: 'Saxony', thuringia: 'Thuringia', bavaria: 'Bavaria', halle: 'Halle'
  };
  // hex positions: [column, row]; odd rows are already shifted by half a column
  var HEX = {
    bremen: [1, 0], hamburg: [2, 0],
    ruhr: [0.5, 1], halle: [2.5, 1], berlin: [3.5, 1],
    thuringia: [2, 2], saxony: [3, 2],
    bavaria: [3, 4]
  };
  // the rest of Germany, drawn as faint tiles so the districts sit in a country
  var GHOSTS = [[3, 0], [4, 0], [1.5, 1], [4.5, 1], [0, 2], [1, 2], [4, 2],
    [0.5, 3], [1.5, 3], [2.5, 3], [3.5, 3], [1, 4], [2, 4]];

  function num(Q, k) {
    var v = Q[k];
    return (typeof v === 'number' && !isNaN(v)) ? v : null;
  }

  // which districts are red republics now, and why
  RG.redRepublics = function(Q) {
    var out = {};
    if (num(Q, 'bavaria_soviet') === 2) { out.bavaria = 'Bavarian Soviet Republic'; }
    if (num(Q, 'ruhr_red_army') === 2) { out.ruhr = 'The Red Ruhr Army holds the district'; }
    if (num(Q, 'central_germany_soviet') === 2) { out.halle = 'Central German Soviet Republic'; }
    var r = num(Q, 'e23_red_region');
    if (r === 1) { out.saxony = 'Red Central Germany'; out.thuringia = 'Red Central Germany'; }
    if (r === 2) { out.ruhr = 'The red Ruhr'; }
    if (r === 3) { out.hamburg = 'The red coast'; out.bremen = 'The red coast'; }
    return out;
  };

  // everything the map and the district list know about one district
  RG.districtInfo = function(Q, d) {
    var f = Q['district_' + d + '_faction'];
    var names = Q.faction_names || {};
    var members = num(Q, 'district_' + d + '_members');
    return {
      id: d,
      name: (Q.district_names && Q.district_names[d]) || RG.DISTRICT_NAMES[d],
      short: RG.DISTRICT_SHORT[d],
      faction: (typeof f === 'string') ? f : null,
      factionName: (typeof f === 'string' && names[f]) ? names[f] : 'No current',
      members: members,
      loyalty: num(Q, 'district_' + d + '_loyalty'),
      militancy: num(Q, 'district_' + d + '_militancy'),
      guards: num(Q, 'district_' + d + '_guards'),
      repression: num(Q, 'district_' + d + '_repression'),
      strike: num(Q, 'district_' + d + '_strike'),
      republic: RG.redRepublics(Q)[d] || null
    };
  };

  function hexPath(cx, cy, r) {
    var p = [];
    for (var i = 0; i < 6; i++) {
      var a = Math.PI / 180 * (60 * i - 90);
      p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    return 'M' + p.join('L') + 'Z';
  }

  /*
   * opts: {selected: district id, decorative: bool (all red, no labels), id: svg id}
   * Returns an SVG string. Hex groups carry data-district for click handling.
   */
  RG.mapSVG = function(Q, opts) {
    opts = opts || {};
    var r = 31;
    var w = Math.sqrt(3) * r;
    var pad = 6;
    var W = Math.round(pad * 2 + w * 5.5);
    var H = Math.round(pad * 2 + r * 2 + r * 1.5 * 4);
    var cx = function(col) { return pad + w / 2 + col * w; };
    var cy = function(row) { return pad + r + row * r * 1.5; };
    var s = [];
    s.push('<svg class="map-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
      (opts.decorative ? 'Schematic map of Germany' : 'Schematic map of the party districts') + '">');
    if (!opts.decorative) {
      s.push('<text class="sea" x="' + (pad + 2) + '" y="' + (pad + 16) + '">North Sea</text>');
    }
    GHOSTS.forEach(function(g) {
      s.push('<path class="ghost" d="' + hexPath(cx(g[0]), cy(g[1]), r - 1) + '"/>');
    });
    var reds = opts.decorative ? {} : RG.redRepublics(Q);
    RG.DISTRICTS.forEach(function(d) {
      var pos = HEX[d];
      var x = cx(pos[0]), y = cy(pos[1]);
      var info = RG.districtInfo(Q, d);
      var fill, op;
      if (opts.decorative) {
        fill = 'var(--red)';
        op = 0.55 + 0.45 * ((d.length * 7) % 10) / 10;
      } else {
        fill = info.faction ? 'var(--f-' + info.faction + ')' : 'var(--f-none)';
        var loy = info.loyalty === null ? 50 : info.loyalty;
        op = 0.28 + 0.72 * Math.max(0, Math.min(100, loy)) / 100;
      }
      var sel = opts.selected === d ? ' sel' : '';
      s.push('<g class="hex-g' + sel + '" data-district="' + d + '"' + (opts.decorative ? '' : ' tabindex="0" role="button" aria-label="' + info.name + '"') + '>');
      s.push('<path class="hex" d="' + hexPath(x, y, r - 1) + '" fill="' + fill + '" fill-opacity="' + op.toFixed(2) + '"/>');
      if (reds[d]) {
        s.push('<path class="soviet-ring" d="' + hexPath(x, y, r - 5) + '"/>');
      }
      if (!opts.decorative) {
        var lblY = y + 3;
        if (reds[d]) {
          s.push('<polygon class="marker" points="' + starPoints(x, y - 13, 7.5, 3) + '" fill="var(--red)" stroke="var(--paper-2)" stroke-width="1.2"/>');
          lblY = y + 6;
        }
        s.push('<text class="hex-label" x="' + x.toFixed(1) + '" y="' + lblY.toFixed(1) + '" fill="var(--ink)" stroke="var(--paper-2)" stroke-width="3" paint-order="stroke">' + info.short + '</text>');
        if (info.members !== null) {
          s.push('<text class="hex-num" x="' + x.toFixed(1) + '" y="' + (lblY + 12).toFixed(1) + '" fill="var(--ink)" stroke="var(--paper-2)" stroke-width="3" paint-order="stroke">' + info.members.toFixed(1) + 'k</text>');
        }
        // markers on the hex rim: strike top left, red guards top right, repression bottom
        if (info.strike === 1) {
          s.push('<g class="marker" transform="translate(' + (x - 21).toFixed(1) + ',' + (y - 20).toFixed(1) + ') scale(0.24)" color="var(--red)">' + ICONS.flag + '</g>');
        }
        if (info.guards !== null && info.guards > 0) {
          s.push('<g class="marker"><circle cx="' + (x + 16).toFixed(1) + '" cy="' + (y - 15).toFixed(1) + '" r="7" fill="var(--red)" stroke="var(--paper-2)" stroke-width="1.5"/>' +
            '<text x="' + (x + 16).toFixed(1) + '" y="' + (y - 11.6).toFixed(1) + '" font-size="9" font-weight="800" font-family="Barlow Condensed, sans-serif" text-anchor="middle" fill="#fff">' + Math.round(info.guards) + '</text></g>');
        }
        if (info.repression !== null && info.repression >= 50) {
          s.push('<g class="marker" transform="translate(' + (x - 6).toFixed(1) + ',' + (y + 17).toFixed(1) + ') scale(0.25)" color="var(--ink)" opacity="' + (info.repression >= 75 ? 1 : 0.7) + '">' + ICONS.bars + '</g>');
        }
      }
      s.push('</g>');
    });
    s.push('</svg>');
    return s.join('');
  };
}());
