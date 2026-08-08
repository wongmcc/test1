(function(){
  // Don't redefine if already present
  if (window.__bankFilterInstalled) return;
  window.__bankFilterInstalled = true;

  function buildQuestionBank() {
    const container = document.getElementById('bank-year-containers');
    if (!container) return;

    // Group RAW_DATA by year
    const byYear = {};
    RAW_DATA.forEach(item => {
      const year = item.year;
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(item);
    });

    // Sort years descending
    const years = Object.keys(byYear).map(Number).sort((a,b)=>b-a);

    // Clear existing (if any)
    container.innerHTML = '';

    years.forEach(year => {
      const yearWrapper = document.createElement('div');
      yearWrapper.className = 'bank-year bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 shadow-xl';

      // Year header
      const header = document.createElement('div');
      header.className = 'flex items-center justify-between mb-4';
      header.innerHTML = `
        <h3 class="text-sm font-bold text-slate-100">${year}</h3>
        <button class="text-xs text-slate-400 hover:text-slate-200" type="button" data-toggle-year="${year}">Toggle</button>
      `;
      yearWrapper.appendChild(header);

      // Sets container for this year
      const setsContainer = document.createElement('div');
      setsContainer.className = 'space-y-3 bank-sets';

      // For each set in that year
      byYear[year].forEach(setItem => {
        const setEl = document.createElement('div');
        setEl.className = 'bank-set p-3 rounded-xl bg-slate-900/60 border border-slate-800';

        // Set header: set label + topic
        const setHeader = document.createElement('div');
        setHeader.className = 'flex items-baseline justify-between mb-2';
        setHeader.innerHTML = `
          <div class="flex items-baseline space-x-3">
            <span class="text-[13px] font-semibold text-slate-300 bank-set-label">${escapeHtml(setItem.set)}</span>
            <span class="text-xs text-slate-400 bank-set-topic">${escapeHtml(setItem.topic)}</span>
          </div>
        `;
        setEl.appendChild(setHeader);

        // Questions list (use same text classes so styles match)
        const ul = document.createElement('ul');
        ul.className = 'bank-questions list-decimal list-inside space-y-1 pl-3';
        setItem.questions.forEach(q => {
          const li = document.createElement('li');
          li.className = 'bank-question text-sm text-slate-200';
          li.textContent = q;
          ul.appendChild(li);
        });

        setEl.appendChild(ul);
        setsContainer.appendChild(setEl);
      });

      yearWrapper.appendChild(setsContainer);
      container.appendChild(yearWrapper);
    });

    // Hook up toggles (collapsing years)
    container.querySelectorAll('[data-toggle-year]').forEach(btn => {
      btn.addEventListener('click', () => {
        const wrapper = btn.closest('.bank-year');
        if (!wrapper) return;
        wrapper.querySelector('.bank-sets').classList.toggle('hidden');
      });
    });

    // Initialize count
    updateBankCount();
  }

  function escapeHtml(str){
    return str?.toString?.().replace?.(/[&<>"']/g, s => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[s])) || str;
  }

  function updateBankCount() {
    const badge = document.getElementById('bank-count-badge');
    if (!badge) return;
    const visibleQuestions = document.querySelectorAll('.bank-question:not(.hidden)').length;
    badge.textContent = `Showing: ${visibleQuestions} Questions`;
  }

  // Exposed function used by input onkeyup attribute and selects
  window.filterQuestionBank = function() {
    const input = document.getElementById('bank-search-input');
    const yearSelect = document.getElementById('bank-year-select');
    const levelSelect = document.getElementById('bank-level-select');

    const term = (input && input.value || '').trim().toLowerCase();
    const yearFilter = (yearSelect && yearSelect.value) || 'ALL';
    const levelFilter = (levelSelect && levelSelect.value) || 'ALL';

    // Iterate sets
    document.querySelectorAll('.bank-set').forEach(setEl => {
      // Year filter: hide entire set if year doesn't match
      const parentYearEl = setEl.closest('.bank-year');
      if (yearFilter !== 'ALL' && parentYearEl) {
        const yearText = parentYearEl.querySelector('h3')?.textContent?.trim();
        if (yearText && yearText !== yearFilter) {
          setEl.classList.add('hidden');
          setEl.querySelectorAll('.bank-question').forEach(q=>q.classList.add('hidden'));
          return;
        } else {
          setEl.classList.remove('hidden');
        }
      } else {
        setEl.classList.remove('hidden');
      }

      // Level filter stub: RAW_DATA does not include per-question level in current dataset.
      // If you later add level metadata to RAW_DATA, use it here to hide non-matching sets/questions.

      // Show/hide individual questions based on search term
      const questionEls = Array.from(setEl.querySelectorAll('.bank-question'));
      if (!term) {
        questionEls.forEach(q=> q.classList.remove('hidden'));
      } else {
        let anyVisible = false;
        questionEls.forEach(q => {
          const txt = (q.textContent || '').toLowerCase();
          const match = txt.includes(term);
          q.classList.toggle('hidden', !match);
          if (match) anyVisible = true;
        });

        // If no questions match in this set, hide the set wrapper
        setEl.classList.toggle('hidden', !anyVisible);
      }
    });

    // Hide years with no visible questions
    document.querySelectorAll('.bank-year').forEach(yearEl => {
      const anyVisibleInside = yearEl.querySelectorAll('.bank-question:not(.hidden)').length > 0;
      yearEl.classList.toggle('hidden', !anyVisibleInside);
    });

    updateBankCount();
  };

  // Debounce helper (used for input event listener)
  function debounce(fn, ms = 150){
    let t;
    return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), ms); };
  }

  document.addEventListener('DOMContentLoaded', () => {
    buildQuestionBank();

    // wire search input to filter (debounced)
    const input = document.getElementById('bank-search-input');
    if (input) {
      // keep onkeyup attribute compatibility: also attach input listener
      input.addEventListener('input', debounce(() => {
        if (typeof window.filterQuestionBank === 'function') window.filterQuestionBank();
      }, 120));
    }

    // wire selects
    const yearSelect = document.getElementById('bank-year-select');
    if (yearSelect) yearSelect.addEventListener('change', window.filterQuestionBank);
    const levelSelect = document.getElementById('bank-level-select');
    if (levelSelect) levelSelect.addEventListener('change', window.filterQuestionBank);
  });
})();
