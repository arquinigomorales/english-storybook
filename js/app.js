
const BOOK_URL = "books/the-ugly-duckling/book.json";

const els = {
  bookTitle: document.getElementById("book-title"),
  levelBadge: document.getElementById("level-badge"),
  pageImage: document.getElementById("page-image"),
  pageNumber: document.getElementById("page-number"),
  pageCounter: document.getElementById("page-counter"),
  pageTitle: document.getElementById("page-title"),
  pageContent: document.getElementById("page-content"),
  prevBtn: document.getElementById("prev-btn"),
  nextBtn: document.getElementById("next-btn"),
  popup: document.getElementById("vocab-popup"),
  backdrop: document.getElementById("vocab-backdrop"),
  popupClose: document.getElementById("popup-close"),
  popupWord: document.getElementById("popup-word"),
  popupType: document.getElementById("popup-type"),
  popupTranslation: document.getElementById("popup-translation"),
  popupContextWrap: document.getElementById("popup-context-wrap"),
  popupContext: document.getElementById("popup-context"),
  storyPanel: document.querySelector(".story-panel"),
};

let book;
let currentPage = 0;
let closeTimer;

function vocabSpan(item) {
  const span = document.createElement("span");
  span.className = "vocab";
  span.textContent = item.text;
  span.tabIndex = 0;
  span.setAttribute("role", "button");
  span.addEventListener("click", () => openVocab(item));
  span.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openVocab(item);
    }
  });
  return span;
}

function renderSegments(paragraph, container) {
  const p = document.createElement("p");

  paragraph.forEach(item => {
    if (item.type === "vocab") {
      p.appendChild(vocabSpan(item));
    } else {
      p.appendChild(document.createTextNode(item.text));
    }
  });

  container.appendChild(p);
}


function ensureReadingAffordances() {
  if (!els.storyPanel) return;

  if (!els.storyPanel.querySelector(".story-grabber")) {
    const grabber = document.createElement("div");
    grabber.className = "story-grabber";
    grabber.setAttribute("aria-hidden", "true");
    els.storyPanel.prepend(grabber);
  }

  if (!document.querySelector(".more-indicator")) {
    const more = document.createElement("div");
    more.className = "more-indicator";
    more.setAttribute("aria-hidden", "true");
    more.innerHTML = '<span class="arrow">↓</span><span>More</span>';
    document.querySelector(".reader-card").appendChild(more);
  }
}

function updateMoreIndicator() {
  if (!els.storyPanel) return;
  const more = document.querySelector(".more-indicator");
  if (!more) return;

  const remaining = els.storyPanel.scrollHeight - els.storyPanel.scrollTop - els.storyPanel.clientHeight;
  const hasOverflow = els.storyPanel.scrollHeight > els.storyPanel.clientHeight + 8;
  const hasMore = hasOverflow && remaining > 12;

  els.storyPanel.classList.toggle("has-more", hasMore);
  more.classList.toggle("show", hasMore);
}

function scheduleMoreIndicatorUpdate() {
  requestAnimationFrame(() => {
    requestAnimationFrame(updateMoreIndicator);
  });
}

function renderPage(index) {
  const page = book.pages[index];
  currentPage = index;

  els.bookTitle.textContent = book.title;
  els.levelBadge.textContent = book.level;

  els.pageImage.src = `books/the-ugly-duckling/images/${page.image}`;
  els.pageImage.alt = page.alt || page.title;

  els.pageNumber.textContent = page.label || `Page ${index}`;
  els.pageCounter.textContent = `${index + 1} / ${book.pages.length}`;
  els.pageTitle.textContent = page.title || "";
  els.pageContent.innerHTML = "";

  page.paragraphs.forEach(paragraph => renderSegments(paragraph, els.pageContent));

  els.prevBtn.disabled = index === 0;
  els.nextBtn.disabled = index === book.pages.length - 1;
  els.nextBtn.textContent = index === book.pages.length - 1 ? "The End" : "Next →";

  els.pageContent.scrollTop = 0;
  document.querySelector(".story-panel").scrollTop = 0;
  ensureReadingAffordances();
  setupInteractiveGrabber();
  if (isMobileSheet()) setSheetState(sheetState, false);
  scheduleMoreIndicatorUpdate();
  closeVocab();
}

function openVocab(item) {
  clearTimeout(closeTimer);

  els.popupWord.textContent = item.text;
  els.popupType.textContent = item.partOfSpeech || "";
  els.popupTranslation.textContent = item.translation || "";

  if (item.context) {
    els.popupContextWrap.hidden = false;
    els.popupContext.textContent = item.context;
  } else {
    els.popupContextWrap.hidden = true;
  }

  els.backdrop.hidden = false;

  requestAnimationFrame(() => {
    els.backdrop.classList.add("show");
    els.popup.classList.add("show");
    els.popup.setAttribute("aria-hidden", "false");
  });
}

function closeVocab() {
  els.backdrop.classList.remove("show");
  els.popup.classList.remove("show");
  els.popup.setAttribute("aria-hidden", "true");

  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    els.backdrop.hidden = true;
  }, 240);
}

els.prevBtn.addEventListener("click", () => {
  if (currentPage > 0) renderPage(currentPage - 1);
});

els.nextBtn.addEventListener("click", () => {
  if (currentPage < book.pages.length - 1) renderPage(currentPage + 1);
});

els.popupClose.addEventListener("click", closeVocab);
els.backdrop.addEventListener("click", closeVocab);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeVocab();
  if (e.key === "ArrowRight" && currentPage < book.pages.length - 1) renderPage(currentPage + 1);
  if (e.key === "ArrowLeft" && currentPage > 0) renderPage(currentPage - 1);
});


