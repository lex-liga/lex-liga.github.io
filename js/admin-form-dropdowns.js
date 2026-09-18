/* Convert group/category text fields to dropdowns if still present as inputs */
(function () {
  function replaceWithSelect(id, options, labelText) {
    var el = document.getElementById(id);
    if (!el || el.tagName === 'SELECT') return;
    var sel = document.createElement('select');
    sel.id = id;
    sel.className = el.className;
    options.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      sel.appendChild(opt);
    });
    var label = el.previousElementSibling;
    if (label && labelText) label.textContent = labelText;
    el.parentNode.replaceChild(sel, el);
  }
  function run() {
    replaceWithSelect('newGroup', [
      { value: 'Group A', label: 'Group A' },
      { value: 'Group B', label: 'Group B' },
      { value: 'Quarter-finals', label: 'Quarter-finals' },
      { value: 'Semi-finals', label: 'Semi-finals' },
      { value: 'Final', label: 'Final' }
    ], 'Group / Stage');
    replaceWithSelect('bmCategory', [
      { value: 'MS · R1', label: "Men's Singles" },
      { value: 'MD · R1', label: "Men's Doubles" },
      { value: 'WS · R1', label: "Women's Singles" },
      { value: 'WD · R1', label: "Women's Doubles" },
      { value: 'XD · R1', label: 'Mixed Doubles' }
    ], 'Category');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  setTimeout(run, 500);
  setTimeout(run, 1500);
})();
