/* Shared calculator renderer: accessible inputs, repeatable groups (areas, rooms, walls),
   live calculations and result tools. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  };

  var key = document.body.getAttribute('data-calc');
  var calculator = typeof C !== 'undefined' ? C[key] : null;
  if (!calculator || !$('in') || !$('out')) return;

  var groups = calculator.g || {};
  var positiveFields = { l: true, w: true, d: true, p: true, h: true, k: true, cv: true, tw: true, tl: true, a: true, b: true, r: true, dia: true };
  var integerFields = { bx: true, dr: true, wn: true, k: true };
  var MAX = 100000000;
  var defaults = {};
  var latestSummary = '';
  var hasResult = false;
  var announceTimer;
  var uid = 0;

  function announce(message) {
    var status = $('srStatus');
    if (!status) return;
    window.clearTimeout(announceTimer);
    announceTimer = window.setTimeout(function () { status.textContent = message; }, 450);
  }

  function whenAttr(when) {
    if (!when) return '';
    var rule = Array.isArray(when) ? { shape: when } : when;
    return ' data-when="' + esc(JSON.stringify(rule)) + '"';
  }

  /* One input or select. prefix is '' for top level fields; group items use unique ids. */
  function fieldHtml(field, prefix) {
    var id = prefix + field[0];
    var label = esc(field[1]);
    var cond = whenAttr(field[4]);
    if (Array.isArray(field[2])) {
      var options = field[2].map(function (option, index) {
        var sets = option[2] ? ' data-sets="' + esc(JSON.stringify(option[2])) + '"' : '';
        return '<option value="' + esc(option[1]) + '"' + sets + (index === field[3] ? ' selected' : '') + '>' + esc(option[0]) + '</option>';
      }).join('');
      return '<div class="field"' + cond + '><label for="' + id + '">' + label + '</label><div class="field-control"><select id="' + id + '" name="' + id + '" data-f="' + field[0] + '">' + options + '</select><span class="field-chevron" aria-hidden="true">⌄</span></div></div>';
    }
    if (field[2] === '@text') {
      return '<div class="field"' + cond + '><label for="' + id + '">' + label + '</label><div class="field-control"><input id="' + id + '" name="' + id + '" data-f="' + field[0] + '" type="text" maxlength="40" placeholder="e.g. Driveway" autocomplete="off" value="' + esc(field[3]) + '"></div></div>';
    }
    var required = !!(positiveFields[field[0]] || field[5]);
    var step = (field[2] === 'no.' || (!prefix && integerFields[field[0]])) ? '1' : 'any';
    var unit = field[2] ? '<span class="field-unit">' + esc(field[2]) + '</span>' : '';
    return '<div class="field"' + cond + '><label for="' + id + '">' + label + '</label><div class="field-control"><input id="' + id + '" name="' + id + '" data-f="' + field[0] + '" type="number" inputmode="decimal" min="0" max="' + MAX + '" step="' + step + '" value="' + esc(field[3]) + '"' + (required ? ' required' : '') + '>' + unit + '</div></div>';
  }

  function groupShell(name) {
    var g = groups[name];
    return '<div class="calc-group" data-group="' + name + '"' + whenAttr(g.when) + '><div class="calc-group-head"><h3>' + esc(g.title) + '</h3></div><div class="group-items"></div>' +
      '<button type="button" class="button button-outline group-add">+ ' + esc(g.add) + '</button></div>';
  }

  function itemHtml(name, data, index) {
    var g = groups[name];
    var prefix = 'gi' + (++uid) + '-';
    var fields = g.fields.map(function (field) {
      var copy = field.slice();
      if (data && data[field[0]] !== undefined) {
        if (Array.isArray(copy[2])) copy[3] = Math.max(0, copy[2].findIndex(function (o) { return String(o[1]) === String(data[field[0]]); }));
        else copy[3] = data[field[0]];
      }
      return fieldHtml(copy, prefix);
    }).join('');
    return '<fieldset class="group-item"><legend><span class="group-item-title">' + esc(g.item) + ' ' + index + '</span></legend>' +
      '<button type="button" class="group-remove" aria-label="Remove ' + esc(g.item.toLowerCase()) + ' ' + index + '">Remove</button>' +
      '<div class="group-fields">' + fields + '</div></fieldset>';
  }

  function renumber(name) {
    var g = groups[name];
    var wrap = document.querySelector('.calc-group[data-group="' + name + '"]');
    var items = wrap.querySelectorAll('.group-item');
    items.forEach(function (item, i) {
      item.querySelector('.group-item-title').textContent = g.item + ' ' + (i + 1);
      var remove = item.querySelector('.group-remove');
      remove.hidden = items.length <= (g.min || 1);
      remove.setAttribute('aria-label', 'Remove ' + g.item.toLowerCase() + ' ' + (i + 1));
    });
    wrap.querySelector('.group-add').disabled = items.length >= (g.max || 12);
  }

  function setItems(name, list) {
    var box = document.querySelector('.calc-group[data-group="' + name + '"] .group-items');
    box.innerHTML = list.map(function (data, i) { return itemHtml(name, data, i + 1); }).join('');
    renumber(name);
  }

  function addItem(name) {
    var box = document.querySelector('.calc-group[data-group="' + name + '"] .group-items');
    var count = box.querySelectorAll('.group-item').length;
    var holder = document.createElement('div');
    holder.innerHTML = itemHtml(name, null, count + 1);
    var node = holder.firstChild;
    box.appendChild(node);
    renumber(name);
    var first = node.querySelector('input, select');
    if (first) first.focus();
  }

  function buildInputs() {
    $('in').innerHTML = calculator.f.map(function (field) {
      if (String(field[0]).charAt(0) === '@') return groupShell(field[0].slice(1));
      defaults[field[0]] = Array.isArray(field[2]) ? String(field[2][field[3]][1]) : String(field[3]);
      return fieldHtml(field, '');
    }).join('');
    Object.keys(groups).forEach(function (name) { setItems(name, groups[name].defaults || [{}]); });
  }

  var resultPanel = document.querySelector('.result-panel');
  var sticky = document.createElement('button');
  sticky.type = 'button';
  sticky.className = 'sticky-result';
  sticky.hidden = true;
  sticky.setAttribute('aria-hidden', 'true');
  sticky.tabIndex = -1;
  sticky.innerHTML = '<span id="stickyLabel"></span><strong id="stickyValue"></strong>';
  document.body.appendChild(sticky);
  var panelVisible = true;

  function syncSticky() {
    var visible = hasResult && !panelVisible;
    sticky.hidden = !visible;
    sticky.setAttribute('aria-hidden', visible ? 'false' : 'true');
    sticky.tabIndex = visible ? 0 : -1;
  }
  if ('IntersectionObserver' in window && resultPanel) {
    new IntersectionObserver(function (entries) {
      panelVisible = entries[0].isIntersecting;
      syncSticky();
    }, { threshold: 0.05 }).observe(resultPanel);
  }
  sticky.addEventListener('click', function () {
    if (resultPanel) resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* Show or hide fields that depend on another control (in the same item for group fields). */
  function control(scope, id) {
    return scope === document ? $(id) : scope.querySelector('[data-f="' + id + '"]');
  }
  function syncConditionalFields() {
    document.querySelectorAll('#in .calc-group[data-when]').forEach(function (group) {
      var rule;
      try { rule = JSON.parse(group.getAttribute('data-when')); } catch (e) { return; }
      group.hidden = !Object.keys(rule).every(function (id) { var ctrl = $(id); return ctrl && rule[id].indexOf(String(ctrl.value)) !== -1; });
    });
    document.querySelectorAll('#in .field[data-when]').forEach(function (field) {
      var rule;
      try { rule = JSON.parse(field.getAttribute('data-when')); } catch (e) { return; }
      var item = field.closest('.group-item');
      var scope = item || document;
      var show = Object.keys(rule).every(function (id) {
        var ctrl = control(scope, id);
        return ctrl && rule[id].indexOf(String(ctrl.value)) !== -1;
      });
      field.hidden = !show;
    });
  }

  function readField(field, element, label, values, addError) {
    var id = field[0];
    if (field[2] === '@text') { values[id] = element.value.trim().slice(0, 40); return; }
    var wrapper = element.closest('.field');
    if (wrapper && wrapper.hidden) { values[id] = Array.isArray(field[2]) ? element.value : 0; return; }
    var raw = element.value.trim();
    if (Array.isArray(field[2])) {
      var selected = Number(raw);
      if (raw === '') addError(element, label + ' is required.');
      values[id] = raw !== '' && Number.isFinite(selected) ? selected : raw;
      return;
    }
    var inGroup = !!element.closest('.group-item');
    var value = raw === '' ? 0 : Number(raw);
    var required = !!(positiveFields[id] || field[5]);
    var whole = field[2] === 'no.' || (!inGroup && integerFields[id]);
    if (raw === '' && required) addError(element, label + ' is required.');
    else if (required && value === 0) addError(element, label + ' must be greater than zero.');
    else if (whole && !Number.isInteger(value)) addError(element, label + ' must be a whole number.');
    else if (!Number.isFinite(value) || value < 0) addError(element, label + ' must be zero or a positive number.');
    else if (field[2] === '%' && value > 100) addError(element, label + ' must be 100% or less.');
    else if (value > MAX) addError(element, label + ' is too large. Check the value and unit.');
    values[id] = Number.isFinite(value) && value >= 0 ? value : 0;
  }

  function readValues() {
    syncConditionalFields();
    var values = {};
    var errors = [];
    var invalid = [];
    function addError(element, message) {
      errors.push(message);
      if (element && invalid.indexOf(element) === -1) invalid.push(element);
    }

    calculator.f.forEach(function (field) {
      if (String(field[0]).charAt(0) === '@') return;
      readField(field, $(field[0]), field[1], values, addError);
    });

    Object.keys(groups).forEach(function (name) {
      var g = groups[name];
      values[name] = [];
      if (document.querySelector('.calc-group[data-group="' + name + '"]').hidden) return;
      document.querySelectorAll('.calc-group[data-group="' + name + '"] .group-item').forEach(function (card, i) {
        var item = {};
        g.fields.forEach(function (field) {
          readField(field, control(card, field[0]), g.item + ' ' + (i + 1) + ': ' + field[1], item, addError);
        });
        values[name].push(item);
      });
    });

    if (calculator.f.some(function (field) { return field[0] === 'l2'; }) &&
      ((values.l2 > 0 && values.w2 === 0) || (values.w2 > 0 && values.l2 === 0))) {
      addError($('l2'), 'Enter both dimensions for the second section, or leave both at zero.');
      addError($('w2'), 'Enter both dimensions for the second section, or leave both at zero.');
    }
    if (errors.length === 0 && typeof calculator.check === 'function') {
      calculator.check(values).forEach(function (message) { addError(null, message); });
    }
    return { values: values, errors: errors, invalid: invalid };
  }

  function setInvalidState(read) {
    document.querySelectorAll('#in input, #in select').forEach(function (element) {
      var wrapper = element.closest('.field');
      var bad = read.invalid.indexOf(element) !== -1;
      if (bad) {
        element.setAttribute('aria-invalid', 'true');
        element.setAttribute('aria-describedby', 'feedback');
      } else {
        element.removeAttribute('aria-invalid');
        element.removeAttribute('aria-describedby');
      }
      if (wrapper) wrapper.classList.toggle('is-invalid', bad);
    });
  }

  function clearResult(message) {
    hasResult = false;
    latestSummary = '';
    window.__latestCalcSummary = '';
    if ($('copyResults')) $('copyResults').disabled = true;
    if ($('printResults')) $('printResults').disabled = true;
    if ($('copyFeedback')) $('copyFeedback').textContent = '';
    syncSticky();
    $('out').innerHTML = '<div class="result-empty"><span>!</span><b>' + esc(message || 'Check your measurements') + '</b><p>Enter valid values to see your estimate.</p></div>';
    $('nt').textContent = '';
  }

  function render() {
    var read = readValues();
    var feedback = $('feedback');
    setInvalidState(read);

    if (read.errors.length) {
      clearResult('Check your measurements');
      feedback.textContent = read.errors[0];
      feedback.classList.add('is-visible');
      return;
    }
    feedback.textContent = '';
    feedback.classList.remove('is-visible');

    try {
      var result = calculator.c(read.values);
      var rows = result && Array.isArray(result[0]) ? result[0] : [];
      var primaryIndex = typeof calculator.pi === 'number' ? calculator.pi : 0;
      if (!rows.length || !rows[primaryIndex]) throw new Error('No primary result');
      if (rows.some(function (row) { return !Array.isArray(row) || row.length < 2 || /(NaN|Infinity)/i.test(String(row[1])); })) {
        throw new Error('Invalid result value');
      }
      var primary = rows[primaryIndex];
      var secondary = rows.filter(function (row, index) { return index !== primaryIndex; });
      $('out').innerHTML = '<div class="result-primary"><span class="result-label">' + esc(primary[0]) + '</span><strong>' + esc(primary[1]) + '</strong>' + (primary[2] ? '<small>' + esc(primary[2]) + '</small>' : '') + '</div>' +
        (secondary.length ? '<div class="result-breakdown">' + secondary.map(function (row) {
          return '<div class="result-row"><div><span>' + esc(row[0]) + '</span>' + (row[2] ? '<small>' + esc(row[2]) + '</small>' : '') + '</div><b>' + esc(row[1]) + '</b></div>';
        }).join('') + '</div>' : '');
      $('nt').textContent = result[1] || '';
      $('stickyLabel').textContent = primary[0];
      $('stickyValue').textContent = primary[1];

      hasResult = true;
      latestSummary = [calculator.h || calculator.nm, ''].concat(rows.map(function (row) {
        return row[0] + ': ' + row[1] + (row[2] ? ' (' + row[2] + ')' : '');
      }), result[1] || '').filter(Boolean).join('\n');
      window.__latestCalcSummary = latestSummary;
      if ($('copyResults')) $('copyResults').disabled = false;
      if ($('printResults')) $('printResults').disabled = false;
      syncSticky();
      announce(primary[0] + ': ' + primary[1]);
    } catch (error) {
      clearResult('Unable to calculate');
      feedback.textContent = 'We could not calculate that combination. Please check your measurements.';
      feedback.classList.add('is-visible');
    }
  }

  buildInputs();

  var form = $('in');
  form.addEventListener('input', render);
  form.addEventListener('change', function (event) {
    var target = event.target;
    if (target.tagName === 'SELECT') {
      var option = target.options[target.selectedIndex];
      var sets = option && option.getAttribute('data-sets');
      if (sets) {
        try {
          var map = JSON.parse(sets);
          Object.keys(map).forEach(function (id) { if ($(id)) $(id).value = map[id]; });
        } catch (e) { /* ignore malformed presets */ }
      }
    }
    render();
  });
  form.addEventListener('click', function (event) {
    var add = event.target.closest('.group-add');
    var remove = event.target.closest('.group-remove');
    if (add) { addItem(add.closest('.calc-group').getAttribute('data-group')); render(); }
    if (remove) {
      var wrap = remove.closest('.calc-group');
      remove.closest('.group-item').remove();
      renumber(wrap.getAttribute('data-group'));
      render();
    }
  });

  if ($('resetCalc')) {
    $('resetCalc').addEventListener('click', function () {
      buildInputs();
      if ($('copyFeedback')) $('copyFeedback').textContent = '';
      render();
    });
  }

  if ($('printResults')) {
    $('printResults').disabled = true;
    $('printResults').addEventListener('click', function () { if (hasResult) window.print(); });
  }

  if ($('copyResults')) {
    $('copyResults').disabled = true;
    $('copyResults').addEventListener('click', async function () {
      if (!hasResult || !latestSummary) return;
      var text = latestSummary;
      var status = $('copyFeedback');
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          var temporary = document.createElement('textarea');
          temporary.value = text;
          temporary.setAttribute('readonly', '');
          temporary.style.position = 'absolute';
          temporary.style.left = '-9999px';
          document.body.appendChild(temporary);
          temporary.select();
          var copied = document.execCommand('copy');
          document.body.removeChild(temporary);
          if (!copied) throw new Error('Copy not available');
        }
        if (hasResult && text === latestSummary) status.textContent = 'Copied';
      } catch (error) {
        status.textContent = 'Copy unavailable in this browser';
      }
      window.setTimeout(function () { status.textContent = ''; }, 2500);
    });
  }

  render();
})();
