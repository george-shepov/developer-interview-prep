(() => {
  function animate(panel) {
    panel.classList.remove("sidebar-view-transition");
    void panel.offsetWidth;
    panel.classList.add("sidebar-view-transition");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");
    const topActions = document.querySelector(".top-actions");
    if (!sidebar || !topActions || document.getElementById("settingsBtn")) return;

    const gear = document.createElement("button");
    gear.id = "settingsBtn";
    gear.className = "icon-btn settings-gear";
    gear.type = "button";
    gear.setAttribute("aria-label", "Open tools and settings");
    gear.setAttribute("aria-pressed", "false");
    gear.textContent = "⚙";
    topActions.insertBefore(gear, topActions.firstChild);

    const settingsPanel = document.createElement("section");
    settingsPanel.id = "settingsPanel";
    settingsPanel.className = "settings-panel";
    settingsPanel.innerHTML = `
      <div class="settings-head">
        <h2>Tools & settings</h2>
        <button id="settingsBackBtn" class="settings-back" type="button">← Questions</button>
      </div>`;

    const questionsPanel = document.createElement("section");
    questionsPanel.id = "questionsPanel";
    questionsPanel.className = "questions-panel";

    const managementSelectors = [
      ".position-analyzer",
      ".deck-tools",
      ".backup-tools",
      "#questionAdmin"
    ];
    const managementNodes = managementSelectors
      .map(selector => sidebar.querySelector(selector))
      .filter(Boolean);

    const remainingNodes = [...sidebar.children].filter(node => !managementNodes.includes(node));
    managementNodes.forEach(node => settingsPanel.appendChild(node));
    remainingNodes.forEach(node => questionsPanel.appendChild(node));
    sidebar.append(settingsPanel, questionsPanel);

    const openSettings = () => {
      sidebar.classList.add("settings-mode");
      gear.classList.add("active");
      gear.setAttribute("aria-pressed", "true");
      animate(settingsPanel);
      if (window.innerWidth <= 820 && !document.body.classList.contains("drawer-open")) {
        window.drawerControls?.toggle();
      }
      settingsPanel.scrollTop = 0;
    };

    const showQuestions = () => {
      sidebar.classList.remove("settings-mode");
      gear.classList.remove("active");
      gear.setAttribute("aria-pressed", "false");
      animate(questionsPanel);
    };

    gear.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      if (sidebar.classList.contains("settings-mode")) showQuestions();
      else openSettings();
    });

    document.getElementById("settingsBackBtn")?.addEventListener("click", showQuestions);

    document.getElementById("menuBtn")?.addEventListener("click", () => {
      if (!document.body.classList.contains("drawer-open")) showQuestions();
    });
    document.getElementById("footerMenuBtn")?.addEventListener("click", () => {
      if (!document.body.classList.contains("drawer-open")) showQuestions();
    });

    document.getElementById("questionList")?.addEventListener("click", event => {
      if (event.target.closest(".question-item[data-id]")) showQuestions();
    });
  });
})();
