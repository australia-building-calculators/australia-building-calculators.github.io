(function () {
  'use strict';
  var input = document.getElementById('toolSearch');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-tool-card]'));
  var filters = Array.prototype.slice.call(document.querySelectorAll('[data-category-filter]'));
  var count = document.getElementById('searchCount');
  var empty = document.getElementById('noResults');
  if (!cards.length) return;

  var activeCategory = 'all';
  function filter() {
    var query = input ? input.value.trim().toLowerCase() : '';
    var shown = 0;
    cards.forEach(function (card) {
      var matchesText = !query || (card.getAttribute('data-search') || '').indexOf(query) !== -1;
      var matchesCategory = activeCategory === 'all' || card.getAttribute('data-category') === activeCategory;
      var visible = matchesText && matchesCategory;
      card.hidden = !visible;
      if (visible) shown++;
    });
    if (count) count.textContent = 'Showing ' + shown + ' of ' + cards.length + ' calculators';
    if (empty) empty.hidden = shown !== 0;
  }

  if (input) input.addEventListener('input', filter);
  filters.forEach(function (button) {
    button.addEventListener('click', function () {
      activeCategory = button.getAttribute('data-category-filter') || 'all';
      filters.forEach(function (other) {
        var active = other === button;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      filter();
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === '/' && input && document.activeElement !== input && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      event.preventDefault();
      input.focus();
    }
    if (event.key === 'Escape' && input && document.activeElement === input) {
      input.value = '';
      activeCategory = 'all';
      filters.forEach(function (button) {
        var active = button.getAttribute('data-category-filter') === 'all';
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      filter();
      input.blur();
    }
  });


  // Lightweight homepage area and volume calculator.
  var quickForm = document.getElementById('homeQuickForm');
  if (quickForm) {
    var lengthInput = document.getElementById('homeQuickLength');
    var widthInput = document.getElementById('homeQuickWidth');
    var depthInput = document.getElementById('homeQuickDepth');
    var areaOutput = document.getElementById('homeQuickArea');
    var volumeOutput = document.getElementById('homeQuickVolume');
    var quickMessage = document.getElementById('homeQuickMessage');
    var quickMax = 1000000;
    var quickFormat = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 3 });

    function clearQuickResults(message) {
      areaOutput.textContent = '—';
      volumeOutput.textContent = '—';
      quickMessage.textContent = message;
    }

    function validateQuickInput(element, label, optional) {
      var raw = element.value.trim();
      element.removeAttribute('aria-invalid');
      if (!raw && optional) return { value: null, error: '' };
      if (!raw) return { value: null, error: 'Enter a ' + label.toLowerCase() + '.' };
      var value = Number(raw);
      if (!Number.isFinite(value) || value <= 0 || value > quickMax) {
        element.setAttribute('aria-invalid', 'true');
        return { value: null, error: label + ' must be greater than zero and no more than 1,000,000.' };
      }
      return { value: value, error: '' };
    }

    function updateQuickCalculator() {
      var length = validateQuickInput(lengthInput, 'Length', false);
      var width = validateQuickInput(widthInput, 'Width', false);
      var depth = validateQuickInput(depthInput, 'Depth', true);
      var error = length.error || width.error || depth.error;
      if (error) {
        clearQuickResults(error);
        return;
      }
      if (length.value === null || width.value === null) {
        clearQuickResults('Enter length and width to calculate area. Add depth to calculate volume.');
        return;
      }

      var area = length.value * width.value;
      var volume = depth.value === null ? null : area * depth.value / 1000;
      if (!Number.isFinite(area) || (volume !== null && !Number.isFinite(volume))) {
        clearQuickResults('That combination is too large. Check your measurements.');
        return;
      }

      areaOutput.textContent = quickFormat.format(area) + ' m²';
      volumeOutput.textContent = volume === null ? 'Add depth' : quickFormat.format(volume) + ' m³';
      quickMessage.textContent = volume === null
        ? 'Area calculated. Add a depth in millimetres for the volume estimate.'
        : 'Estimate only. For material ordering, use the matching calculator below.';
    }

    [lengthInput, widthInput, depthInput].forEach(function (element) {
      element.addEventListener('input', updateQuickCalculator);
      element.addEventListener('change', updateQuickCalculator);
    });

    var exampleButton = document.getElementById('homeQuickExample');
    if (exampleButton) exampleButton.addEventListener('click', function () {
      lengthInput.value = '4';
      widthInput.value = '3';
      depthInput.value = '100';
      updateQuickCalculator();
      lengthInput.focus();
    });

    var clearButton = document.getElementById('homeQuickClear');
    if (clearButton) clearButton.addEventListener('click', function () {
      lengthInput.value = '';
      widthInput.value = '';
      depthInput.value = '';
      updateQuickCalculator();
      lengthInput.focus();
    });
    updateQuickCalculator();
  }

  filter();
})();
