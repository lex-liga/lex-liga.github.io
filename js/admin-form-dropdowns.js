/* Lex Liga – admin form dropdowns */
(function () {
  function setSelectOptions(id, options, labelText) {
    var el = document.getElementById(id);

    if (!el) return;

    var sel;

    if (el.tagName === 'SELECT') {
      sel = el;
    } else {
      sel = document.createElement('select');
      sel.id = id;
      sel.className = el.className;

      var label = el.previousElementSibling;
      if (label && labelText) {
        label.textContent = labelText;
      }

      el.parentNode.replaceChild(sel, el);
    }

    var currentValue = sel.value;

    sel.innerHTML = '';

    options.forEach(function (o) {
      var opt = document.createElement('option');

      opt.value = o.value;
      opt.textContent = o.label;

      sel.appendChild(opt);
    });

    var matchingOption = Array.from(sel.options).find(function (opt) {
      return opt.value === currentValue;
    });

    if (matchingOption) {
      sel.value = currentValue;
    }
  }

  function run() {
    setSelectOptions(
      'newGroup',
      [
        { value: 'Group A', label: 'Group A' },
        { value: 'Group B', label: 'Group B' },
        { value: 'Group C', label: 'Group C' },
        { value: 'Group D', label: 'Group D' },
        { value: 'Group E', label: 'Group E' },
        { value: 'Quarter-finals', label: 'Quarter-finals' },
        { value: 'Semi-finals', label: 'Semi-finals' },
        { value: 'Final', label: 'Final' }
      ],
      'Group / Stage'
    );

    setSelectOptions(
      'bmCategory',
      [
        { value: 'MS · R1', label: "Men's Singles" },
        { value: 'MD · R1', label: "Men's Doubles" },
        { value: 'WS · R1', label: "Women's Singles" },
        { value: 'WD · R1', label: "Women's Doubles" },
        { value: 'XD · R1', label: 'Mixed Doubles' }
      ],
      'Category'
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  setTimeout(run, 500);
  setTimeout(run, 1500);
})();
