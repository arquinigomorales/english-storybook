const BOOK_URL = 'books/the-ugly-duckling/book.json';

let book;
let currentPage = 0;

const els = {
  title: document.querySelector('#book-title'),
  level: document.querySelector('#book-level'),
  pageImage: document.querySelector('#page-image'),
  imagePlaceholder: document.querySelector('#image-placeholder'),
  pageNumber: document.querySelector('#page-number'),
  pageHeading: document.querySelector('#page-heading'),
  pageText: document.querySelector('#page-text'),
  prev: document.querySelector('#prev-btn'),
  next: document.querySelector('#next-btn'),
  progress: document.querySelector('#progress'),
  backdrop: document.querySelector('#word-backdrop'),
  close: document.querySelector('#word-close'),
  wordType: document.querySelector('#word-type'),
  wordTitle: document.querySelector('#word-title'),
  wordTranslation: document.querySelector('#word-translation'),
  wordContext: document.querySelector('#word-context')
};

async function init() {
  const response = await fetch(BOOK_URL);
  book = await response.json();

  els.title.textContent = book.title;
  els.level.textContent = book.level;
  renderPage();
}

function renderPage() {
  const page = book.pages[currentPage];
  els.pageHeading.textContent = page.heading;
  els.pageNumber.textContent = currentPage === 0 ? 'Cover' : `Page ${currentPage}`;
  els.progress.textContent = `${currentPage + 1} / ${book.pages.length}`;

  els.pageText.innerHTML = page.paragraphs.map(p => `<p>${convertVocabularyTags(p)}</p>`).join('');

  els.pageImage.style.display = 'block';
  els.imagePlaceholder.style.display = 'none';
  els.pageImage.src = page.image;
  els.pageImage.alt = `${book.title} — ${page.heading}`;

  els.pageImage.onerror = () => {
    els.pageImage.style.display = 'none';
    els.imagePlaceholder.style.display = 'grid';
    els.imagePlaceholder.textContent = `${page.heading} — illustration coming soon`;
  };

  els.prev.disabled = currentPage === 0;
  els.next.disabled = currentPage === book.pages.length - 1;

  document.querySelectorAll('.vocab').forEach(btn => {
    btn.addEventListener('click', () => openVocabulary(btn.dataset.key));
  });
}

function convertVocabularyTags(text) {
  return text.replace(/<v data-key="([^"]+)">([^<]+)<\/v>/g,
    '<button class="vocab" type="button" data-key="$1">$2</button>');
}

function openVocabulary(key) {
  const item = book.vocabulary[key];
  if (!item) return;

  els.wordType.textContent = item.type;
  els.wordTitle.textContent = item.term;
  els.wordTranslation.textContent = item.translation;
  els.wordContext.textContent = item.context;
  els.backdrop.hidden = false;
}

function closeVocabulary() {
  els.backdrop.hidden = true;
}

els.prev.addEventListener('click', () => {
  if (currentPage > 0) {
    currentPage -= 1;
    renderPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

els.next.addEventListener('click', () => {
  if (currentPage < book.pages.length - 1) {
    currentPage += 1;
    renderPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

els.close.addEventListener('click', closeVocabulary);
els.backdrop.addEventListener('click', e => {
  if (e.target === els.backdrop) closeVocabulary();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeVocabulary();
  if (e.key === 'ArrowRight' && !els.next.disabled) els.next.click();
  if (e.key === 'ArrowLeft' && !els.prev.disabled) els.prev.click();
});

init().catch(error => {
  console.error(error);
  els.title.textContent = 'English Storybook';
  els.pageHeading.textContent = 'Could not load the book';
  els.pageText.innerHTML = '<p>Check that the project is being served from a web server or GitHub Pages.</p>';
});