if (els.storyPanel) {
  els.storyPanel.addEventListener("scroll", updateMoreIndicator, { passive: true });
}

window.addEventListener("resize", () => {
  if (isMobileSheet()) {
    setSheetState(sheetState, false);
  } else if (els.storyPanel) {
    els.storyPanel.removeAttribute("data-sheet-state");
    els.storyPanel.style.removeProperty("height");
    els.storyPanel.style.removeProperty("max-height");
  }
  scheduleMoreIndicatorUpdate();
});


let sheetState = "middle";
let dragStartY = 0;
let dragStartHeight = 0;
let isDraggingSheet = false;
let sheetHintTimer;

function isMobileSheet() {
  return window.matchMedia("(max-width: 760px)").matches;
}

function getSheetHeights() {
  const card = document.querySelector(".reader-card");
  const cardHeight = card ? card.clientHeight : window.innerHeight;
  return {
    collapsed: Math.max(128, cardHeight * 0.22),
    middle: Math.max(250, cardHeight * 0.64),
    expanded: Math.max(320, cardHeight * 0.86)
  };
}

function showSheetHint(label) {
  if (!els.storyPanel || !isMobileSheet()) return;

  let hint = els.storyPanel.querySelector(".sheet-state-hint");
  if (!hint) {
    hint = document.createElement("div");
    hint.className = "sheet-state-hint";
    els.storyPanel.appendChild(hint);
  }

  hint.textContent = label;
  hint.classList.add("show");

  clearTimeout(sheetHintTimer);
  sheetHintTimer = setTimeout(() => {
    hint.classList.remove("show");
  }, 700);
}

function setSheetState(state, showHint = false) {
  if (!els.storyPanel) return;

  sheetState = state;
  els.storyPanel.dataset.sheetState = state;
  els.storyPanel.style.removeProperty("height");
  els.storyPanel.style.removeProperty("--sheet-translate");

  if (showHint) {
    const labels = {
      collapsed: "Image",
      middle: "Reading",
      expanded: "More text"
    };
    showSheetHint(labels[state] || "");
  }

  scheduleMoreIndicatorUpdate();
}

function closestSheetState(currentHeight) {
  const heights = getSheetHeights();
  return Object.entries(heights)
    .sort((a, b) => Math.abs(a[1] - currentHeight) - Math.abs(b[1] - currentHeight))[0][0];
}

function setupInteractiveGrabber() {
  if (!els.storyPanel) return;
  ensureReadingAffordances();

  const grabber = els.storyPanel.querySelector(".story-grabber");
  if (!grabber || grabber.dataset.interactive === "true") return;

  grabber.dataset.interactive = "true";
  grabber.setAttribute("role", "button");
  grabber.setAttribute("aria-label", "Drag to resize the story panel");
  grabber.tabIndex = 0;

  const startDrag = (clientY) => {
    if (!isMobileSheet()) return;

    isDraggingSheet = true;
    dragStartY = clientY;
    dragStartHeight = els.storyPanel.getBoundingClientRect().height;

    els.storyPanel.classList.add("dragging");
    document.body.classList.add("sheet-dragging");
  };

  const moveDrag = (clientY) => {
    if (!isDraggingSheet || !isMobileSheet()) return;

    const dy = clientY - dragStartY;
    const heights = getSheetHeights();
    const minHeight = heights.collapsed;
    const maxHeight = heights.expanded;

    let nextHeight = dragStartHeight - dy;
    nextHeight = Math.max(minHeight, Math.min(maxHeight, nextHeight));

    els.storyPanel.style.maxHeight = "none";
    els.storyPanel.style.height = `${nextHeight}px`;
  };

  const endDrag = () => {
    if (!isDraggingSheet) return;

    isDraggingSheet = false;
    els.storyPanel.classList.remove("dragging");
    document.body.classList.remove("sheet-dragging");

    const currentHeight = els.storyPanel.getBoundingClientRect().height;
    const targetState = closestSheetState(currentHeight);

    els.storyPanel.style.removeProperty("height");
    els.storyPanel.style.removeProperty("max-height");

    requestAnimationFrame(() => setSheetState(targetState, true));
  };

  grabber.addEventListener("pointerdown", (e) => {
    if (!isMobileSheet()) return;
    e.preventDefault();
    grabber.setPointerCapture?.(e.pointerId);
    startDrag(e.clientY);
  });

  grabber.addEventListener("pointermove", (e) => {
    if (!isDraggingSheet) return;
    e.preventDefault();
    moveDrag(e.clientY);
  });

  grabber.addEventListener("pointerup", (e) => {
    if (!isDraggingSheet) return;
    e.preventDefault();
    endDrag();
  });

  grabber.addEventListener("pointercancel", endDrag);

  // Tap cycles through the 3 useful states.
  grabber.addEventListener("click", () => {
    if (!isMobileSheet() || isDraggingSheet) return;
    const next = {
      collapsed: "middle",
      middle: "expanded",
      expanded: "collapsed"
    }[sheetState] || "middle";
    setSheetState(next, true);
  });

  // Keyboard accessibility
  grabber.addEventListener("keydown", (e) => {
    if (!isMobileSheet()) return;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = sheetState === "collapsed" ? "middle" : "expanded";
      setSheetState(next, true);
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = sheetState === "expanded" ? "middle" : "collapsed";
      setSheetState(next, true);
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const next = {
        collapsed: "middle",
        middle: "expanded",
        expanded: "collapsed"
      }[sheetState] || "middle";
      setSheetState(next, true);
    }
  });
}

async function init() {
  const response = await fetch(BOOK_URL);
  book = await response.json();
  renderPage(0);
}

init().catch(err => {
  console.error(err);
  els.pageContent.innerHTML = "<p>Could not load the story.</p>";
});
