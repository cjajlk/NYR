import { formatTime } from "./timeDisplay.js";
export const FORM_LABELS = Object.freeze({ eclat: "Éclat", spectre: "Spectre", nocturne: "Nocturne", devoreur: "Dévoreur" });
export function createStatisticsPanel(readTotals) {
  const element = document.createElement("dl");
  element.className = "statistics-grid";
  const fields = [["MEILLEUR SCORE", "bestScore"], ["MEILLEUR TEMPS", "bestTime"], ["PARTIES", "completedRuns"],
    ["FRAGMENTS ABSORBÉS", "normalFragments"], ["CYCLES PARCOURUS", "cycles"], ["MEILLEUR COMBO", "bestCombo"], ["DÉVOREUR ATTEINT", "devoreurReached"]];
  const values = fields.map(([label]) => {
    const row = document.createElement("div");
    const term = document.createElement("dt"), value = document.createElement("dd");
    term.textContent = label; row.append(term, value); element.append(row); return value;
  });
  function refresh() {
    const totals = readTotals();
    fields.forEach(([, key], index) => {
      const value = totals[key] ?? 0;
      values[index].textContent = key === "bestTime" ? formatTime(value).replace("TEMPS ", "") : key === "bestCombo" ? "×" + value : String(value);
    });
  }
  return Object.freeze({ element, refresh });
}
export function formatRunSummary(run) {
  return `SCORE ${run.score} · ${formatTime(run.activeTime)}\nFRAGMENTS ${run.normalFragments} · CYCLES ${run.cycles}\nCOMBO ×${run.bestCombo} · ${FORM_LABELS[run.maxForm]}`;
}
