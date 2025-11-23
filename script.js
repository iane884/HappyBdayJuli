// Core dates

const startAnniversary = new Date(2023, 3, 22);
const correctGateValue = '2023-04-22';

function initAnniversaryGate() {
  const gate = document.getElementById('gate');
  const gateInput = document.getElementById('gate-date');
  const gateButton = document.getElementById('gate-button');
  const gateError = document.getElementById('gate-error');
  const mainContent = document.getElementById('main-content');

  gateButton.addEventListener('click', checkDate);
  gateInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkDate();
  });

  function checkDate() {
    if (!gateInput.value) {
      showError();
      return;
    }

    if (gateInput.value === correctGateValue) {
      gateError.classList.remove('show');
      gate.classList.add('fade-out');
      setTimeout(() => {
        gate.style.display = 'none';
        mainContent.classList.remove('hidden-content');
        mainContent.classList.add('show-content');
      }, 750);
    } else {
      showError();
    }
  }

  function showError() {
    gateError.classList.add('show');
  }
}

function initCounters() {
  const togetherEl = document.getElementById('together-counter');
  const nextEl = document.getElementById('next-counter');

  updateCounters();
  // refresh once an hour to keep days accurate
  setInterval(updateCounters, 60 * 60 * 1000);

  function updateCounters() {
    const now = new Date();
    const together = diffFromStart(startAnniversary, now);
    const nextAnniversary = getNextAnniversary(now);
    const untilNext = diffUntil(now, nextAnniversary);

    togetherEl.textContent = `${together.years} years, ${together.months} months, ${together.days} days`;
    nextEl.textContent = `${untilNext.months} months, ${untilNext.days} days`;
  }
}

function diffFromStart(start, end) {
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthDays = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += prevMonthDays;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

function diffUntil(from, to) {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  let days = to.getDate() - from.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthDays = new Date(to.getFullYear(), to.getMonth(), 0).getDate();
    days += prevMonthDays;
  }

  if (months < 0) months = 0;
  if (days < 0) days = 0;

  return { months, days };
}

function getNextAnniversary(now) {
  let next = new Date(now.getFullYear(), 3, 22); // month is zero-indexed (April = 3)
  if (now > next) {
    next = new Date(now.getFullYear() + 1, 3, 22);
  }
  return next;
}

function initMemoryModal() {
  const cards = document.querySelectorAll('.location-card');
  const modal = document.getElementById('memory-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalGrid = document.getElementById('modal-grid');
  const modalClose = document.getElementById('modal-close');

  const closeModal = () => {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    modalGrid.innerHTML = '';
  };

  const openModal = (card) => {
    const isLocked = card.querySelector('.photo-grid')?.dataset.locked === 'true';
    if (isLocked) return;

    const heading = card.querySelector('h3')?.textContent || 'A special place';
    const photoGrid = card.querySelector('.photo-grid');

    modalTitle.textContent = heading;

    modalDesc.textContent = '';
    modalDesc.style.display = 'none';

    modalGrid.innerHTML = photoGrid
      ? photoGrid.innerHTML
      : '<p>TODO: Add photos for this place.</p>';

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
  };

  cards.forEach((card) => {
    card.addEventListener('click', () => openModal(card));
  });

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeModal();
    }
  });
}


