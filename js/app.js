/* Shared calculator renderer: accessible inputs, live calculations and result tools. */
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

  var positiveFields = { l: true, w: true, d: true, p: true, h: true, k: true, cv: true, tw: true, tl: true, a: true, b: true, r: true, dia: true };
  var integerFields = { bx: true, dr: true, wn: true, k: true };
  var defaults = {};
  var latestSummary = '';
  var hasResult = false;
  var announceTimer;

  function announce(message) {
    var status = $('srStatus');
    if (!status) return;
    window.clearTimeout(announceTimer);
    announceTimer = window.setTimeout(function () { status.textContent = message; }, 450);
  }

  function buildInputs() {
    $('in').innerHTML = calculator.f.map(function (field) {
      var id = field[0];
      var label = esc(field[1]);
      var initial = field[3];
      defaults[id] = Array.isArray(field[2]) ? String(field[2][field[3]][1]) : String(initial);

      if (Array.isArray(field[2])) {
        var options = field[2].map(function (option, index) {
          return '<option value="' + esc(option[1]) + '"' + (index === field[3] ? ' selected' : '') + '>' + esc(option[0]) + '</option>';
        }).join('');
        return '<div class="field"><label for="' + id + '">' + label + '</label><div class="field-control"><select id="' + id + '" name="' + id + '">' + options + '</select><span class="field-chevron" aria-hidden="true">⌄</span></div></div>';
      }

      var required = !!positiveFields[id];
      var step = (field[2] === 'no.' || integerFields[id]) ? '1' : 'any';
      var unit = field[2] ? '<span class="field-unit">' + esc(field[2]) + '</span>' : '';
      var condition = field[4] ? ' data-show-when="' + esc(Array.isArray(field[4]) ? field[4].join('|') : field[4]) + '"' : '';
      return '<div class="field"' + condition + '><label for="' + id + '">' + label + '</label><div class="field-control"><input id="' + id + '" name="' + id + '" type="number" inputmode="decimal" min="0" max="100000000" step="' + step + '" value="' + esc(initial) + '"' + (required ? ' required' : '') + '>' + unit + '</div></div>';
    }).join('');
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

  function syncConditionalFields() {
    var shapeControl = $('shape');
    if (!shapeControl) return;
    var selected = shapeControl.value;
    document.querySelectorAll('.field[data-show-when]').forEach(function (field) {
      var allowed = field.getAttribute('data-show-when').split('|');
      field.hidden = allowed.indexOf(selected) === -1;
    });
  }

  function readValues() {
    syncConditionalFields();
    var values = {};
    var errors = [];
    var invalidFields = [];
    function addError(fieldId, message) {
      errors.push(message);
      if (fieldId && invalidFields.indexOf(fieldId) === -1) invalidFields.push(fieldId);
    }

    calculator.f.forEach(function (field) {
      var id = field[0];
      var element = $(id);
      var raw = element.value.trim();

      var wrapper = element.closest('.field');
      if (wrapper && wrapper.hidden) {
        values[id] = 0;
        return;
      }

      if (Array.isArray(field[2])) {
        var selected = Number(raw);
        if (raw === '') addError(id, field[1] + ' is required.');
        values[id] = raw !== '' && Number.isFinite(selected) ? selected : raw;
        return;
      }

      var value = raw === '' ? 0 : Number(raw);
      var isOpeningArea = (id === 'da' && Number($('dr') && $('dr').value) > 0) || (id === 'wa' && Number($('wn') && $('wn').value) > 0);
      var required = !!positiveFields[id] || isOpeningArea;

      if (raw === '' && required) addError(id, field[1] + ' is required.');
      else if (required && value === 0) addError(id, field[1] + ' must be greater than zero.');
      else if ((field[2] === 'no.' || integerFields[id]) && !Number.isInteger(value)) addError(id, field[1] + ' must be a whole number.');
      else if (!Number.isFinite(value) || value < 0) addError(id, field[1] + ' must be zero or a positive number.');
      else if (field[2] === '%' && value > 100) addError(id, field[1] + ' must be 100% or less.');
      else if (value > 100000000) addError(id, field[1] + ' is too large. Check the value and unit.');

      values[id] = Number.isFinite(value) && value >= 0 ? value : 0;
    });

    if (calculator.f.some(function (field) { return field[0] === 'l2'; }) &&
      ((values.l2 > 0 && values.w2 === 0) || (values.w2 > 0 && values.l2 === 0))) {
      addError('l2', 'Enter both dimensions for the second section, or leave both at zero.');
      addError('w2', 'Enter both dimensions for the second section, or leave both at zero.');
    }

    if (key === 'paint' && values.p * values.h < values.dr * values.da + values.wn * values.wa) {
      addError('da', 'Door and window areas exceed the wall area. Check the counts and average opening sizes.');
      addError('wa', 'Door and window areas exceed the wall area. Check the counts and average opening sizes.');
    }
    if (key === 'brick' && values.l * values.h < values.o) {
      addError('o', 'Opening area exceeds the wall area. Check the wall dimensions and opening deduction.');
    }

    return { values: values, errors: errors, invalidFields: invalidFields };
  }

  function setInvalidState(read) {
    calculator.f.forEach(function (field) {
      var element = $(field[0]);
      var wrapper = element.closest('.field');
      var invalid = read.invalidFields.indexOf(field[0]) !== -1;
      if (invalid) {
        element.setAttribute('aria-invalid', 'true');
        element.setAttribute('aria-describedby', 'feedback');
        if (wrapper) wrapper.classList.add('is-invalid');
      } else {
        element.removeAttribute('aria-invalid');
        element.removeAttribute('aria-describedby');
        if (wrapper) wrapper.classList.remove('is-invalid');
      }
    });
  }

  function clearResult(message) {
    hasResult = false;
    latestSummary = '';
    window.__latestCalcSummary = '';
    if ($('copyResults')) $('copyResults').disabled = true;
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
      if (rows.some(function (row) { return !Array.isArray(row) || row.length < 2 || /^(NaN|Infinity|-Infinity)$/i.test(String(row[1])); })) {
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
      syncSticky();
      announce(primary[0] + ': ' + primary[1]);
    } catch (error) {
      clearResult('Unable to calculate');
      feedback.textContent = 'We could not calculate that combination. Please check your measurements.';
      feedback.classList.add('is-visible');
    }
  }

  buildInputs();
  calculator.f.forEach(function (field) {
    $(field[0]).addEventListener('input', render);
    $(field[0]).addEventListener('change', render);
  });

  if ($('resetCalc')) {
    $('resetCalc').addEventListener('click', function () {
      calculator.f.forEach(function (field) { $(field[0]).value = defaults[field[0]]; });
      if ($('copyFeedback')) $('copyFeedback').textContent = '';
      render();
    });
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
