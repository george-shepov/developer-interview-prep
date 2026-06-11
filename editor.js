(() => {
  const CUSTOM_DECKS_KEY = "interviewCustomDecks";
  const ACTIVE_DECK_KEY = "interviewActiveDeck";

  const readDecks = () => JSON.parse(localStorage.getItem(CUSTOM_DECKS_KEY) || "[]");
  const saveDecks = decks => localStorage.setItem(CUSTOM_DECKS_KEY, JSON.stringify(decks));
  const slugify = value => String(value || "question").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "question";

  function activeDeckSnapshot() {
    const activeId = localStorage.getItem(ACTIVE_DECK_KEY) || "built-in";
    const custom = readDecks().find(deck => deck.id === activeId);
    if (custom) return { deck: custom, isBuiltIn: false };
    return {
      deck: {
        schemaVersion: 1,
        id: "built-in",
        name: "Developer Interview Prep",
        description: "Built-in interview questions",
        questions: (window.INTERVIEW_DATA || []).map(question => ({ ...question }))
      },
      isBuiltIn: true
    };
  }

  function createEditableCopy(sourceDeck) {
    const decks = readDecks();
    const existing = decks.find(deck => deck.id === "my-interview-questions");
    if (existing) return existing;
    const copy = {
      ...sourceDeck,
      id: "my-interview-questions",
      name: "My Interview Questions",
      description: "Editable local copy of the built-in deck.",
      createdAt: new Date().toISOString(),
      questions: sourceDeck.questions.map(question => ({ ...question, keywords: [...(question.keywords || [])] }))
    };
    decks.push(copy);
    saveDecks(decks);
    localStorage.setItem(ACTIVE_DECK_KEY, copy.id);
    return copy;
  }

  function editableDeck() {
    const snapshot = activeDeckSnapshot();
    return snapshot.isBuiltIn ? createEditableCopy(snapshot.deck) : snapshot.deck;
  }

  function selectedQuestion(deck) {
    const title = document.getElementById("answerTitle")?.textContent?.trim();
    return deck.questions.find(question => question.title === title) || null;
  }

  function persistDeck(deck) {
    const decks = readDecks();
    const index = decks.findIndex(item => item.id === deck.id);
    if (index >= 0) decks[index] = deck;
    else decks.push(deck);
    saveDecks(decks);
    localStorage.setItem(ACTIVE_DECK_KEY, deck.id);
  }

  function buildUI() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar || document.getElementById("questionAdmin")) return;

    const section = document.createElement("details");
    section.id = "questionAdmin";
    section.className = "question-admin";
    section.innerHTML = `
      <summary>Manage questions</summary>
      <div class="question-admin-body">
        <div class="question-admin-actions">
          <button id="addQuestionBtn" class="small-btn" type="button">＋ Add</button>
          <button id="editQuestionBtn" class="small-btn" type="button">✎ Edit current</button>
          <button id="deleteQuestionBtn" class="small-btn danger" type="button">Delete current</button>
        </div>
        <p class="analyzer-note">Editing the built-in deck creates an editable local copy so updates cannot erase your changes.</p>
      </div>`;

    const search = sidebar.querySelector(".search-wrap");
    sidebar.insertBefore(section, search);

    const modal = document.createElement("div");
    modal.id = "questionEditorModal";
    modal.className = "editor-modal";
    modal.innerHTML = `
      <div class="editor-card" role="dialog" aria-modal="true" aria-labelledby="editorTitle">
        <div class="editor-head"><h2 id="editorTitle">Question</h2><button id="editorCloseBtn" class="editor-close" type="button">×</button></div>
        <form id="questionEditorForm" class="editor-form">
          <input id="editorOriginalId" type="hidden" />
          <div class="editor-field"><label for="editorId">ID</label><input id="editorId" required /></div>
          <div class="editor-field"><label for="editorCategory">Category</label><input id="editorCategory" required /></div>
          <div class="editor-field"><label for="editorSubcategory">Subcategory</label><input id="editorSubcategory" required /></div>
          <div class="editor-field"><label for="editorKeywords">Keywords, comma separated</label><input id="editorKeywords" /></div>
          <div class="editor-field full"><label for="editorQuestionTitle">Question</label><input id="editorQuestionTitle" required /></div>
          <div class="editor-field full"><label for="editorShort">Quick answer</label><textarea id="editorShort" required></textarea></div>
          <div class="editor-field full"><label for="editorAnswer">Expanded answer</label><textarea id="editorAnswer" class="answer" required></textarea></div>
          <div class="editor-actions"><button id="editorCancelBtn" type="button">Cancel</button><button class="primary" type="submit">Save question</button></div>
        </form>
      </div>`;
    document.body.appendChild(modal);
  }

  function openEditor(question = null) {
    const modal = document.getElementById("questionEditorModal");
    document.getElementById("editorTitle").textContent = question ? "Edit question" : "Add question";
    document.getElementById("editorOriginalId").value = question?.id || "";
    document.getElementById("editorId").value = question?.id || "";
    document.getElementById("editorCategory").value = question?.category || "";
    document.getElementById("editorSubcategory").value = question?.subcategory || "";
    document.getElementById("editorKeywords").value = (question?.keywords || []).join(", ");
    document.getElementById("editorQuestionTitle").value = question?.title || "";
    document.getElementById("editorShort").value = question?.short || "";
    document.getElementById("editorAnswer").value = question?.answer || "";
    modal.classList.add("open");
    setTimeout(() => document.getElementById("editorQuestionTitle")?.focus(), 50);
  }

  function closeEditor() {
    document.getElementById("questionEditorModal")?.classList.remove("open");
  }

  function bindUI() {
    document.getElementById("addQuestionBtn")?.addEventListener("click", () => openEditor());
    document.getElementById("editQuestionBtn")?.addEventListener("click", () => {
      const snapshot = activeDeckSnapshot();
      const question = selectedQuestion(snapshot.deck);
      if (!question) return alert("Open a question first.");
      openEditor(question);
    });
    document.getElementById("deleteQuestionBtn")?.addEventListener("click", () => {
      const deck = editableDeck();
      const question = selectedQuestion(deck);
      if (!question) return alert("Open a question first.");
      if (!confirm(`Delete “${question.title}” from ${deck.name}?`)) return;
      deck.questions = deck.questions.filter(item => item.id !== question.id);
      persistDeck(deck);
      location.reload();
    });
    document.getElementById("editorCloseBtn")?.addEventListener("click", closeEditor);
    document.getElementById("editorCancelBtn")?.addEventListener("click", closeEditor);
    document.getElementById("questionEditorModal")?.addEventListener("click", event => {
      if (event.target.id === "questionEditorModal") closeEditor();
    });
    document.getElementById("questionEditorForm")?.addEventListener("submit", event => {
      event.preventDefault();
      const deck = editableDeck();
      const originalId = document.getElementById("editorOriginalId").value.trim();
      const title = document.getElementById("editorQuestionTitle").value.trim();
      const id = document.getElementById("editorId").value.trim() || slugify(title);
      const question = {
        id,
        category: document.getElementById("editorCategory").value.trim(),
        subcategory: document.getElementById("editorSubcategory").value.trim(),
        title,
        keywords: document.getElementById("editorKeywords").value.split(",").map(value => value.trim()).filter(Boolean),
        short: document.getElementById("editorShort").value.trim(),
        answer: document.getElementById("editorAnswer").value.trim()
      };
      const duplicate = deck.questions.find(item => item.id === id && item.id !== originalId);
      if (duplicate) return alert(`Question ID “${id}” already exists.`);
      const index = originalId ? deck.questions.findIndex(item => item.id === originalId) : -1;
      if (index >= 0) deck.questions[index] = question;
      else deck.questions.push(question);
      persistDeck(deck);
      location.reload();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "editor.css";
    document.head.appendChild(link);
    buildUI();
    bindUI();
  });
})();