function initBucketList() {
  const inputEl = document.getElementById('bucket-input');
  const addBtn = document.getElementById('bucket-add-button');
  const tabButtons = document.querySelectorAll('.bucket-tab');
  const panels = document.querySelectorAll('.bucket-panel');

  const STORAGE_KEY = 'bucketItems_v2';
  const LEGACY_KEY = 'bucketItems';

  const listsByCategory = {
    do: document.getElementById('bucket-do'),
    go: document.getElementById('bucket-go'),
    eat: document.getElementById('bucket-eat'),
    watch: document.getElementById('bucket-watch')
  };

  let activeCategory = 'do';
  let items = loadItems();
  render();
  updateTabs();

  function loadItems() {
    try {
      // prefer new v2 storage
      const storedV2 = localStorage.getItem(STORAGE_KEY);
      if (storedV2) {
        const parsed = JSON.parse(storedV2);
        if (Array.isArray(parsed)) return parsed;
      }

      // fallback: migrate old single-list storage into "things to do"
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const legacyParsed = JSON.parse(legacy);
        if (Array.isArray(legacyParsed)) {
          return legacyParsed.map((item) => ({
            text: item.text || 'Bucket item',
            done: !!item.done,
            category: 'do'
          }));
        }
      }
    } catch (e) {
      // ignore parse/storage errors
    }

    // seed from existing markup if no storage found
    const seeds = [];
    Object.entries(listsByCategory).forEach(([category, listEl]) => {
      if (!listEl) return;
      listEl.querySelectorAll('li .bucket-text').forEach((el) => {
        seeds.push({
          text: el.textContent || 'Bucket item',
          done: false,
          category
        });
      });
    });

    return seeds;
  }

  function saveItems() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      // ignore storage errors
    }
  }

  function createItemElement(item, index) {
    const li = document.createElement('li');
    li.dataset.index = index;
    li.innerHTML = `
      <label>
        <input type="checkbox" data-action="toggle">
        <span class="bucket-text"></span>
      </label>
      <div class="bucket-actions">
        <button class="bucket-edit" aria-label="Edit item">Edit</button>
        <button class="bucket-delete" aria-label="Delete item">Delete</button>
      </div>
    `;
    const checkbox = li.querySelector('input[type="checkbox"]');
    const textEl = li.querySelector('.bucket-text');
    checkbox.checked = item.done;
    textEl.textContent = item.text;
    if (item.done) li.classList.add('completed');
    return li;
  }

  function render() {
    // clear all lists
    Object.values(listsByCategory).forEach((listEl) => {
      if (listEl) listEl.innerHTML = '';
    });

    // rebuild from items
    items.forEach((item, idx) => {
      const listEl = listsByCategory[item.category] || listsByCategory.do;
      if (!listEl) return;
      listEl.appendChild(createItemElement(item, idx));
    });
  }

  function addItem() {
    const text = inputEl.value.trim();
    if (!text) return;
    items.push({ text, done: false, category: activeCategory });
    saveItems();
    render();
    inputEl.value = '';
  }

  function handleListClick(e) {
    const target = e.target;
    const li = target.closest('li');
    if (!li) return;

    const idx = Number(li.dataset.index);
    const item = items[idx];
    if (!item) return;

    if (target.dataset.action === 'toggle' || target.type === 'checkbox') {
      item.done = !item.done;
      saveItems();
      render();
      return;
    }

    if (target.classList.contains('bucket-delete')) {
      items.splice(idx, 1);
      saveItems();
      render();
      return;
    }

    if (target.classList.contains('bucket-edit')) {
      const nextText = prompt('Edit this item:', item.text);
      if (nextText !== null && nextText.trim() !== '') {
        item.text = nextText.trim();
        saveItems();
        render();
      }
    }
  }

  function updateTabs() {
    tabButtons.forEach((btn) => {
      const cat = btn.dataset.category;
      const isActive = cat === activeCategory;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    panels.forEach((panel) => {
      const cat = panel.dataset.category;
      panel.classList.toggle('active', cat === activeCategory);
    });
  }

  addBtn.addEventListener('click', addItem);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addItem();
  });

  Object.values(listsByCategory).forEach((listEl) => {
    if (listEl) {
      listEl.addEventListener('click', handleListClick);
    }
  });

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const newCategory = btn.dataset.category;
      if (!newCategory || newCategory === activeCategory) return;
      activeCategory = newCategory;
      updateTabs();
    });
  });
}

