(() => {
  const BACKUP_KEYS = [
    "interviewNotes",
    "interviewBookmarks",
    "interviewCustomDecks",
    "interviewActiveDeck",
    "interviewPositionRequirements",
    "interviewTheme",
    "interviewFontScale"
  ];

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

  function exportBackup() {
    const storage = {};
    for (const key of BACKUP_KEYS) {
      const value = localStorage.getItem(key);
      if (value !== null) storage[key] = value;
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadJson(`developer-interview-prep-backup-${stamp}.json`, {
      schemaVersion: 1,
      app: "developer-interview-prep",
      exportedAt: new Date().toISOString(),
      storage
    });
  }

  async function importBackup(file) {
    const parsed = JSON.parse(await file.text());
    if (!parsed || parsed.app !== "developer-interview-prep" || !parsed.storage || typeof parsed.storage !== "object") {
      throw new Error("This does not appear to be a Developer Interview Prep backup file.");
    }

    for (const key of BACKUP_KEYS) {
      if (Object.prototype.hasOwnProperty.call(parsed.storage, key)) {
        localStorage.setItem(key, String(parsed.storage[key]));
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const exportBtn = document.getElementById("exportBackupBtn");
    const importBtn = document.getElementById("importBackupBtn");
    const fileInput = document.getElementById("backupFileInput");

    exportBtn?.addEventListener("click", exportBackup);
    importBtn?.addEventListener("click", () => fileInput?.click());
    fileInput?.addEventListener("change", async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        await importBackup(file);
        alert("Backup restored. The app will reload now.");
        location.reload();
      } catch (error) {
        alert(`Restore failed: ${error.message}`);
      } finally {
        event.target.value = "";
      }
    });
  });
})();
