const state = {
  category: "All",
  keyword: "",
  search: "",
  bookmarksOnly: false,
  selectedId: null,
  bookmarks: new Set(JSON.parse(localStorage.getItem("interviewBookmarks") || "[]")),
  notes: JSON.parse(localStorage.getItem("interviewNotes") || "{}")
};

const el = id => document.getElementById(id);
const data = window.INTERVIEW_DATA;

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
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
    `<button class="tab ${state.category === cat ? "active" : ""}" data-category="${cat}">${cat}</button>`
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
    `<div class="question-item ${state.selectedId === q.id ? "active" : ""}" data-id="${q.id}">
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
  el("breadcrumb").textContent = `${q.category} › ${q.subcategory}`;
  el("answerTitle").textContent = q.title;
  el("shortAnswer").textContent = q.short;
  el("fullAnswer").innerHTML = formatAnswer(q.answer);
  el("answerKeywords").innerHTML = q.keywords.map(k =>
    `<button data-keyword="${escapeHtml(k)}">${escapeHtml(k)}</button>`
  ).join("");
  el("notesBox").value = state.notes[q.id] || "";
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

function updateBookmarkButton() {
  const saved = state.bookmarks.has(state.selectedId);
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

el("searchInput").addEventListener("input", e => {
  state.search = e.target.value;
  renderList();
});
el("bookmarkBtn").onclick = () => {
  if (!state.selectedId) return;
  if (state.bookmarks.has(state.selectedId)) state.bookmarks.delete(state.selectedId);
  else state.bookmarks.add(state.selectedId);
  localStorage.setItem("interviewBookmarks", JSON.stringify([...state.bookmarks]));
  updateBookmarkButton();
  renderList();
};
el("notesBox").addEventListener("input", e => {
  if (!state.selectedId) return;
  state.notes[state.selectedId] = e.target.value;
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
  if (e.key === "ArrowLeft" && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) navigate(-1);
  if (e.key === "ArrowRight" && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) navigate(1);
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

renderAll();
selectQuestion("sql-oltp");
