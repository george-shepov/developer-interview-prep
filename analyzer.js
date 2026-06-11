(() => {
  const SKILL_RULES = [
    { name: "SQL", terms: ["sql", "t-sql", "tsql", "database", "query", "queries"] },
    { name: "SQL Server", terms: ["sql server", "mssql", "sql 2016", "sql server 2016"] },
    { name: "OLTP", terms: ["oltp", "transaction processing", "transactional application", "high-volume transaction"] },
    { name: ".NET", terms: [".net", "dotnet", "asp.net", "c#", "clr", "entity framework", "ef core"] },
    { name: "JavaScript", terms: ["javascript", "js", "typescript", "node", "frontend", "front-end"] },
    { name: "REST/API", terms: ["rest", "restful", "api", "web api", "http"] },
    { name: "Performance", terms: ["performance", "optimization", "tuning", "scalability", "high volume"] },
    { name: "Concurrency", terms: ["concurrency", "locking", "deadlock", "parallel", "multi-user"] },
    { name: "E-commerce", terms: ["e-commerce", "ecommerce", "orders", "checkout", "shopping cart", "inventory"] },
    { name: "Automotive", terms: ["automotive", "vehicle", "dealer", "parts", "aftermarket"] },
    { name: "Legacy systems", terms: ["legacy", "maintenance", "existing application", "production support"] },
    { name: "Cloud", terms: ["azure", "aws", "cloud", "serverless"] },
    { name: "Testing", terms: ["unit test", "testing", "qa", "test automation", "integration test"] },
    { name: "Architecture", terms: ["architecture", "microservices", "solid", "design patterns", "dependency injection"] },
    { name: "Behavioral", terms: ["communication", "collaboration", "stakeholder", "team", "leadership", "conflict"] }
  ];

  const BASE_BEHAVIORAL_ORDER = [
    "beh-tell-me",
    "beh-why-role",
    "beh-strength",
    "beh-weakness",
    "beh-accomplishment",
    "beh-failure",
    "beh-conflict",
    "beh-priority",
    "beh-pressure",
    "beh-legacy",
    "beh-gap",
    "beh-salary",
    "beh-questions"
  ];

  const normalize = value => String(value || "").toLowerCase();
  const unique = values => [...new Set(values)];

  function detectedSkills(text) {
    const normalized = normalize(text);
    return SKILL_RULES.filter(rule => rule.terms.some(term => normalized.includes(term)));
  }

  function scoreQuestion(question, text, skills) {
    const normalizedText = normalize(text);
    const haystack = normalize([
      question.title,
      question.category,
      question.subcategory,
      question.short,
      ...(question.keywords || [])
    ].join(" "));

    let score = question.category === "Behavioral" ? 35 : 0;

    for (const skill of skills) {
      const matchesQuestion = skill.terms.some(term => haystack.includes(term)) || haystack.includes(normalize(skill.name));
      if (matchesQuestion) score += 28;
    }

    for (const keyword of question.keywords || []) {
      const k = normalize(keyword);
      if (k && normalizedText.includes(k)) score += 18;
    }

    if (normalizedText.includes(normalize(question.category))) score += 10;
    if (normalizedText.includes(normalize(question.subcategory))) score += 8;

    if (question.category === "Behavioral") {
      const position = BASE_BEHAVIORAL_ORDER.indexOf(question.id);
      if (position >= 0) score += Math.max(0, 20 - position);
    }

    return score;
  }

  function buildPositionDeck(text) {
    const source = (window.INTERVIEW_DATA || []).map(q => ({ ...q }));
    const skills = detectedSkills(text);

    const scored = source.map((question, originalIndex) => ({
      question,
      originalIndex,
      score: scoreQuestion(question, text, skills)
    }));

    scored.sort((a, b) => {
      const aBehavioral = a.question.category === "Behavioral" ? 0 : 1;
      const bBehavioral = b.question.category === "Behavioral" ? 0 : 1;
      if (aBehavioral !== bBehavioral) return aBehavioral - bBehavioral;
      if (b.score !== a.score) return b.score - a.score;
      return a.originalIndex - b.originalIndex;
    });

    const selected = scored
      .filter(item => item.question.category === "Behavioral" || item.score > 0)
      .slice(0, 40)
      .map(item => item.question);

    const id = `position-prep-${Date.now().toString(36)}`;
    return {
      deck: {
        schemaVersion: 1,
        id,
        name: "Position Prep",
        description: "Locally prioritized from pasted position requirements.",
        importedAt: new Date().toISOString(),
        sourceRequirements: text,
        detectedSkills: skills.map(skill => skill.name),
        questions: selected.length ? selected : source
      },
      skills
    };
  }

  function renderSkills(container, skills) {
    if (!container) return;
    if (!skills.length) {
      container.innerHTML = "<div>No strong skill matches detected. Behavioral questions will still be prioritized.</div>";
      return;
    }
    container.innerHTML = `<div><strong>Detected:</strong></div><div class="detected-skills">${skills.map(skill => `<span>${skill.name}</span>`).join("")}</div>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("positionRequirements");
    const analyze = document.getElementById("analyzePositionBtn");
    const clear = document.getElementById("clearPositionBtn");
    const results = document.getElementById("analyzerResults");

    const saved = localStorage.getItem("interviewPositionRequirements") || "";
    if (input) input.value = saved;
    if (saved) renderSkills(results, detectedSkills(saved));

    analyze?.addEventListener("click", () => {
      const text = input?.value.trim() || "";
      if (!text) {
        alert("Paste the position requirements first.");
        return;
      }

      const { deck, skills } = buildPositionDeck(text);
      const decks = JSON.parse(localStorage.getItem("interviewCustomDecks") || "[]")
        .filter(item => item.name !== "Position Prep");
      decks.push(deck);
      localStorage.setItem("interviewCustomDecks", JSON.stringify(decks));
      localStorage.setItem("interviewActiveDeck", deck.id);
      localStorage.setItem("interviewPositionRequirements", text);
      renderSkills(results, skills);
      location.reload();
    });

    clear?.addEventListener("click", () => {
      if (input) input.value = "";
      localStorage.removeItem("interviewPositionRequirements");
      if (results) results.innerHTML = "";
    });
  });
})();
