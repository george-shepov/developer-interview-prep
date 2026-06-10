const BUILT_IN_DECK = {
  schemaVersion: 1,
  id: "built-in",
  name: "Developer Interview Prep",
  description: "Built-in SQL, .NET, JavaScript, and behavioral interview questions.",
  questions: window.INTERVIEW_DATA.map(q => ({ ...q }))
};

const state = {
  category: "All",
  keyword: "",
  search: "",
  bookmarksOnly: false,
  selectedId: null,
  activeDeckId: localStorage.getItem("interviewActiveDeck") || "built-in",
  customDecks: JSON.parse(localStorage.getItem("interviewCustomDecks") || "[]"),
  bookmarks: new Set(JSON.parse(localStorage.getItem("interviewBookmarks") || "[]")),
  notes: JSON.parse(localStorage.getItem("interviewNotes") || "{}")
};

const el = id => document.getElementById(id);
let data = [];

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function slugify(value) {
  return String(value || "deck")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "deck";
}

function allDecks() {
  return [BUILT_IN_DECK, ...state.customDecks];
}

function activeDeck() {
  return allDecks().find(deck => deck.id === state.activeDeckId) || BUILT_IN_DECK;
}

function activateDeck(deckId, preferredQuestionId = null) {
  const deck = allDecks().find(item => item.id === deckId) || BUILT_IN_DECK;
  state.activeDeckId = deck.id;
  localStorage.setItem("interviewActiveDeck", deck.id);
  data = deck.questions.map(q => ({ ...q }));
  state.category = "All";
  state.keyword = "";
  state.search = "";
  state.bookmarksOnly = false;
  el("searchInput").value = "";
  renderDeckSelect();
  renderAll();
  const target = data.find(q => q.id === preferredQuestionId)?.id || data[0]?.id;
  if (target) selectQuestion(target);
  else {
    state.selectedId = null;
    el("answerCard").classList.add("hidden");
    el("emptyState").classList.remove("hidden");
  }
}

function saveCustomDecks() {
  localStorage.setItem("interviewCustomDecks", JSON.stringify(state.customDecks));
}

function validateQuestion(question, index) {
  const required = ["id", "category", "subcategory", "title", "short", "answer"];
  for (const field of required) {
    if (typeof question?.[field] !== "string" || !question[field].trim()) {
      throw new Error(`Question ${index + 1} is missing a valid “${field}” value.`);
    }
  }
  if (!Array.isArray(question.keywords)) {
    throw new Error(`Question ${index + 1} must have a keywords array.`);
  }
  return {
    id: question.id.trim(),
    category: question.category.trim(),
    subcategory: question.subcategory.trim(),
    title: question.title.trim(),
    keywords: question.keywords.map(String).map(k => k.trim()).filter(Boolean),
    short: question.short.trim(),
    answer: question.answer.trim()
  };
}

function normalizeImportedDeck(raw, fileName) {
  const source = Array.isArray(raw) ? { questions: raw } : raw;
  if (!source || !Array.isArray(source.questions)) {
    throw new Error("The JSON must be either an array of questions or an object containing a questions array.");
  }

  const questions = source.questions.map(validateQuestion);
  const ids = new Set();
  for (const question of questions) {
    if (ids.has(question.id)) throw new Error(`Duplicate question id: ${question.id}`);
    ids.add(question.id);
  }

  const fallbackName = fileName.replace(/\.json$/i, "") || "Imported Deck";
  const name = String(source.name || fallbackName).trim();
  const id = slugify(source.id || name) + "-" + Date.now().toString(36);

  return {
    schemaVersion: 1,
    id,
    name,
    description: String(source.description || "Imported question deck").trim(),
    importedAt: new Date().toISOString(),
    questions
  };
}

function downloadJson(fileName, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderDeckSelect() {
  const select = el("deckSelect");
  select.innerHTML = allDecks().map(deck =>
    `<option value="${escapeHtml(deck.id)}" ${deck.id === state.activeDeckId ? "selected" : ""}>${escapeHtml(deck.name)} (${deck.questions.length})</option>`
  ).join("");
  el("deleteDeckBtn").disabled = state.activeDeckId === "built-in";
}

function formatAnswer(text) {
  const lines = text.trim().split("\n");
  let html = "", inList = false, listType = "ul";
  const closeList = () => { if (inList) { html += `</${listType}>`; inList = false; } };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { closeList(); continue; }

    const numbered = line.match(/^(\d+)\.\s+(.*)$/);
    if (numbered) {
      if (!inList || listType !== "ol") { closeList(); inList = true; listType = "ol"; html += "<ol>"; }
      html += `<li>${escapeHtml(numbered[2])}</li>`;
      continue;
    }

    if (line.startsWith("- ")) {
      if (!inList || listType !== "ul") { closeList(); inList = true; listType = "ul"; html += "<ul>"; }
      html += `<li>${escapeHtml(line.slice(2))}</li>`;
      continue;
    }

    closeList();
    html += `<p>${escapeHtml(line)}</p>`;
  }
  closeList();
  return html;
}