function initLoveCarousel() {
  const loveText = document.getElementById('love-text');
  const indicator = document.getElementById('love-indicator');
  const prevBtn = document.getElementById('prev-love');
  const nextBtn = document.getElementById('next-love');

  const reasons = [
    "You’re the most caring person I know. You look out for everyone you love.",
    "You’re always down to hang out with me, whether it’s going out and adventuring or staying in and doing nothing (either way we always have fun!)",
    "You are incredibly emotionally intelligent and I always feel safe and heard talking to you about anything.",
    "I love how silly you are - you make me smile and laugh every day, and I love that we have our own sense of humor that we’ve curated together.",
    "You’re sweet, gentle, and affectionate - you always make me feel so loved.",
    "Your energy! You have the best vibes out of anyone I’ve ever met - happy and bright but also warm and cozy.",
    "You are so hardworking and go above and beyond for everything you care about.",
    "You pay attention to me and always make sure that I’m doing okay - it makes me feel so cared about and I’m so lucky!",
    "You send me the most wonderful good morning and good night texts! I love that you’re always the start and end of my day.",
    "You have a strong moral compass and always do the right thing.",
    "You always come up with good ideas for fun things we can do together!",
    "You deal with problems so well - whenever we’re dealing with anything, you’re incredibly mature and always help us get to a solution.",
    "You want a future together - knowing how excited you are about having a family, living together, exploring the world together, etc. makes me so happy.",
    "You’re incredibly thoughtful and observant - you notice things that no one else pays attention to.",
    "You make everyday things like getting groceries or watching TV my favorite parts of the week!",
    "You’re always sharing things with me - life updates, silly tiktoks, tea, music, etc. I love it all.",
    "You’re a great listener - you somehow understand everything I tell you and always know exactly what to say.",
    "You ask such good questions and I genuinely enjoy every single conversation that we have.",
    "You’re so good at balancing seriousness and silliness - no matter what the vibe is, you’re my person.",
    "You’re comfortable being yourself around me - it makes me feel comfortable being myself too.",
    "You’re beautiful! You smell good, you’re sexy and stylish, your features are stunning - the list goes on.",
    "You’re my safe/comfort person and I know that I can trust you with anything."
  ];

  let current = 0;
  render();

  prevBtn.addEventListener('click', () => {
    current = (current - 1 + reasons.length) % reasons.length;
    render();
  });

  nextBtn.addEventListener('click', () => {
    current = (current + 1) % reasons.length;
    render();
  });

  function render() {
    loveText.textContent = reasons[current];
    indicator.textContent = `${current + 1} / ${reasons.length}`;
    triggerFade(loveText);
  }
}