function categories() {
  return ["All", ...new Set(data.map(q => q.category))];
}

function currentFiltered() {
  const s = state.search.toLowerCase().trim();
  return data.filter(q => {
    if (state.category !== "All" && q.category !== state.category) return false;
    if (state.keyword && !q.keywords.includes(state.keyword)) return false;
    if (state.bookmarksOnly && !state.bookmarks.has(q.id)) return false;
    if (!s) return true;
    const haystack = [q.title, q.short, q.answer, q.category, q.subcategory, ...q.keywords].join(" ").toLowerCase();
    return haystack.includes(s);
  });
}

function renderTabs() {
  el("categoryTabs").innerHTML = categories().map(cat =>
    `<button class="tab ${state.category === cat ? "active" : ""}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`
  ).join("");

  document.querySelectorAll(".tab").forEach(btn => {
    btn.onclick = () => {
      state.category = btn.dataset.category;
      state.keyword = "";
      renderAll();
    };
  });
}

function renderKeywords() {
  const relevant = data.filter(q => state.category === "All" || q.category === state.category);
  const counts = {};
  relevant.flatMap(q => q.keywords).forEach(k => counts[k] = (counts[k] || 0) + 1);
  const keys = Object.entries(counts)
    .sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 36);

  el("keywordCloud").innerHTML = keys.map(([k,c]) =>
    `<button class="keyword ${state.keyword === k ? "active" : ""}" data-keyword="${escapeHtml(k)}">${escapeHtml(k)} <small>${c}</small></button>`
  ).join("");

  document.querySelectorAll(".keyword").forEach(btn => {
    btn.onclick = () => {
      state.keyword = state.keyword === btn.dataset.keyword ? "" : btn.dataset.keyword;
      renderAll();
    };
  });
}

function renderList() {
  const list = currentFiltered();
  if (!list.length) {
    el("questionList").innerHTML = `<div class="question-item"><strong>No matches</strong><small>Try another keyword or category.</small></div>`;
    return;
  }

  el("questionList").innerHTML = list.map(q =>
    `<div class="question-item ${state.selectedId === q.id ? "active" : ""}" data-id="${escapeHtml(q.id)}">
      <span class="star">${state.bookmarks.has(q.id) ? "★" : ""}</span>
      <strong>${escapeHtml(q.title)}</strong>
      <small>${escapeHtml(q.category)} · ${escapeHtml(q.subcategory)}</small>
    </div>`
  ).join("");

  document.querySelectorAll(".question-item[data-id]").forEach(item => {
    item.onclick = () => selectQuestion(item.dataset.id);
  });
}

function selectQuestion(id) {
  const q = data.find(x => x.id === id);
  if (!q) return;
  state.selectedId = id;

  el("emptyState").classList.add("hidden");
  el("answerCard").classList.remove("hidden");
  el("breadcrumb").textContent = `${activeDeck().name} › ${q.category} › ${q.subcategory}`;
  el("answerTitle").textContent = q.title;
  el("shortAnswer").textContent = q.short;
  el("fullAnswer").innerHTML = formatAnswer(q.answer);
  el("answerKeywords").innerHTML = q.keywords.map(k =>
    `<button data-keyword="${escapeHtml(k)}">${escapeHtml(k)}</button>`
  ).join("");
  el("notesBox").value = state.notes[`${state.activeDeckId}:${q.id}`] || "";
  el("notesDetails").open = false;
  updateBookmarkButton();
  renderList();

  document.querySelectorAll("#answerKeywords button").forEach(btn => {
    btn.onclick = () => {
      state.keyword = btn.dataset.keyword;
      state.search = "";
      el("searchInput").value = "";
      renderAll();
      openSidebar();
    };
  });

  closeSidebar();
  document.querySelector(".content").scrollTo({top: 0, behavior: "smooth"});
}

function bookmarkKey() {
  return `${state.activeDeckId}:${state.selectedId}`;
}

function updateBookmarkButton() {
  const saved = state.bookmarks.has(bookmarkKey());
  el("bookmarkBtn").textContent = saved ? "★" : "☆";
  el("bookmarkBtn").title = saved ? "Remove bookmark" : "Save question";
}

function navigate(delta) {
  const list = currentFiltered();
  if (!list.length) return;
  let i = list.findIndex(q => q.id === state.selectedId);
  i = i < 0 ? 0 : (i + delta + list.length) % list.length;
  selectQuestion(list[i].id);
}

function renderAll() {
  renderTabs();
  renderKeywords();
  renderList();
  el("allBtn").classList.toggle("active", !state.bookmarksOnly);
  el("bookmarksBtn").classList.toggle("active", state.bookmarksOnly);
}

function openSidebar() {
  el("sidebar").classList.add("open");
  el("overlay").classList.remove("hidden");
}
function closeSidebar() {
  el("sidebar").classList.remove("open");
  el("overlay").classList.add("hidden");
}

el("deckSelect").onchange = e => activateDeck(e.target.value);
el("importDeckBtn").onclick = () => el("deckFileInput").click();
el("deckFileInput").onchange = async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const raw = JSON.parse(await file.text());
    const deck = normalizeImportedDeck(raw, file.name);
    state.customDecks.push(deck);
    saveCustomDecks();
    activateDeck(deck.id);
    alert(`Imported “${deck.name}” with ${deck.questions.length} questions.`);
  } catch (error) {
    alert(`Import failed: ${error.message}`);
  } finally {
    event.target.value = "";
  }
};
el("exportDeckBtn").onclick = () => {
  const deck = activeDeck();
  downloadJson(`${slugify(deck.name)}.json`, {
    schemaVersion: 1,
    id: deck.id === "built-in" ? "developer-interview-prep" : deck.id,
    name: deck.name,
    description: deck.description || "",
    questions: deck.questions
  });
};
el("deleteDeckBtn").onclick = () => {
  if (state.activeDeckId === "built-in") return;
  const deck = activeDeck();
  if (!confirm(`Delete the local deck “${deck.name}”? This cannot be undone unless you exported it.`)) return;
  state.customDecks = state.customDecks.filter(item => item.id !== deck.id);
  saveCustomDecks();
  activateDeck("built-in");
};

el("searchInput").addEventListener("input", e => {
  state.search = e.target.value;
  renderList();
});
el("bookmarkBtn").onclick = () => {
  if (!state.selectedId) return;
  const key = bookmarkKey();
  if (state.bookmarks.has(key)) state.bookmarks.delete(key);
  else state.bookmarks.add(key);
  localStorage.setItem("interviewBookmarks", JSON.stringify([...state.bookmarks]));
  updateBookmarkButton();
  renderList();
};
el("notesBox").addEventListener("input", e => {
  if (!state.selectedId) return;
  state.notes[`${state.activeDeckId}:${state.selectedId}`] = e.target.value;
  localStorage.setItem("interviewNotes", JSON.stringify(state.notes));
});
el("prevBtn").onclick = () => navigate(-1);
el("nextBtn").onclick = () => navigate(1);
el("menuBtn").onclick = openSidebar;
el("overlay").onclick = closeSidebar;
el("allBtn").onclick = () => { state.bookmarksOnly = false; renderAll(); };
el("bookmarksBtn").onclick = () => { state.bookmarksOnly = true; renderAll(); };

el("themeBtn").onclick = () => {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  localStorage.setItem("interviewTheme", next);
};
el("fontBtn").onclick = () => {
  const current = Number(localStorage.getItem("interviewFontScale") || "1");
  const next = current >= 1.2 ? 0.92 : current + 0.14;
  document.documentElement.style.setProperty("--font-scale", next);
  localStorage.setItem("interviewFontScale", next);
};

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" && !["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)) navigate(-1);
  if (e.key === "ArrowRight" && !["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)) navigate(1);
  if (e.key === "/" && document.activeElement !== el("searchInput")) {
    e.preventDefault();
    el("searchInput").focus();
  }
});

const savedTheme = localStorage.getItem("interviewTheme");
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
document.documentElement.style.setProperty("--font-scale", localStorage.getItem("interviewFontScale") || "1");

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./service-worker.js")
    .then(() => el("statusText").textContent = "Installed offline")
    .catch(() => el("statusText").textContent = "Offline mode unavailable");
}

activateDeck(state.activeDeckId);