function initCrossword() {
  const gridEl = document.getElementById('crossword-grid');
  const acrossList = document.getElementById('crossword-clues-across');
  const downList = document.getElementById('crossword-clues-down');
  const checkBtn = document.getElementById('crossword-check');
  const messageEl = document.getElementById('crossword-message');

  if (!gridEl || !acrossList || !downList || !checkBtn || !messageEl) return;

  // layout: 15 rows x 20 columns
  const rows = 15;
  const cols = 20;

  // ensure grid columns match this layout
  gridEl.style.display = 'grid';
  gridEl.style.gridTemplateColumns = `repeat(${cols}, 26px)`;
  gridEl.style.gridAutoRows = '26px';

  // word placement
  const words = [
    // -------- across --------
    {
      number: 1,
      answer: 'QUESTIONS',
      clue: 'A deep-conversation-inducing game we play late at night',
      row: 0,
      col: 0,
      direction: 'across'
    },
    {
      number: 3,
      answer: 'SWEETTREAT',
      clue: 'Something we need to have after every meal together',
      row: 2,
      col: 3,
      direction: 'across'
    },
    {
      number: 4,
      answer: 'TOKYO',
      clue: 'Arguably our most highly anticipated vacation spot',
      row: 4,
      col: 3,
      direction: 'across'
    },
    {
      number: 7,
      answer: 'GAMETIMEDECISION',
      clue: '“We’ll cross that bridge when we get to it”',
      row: 6,
      col: 1,
      direction: 'across'
    },
    {
      number: 9,
      answer: 'FLINK',
      clue: '“What the _?”',
      row: 7,
      col: 15,
      direction: 'across'
    },
    {
      number: 10,
      answer: 'MINIGAMES',
      clue: 'A high-stakes competition we hold every day',
      row: 8,
      col: 3,
      direction: 'across'
    },

    // -------- down --------
    {
      number: 2,
      answer: 'ICESKATING',
      clue: 'Our first date',
      row: 0,
      col: 5, // crosses questions
      direction: 'down'
    },
    {
      number: 5,
      answer: 'LAY',
      clue: 'What we do to get cozy after a long day',
      row: 5,
      col: 2,
      direction: 'down'
    },
    {
      number: 6,
      answer: 'COFFEESHOP',
      clue: 'Friday morning destination',
      row: 5,
      col: 15,
      direction: 'down'
    },
    {
      number: 8,
      answer: 'SHAYLA',
      clue: '“My _”',
      row: 6,
      col: 13,
      direction: 'down'
    }
  ];

  // ---------- build grid data ----------
  const gridData = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      letter: null,
      startNumbers: []
    }))
  );

  // inputs at [row][col]
  const cellInputs = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );

  // for word navigation
  const wordCells = []; // wordCells[i] = array of inputs for words[i]
  const cellWordMap = new Map(); // input -> { across: wordIndex|null, down: wordIndex|null }
  const acrossWordIndices = [];
  const downWordIndices = [];

  gridEl.innerHTML = '';
  acrossList.innerHTML = '';
  downList.innerHTML = '';

  // first pass: fill gridData + clue lists
  words.forEach((word) => {
    const clean = word.answer.toUpperCase();
    const { row, col, direction, number } = word;

    for (let i = 0; i < clean.length; i++) {
      const r = direction === 'down' ? row + i : row;
      const c = direction === 'across' ? col + i : col;
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;

      const cell = gridData[r][c];

      if (!cell.letter) {
        cell.letter = clean[i];
      }

      if (i === 0) {
        cell.startNumbers.push(number);
      }
    }

    const li = document.createElement('li');
    li.textContent = word.clue;
    li.value = word.number; // show 1,3,4,7,9,10 / 2,5,6,8

    if (direction === 'across') {
      acrossList.appendChild(li);
    } else {
      downList.appendChild(li);
    }
  });

  // ---------- render grid ----------
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const data = gridData[r][c];
      const square = document.createElement('div');
      square.className = 'crossword-square';

      if (!data.letter) {
        square.classList.add('empty');
      } else {
        if (data.startNumbers.length > 0) {
          const startNumber = Math.min(...data.startNumbers);
          square.dataset.number = String(startNumber);
        }

        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.className = 'crossword-cell';
        input.dataset.expected = data.letter;
        input.dataset.row = String(r);
        input.dataset.col = String(c);

        square.appendChild(input);
        cellInputs[r][c] = input;
      }

      gridEl.appendChild(square);
    }
  }

  // ---------- index word cells; map inputs->words ----------
  words.forEach((word, wi) => {
    const clean = word.answer.toUpperCase();
    const { row, col, direction } = word;

    if (direction === 'across') {
      acrossWordIndices.push(wi);
    } else {
      downWordIndices.push(wi);
    }

    const cells = [];
    for (let i = 0; i < clean.length; i++) {
      const r = direction === 'down' ? row + i : row;
      const c = direction === 'across' ? col + i : col;
      const input = cellInputs[r][c];
      if (!input) continue;

      cells.push(input);

      let entry = cellWordMap.get(input);
      if (!entry) entry = { across: null, down: null };
      if (direction === 'across') {
        entry.across = wi;
      } else {
        entry.down = wi;
      }
      cellWordMap.set(input, entry);
    }
    wordCells[wi] = cells;
  });

  // ---------- typing direction + nav ----------
  let currentDirection = 'across'; // 'across' or 'down'
  let activeCell = null;

  function inferDirection(input) {
    const entry = cellWordMap.get(input);
    if (!entry) return;

    if (entry.across != null && entry.down == null) {
      currentDirection = 'across';
    } else if (entry.down != null && entry.across == null) {
      currentDirection = 'down';
    }
    // if both exist, keep currentDirection as-is (intersection cell)
  }

  function toggleDirection() {
    currentDirection = currentDirection === 'across' ? 'down' : 'across';
    if (activeCell) {
      messageEl.textContent =
        currentDirection === 'across'
          ? 'Typing horizontally.'
          : 'Typing vertically.';
    }
  }

  function moveToNextCell(fromInput) {
    if (!fromInput) return;

    let r = Number(fromInput.dataset.row);
    let c = Number(fromInput.dataset.col);

    while (true) {
      if (currentDirection === 'across') {
        c += 1;
      } else {
        r += 1;
      }

      if (r < 0 || r >= rows || c < 0 || c >= cols) {
        return;
      }

      const next = cellInputs[r][c];

      if (!next) continue; // skip non-letter squares

      if (next.value && next.value.trim() !== '') {
        continue; // skip already-filled cells
      }

      next.focus();
      return;
    }
  }

  function moveWithArrow(fromInput, dx, dy) {
    const r = Number(fromInput.dataset.row);
    const c = Number(fromInput.dataset.col);
    const nr = r + dy;
    const nc = c + dx;
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return;
    const next = cellInputs[nr][nc];
    if (next) {
      next.focus();
    }
  }

  // backspace: delete backwards through current word in current mode
  function backspaceStep(input) {
    if (!input) return;

    let r = Number(input.dataset.row);
    let c = Number(input.dataset.col);

    // if this cell has a letter, clear it and stay
    if (input.value && input.value.trim() !== '') {
      input.value = '';
      input.classList.remove('correct', 'incorrect');
      return;
    }

    // else move to previous cell in current direction and clear there
    let pr = r;
    let pc = c;

    if (currentDirection === 'across') {
      pc = c - 1;
    } else {
      pr = r - 1;
    }

    if (pr < 0 || pr >= rows || pc < 0 || pc >= cols) return;

    const prev = cellInputs[pr][pc];
    if (!prev) return; // hit a blank / non-letter

    prev.focus();
    if (prev.value && prev.value.trim() !== '') {
      prev.value = '';
      prev.classList.remove('correct', 'incorrect');
    }
  }

  // jump to next word (across or down) when tab/enter is pressed
    // jump to next word (across or down) when tab/enter is pressed
  function jumpToNextWord(fromInput) {
    if (!fromInput) return;

    const entry = cellWordMap.get(fromInput);
    const isAcrossMode = currentDirection === 'across';

    const indicesList = isAcrossMode ? acrossWordIndices : downWordIndices;
    if (indicesList.length === 0) return;

    let currentWordIndex = null;
    if (entry) {
      currentWordIndex = isAcrossMode ? entry.across : entry.down;
    }

    let targetWordIndex;
    const currentPos =
      currentWordIndex != null ? indicesList.indexOf(currentWordIndex) : -1;

    if (currentPos === -1) {
      targetWordIndex = indicesList[0];
    } else {
      const nextPos = (currentPos + 1) % indicesList.length;
      targetWordIndex = indicesList[nextPos];
    }

    const cells = wordCells[targetWordIndex];
    if (cells && cells.length > 0) {
      // prefer the first empty cell in the word; if all filled, go to the first cell
      let targetCell = cells.find(
        (cell) => !cell.value || cell.value.trim() === ''
      );
      if (!targetCell) {
        targetCell = cells[0];
      }
      targetCell.focus();
    }
  }


  const allInputs = Array.from(gridEl.querySelectorAll('.crossword-cell'));

  allInputs.forEach((input) => {
    input.addEventListener('focus', () => {
      activeCell = input;
      inferDirection(input);
    });

    input.addEventListener('input', (e) => {
      input.value = input.value.toUpperCase();
      input.classList.remove('correct', 'incorrect');
      messageEl.textContent = 'Keep going!';

      const isDelete =
        e.inputType && e.inputType.startsWith('delete');

      // only auto-move when adding a character, not deleting
      if (!isDelete && input.value.trim() !== '') {
        moveToNextCell(input);
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        backspaceStep(input);
      } else if (e.key === ' ') {
        // space toggles across/down mode
        e.preventDefault();
        toggleDirection();
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        // jump to next word in current mode
        e.preventDefault();
        jumpToNextWord(input);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        currentDirection = 'across';
        moveWithArrow(input, 1, 0);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        currentDirection = 'across';
        moveWithArrow(input, -1, 0);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentDirection = 'down';
        moveWithArrow(input, 0, 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentDirection = 'down';
        moveWithArrow(input, 0, -1);
      }
    });
  });

  // ---------- check puzzle ----------
  checkBtn.addEventListener('click', () => {
    let allFilled = true;
    let allCorrect = true;

    allInputs.forEach((input) => {
      const expected = input.dataset.expected;
      const value = (input.value || '').toUpperCase();

      if (!value) {
        allFilled = false;
        allCorrect = false;
        input.classList.remove('correct', 'incorrect');
        return;
      }

      if (value === expected) {
        input.classList.add('correct');
        input.classList.remove('incorrect');
      } else {
        input.classList.add('incorrect');
        input.classList.remove('correct');
        allCorrect = false;
      }
    });

    if (allCorrect && allFilled) {
      messageEl.textContent = 'WOOOOOO you solved it!';
    } else if (!allFilled) {
      messageEl.textContent =
        'Some squares are still empty — try again!';
    } else {
      messageEl.textContent =
        'Close! The red squares need a tweak.';
    }
  });
}






function triggerFade(element) {
  element.classList.remove('fade-in');
  void element.offsetWidth; // restart animation
  element.classList.add('fade-in');
}

window.onload = () => {
  initAnniversaryGate();
  initCounters();
  initMemoryModal();
  initBucketList();
  initLoveCarousel();
  initCrossword();
  document.getElementById('current-year').textContent = new Date().getFullYear();
};

