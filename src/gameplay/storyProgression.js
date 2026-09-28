export const STORY_CHAPTERS = Object.freeze([
  "CHAPITRE I — L'ÉVEIL", "CHAPITRE II — LA CORRUPTION",
  "CHAPITRE III — LES SOUVENIRS", "CHAPITRE IV — LE VIDE"
]);
export const STORY_OBJECTIVES = Object.freeze([
  { id: "time", label: "Terminer en 3 minutes maximum", succeeds: run => run.time <= 180 },
  { id: "stability", label: "Terminer avec au moins 75 de Stabilité", succeeds: run => run.stability >= 75 },
  { id: "combo", label: "Atteindre un combo ×2", succeeds: run => run.combo >= 2 }
].map(Object.freeze));

export function readStory(saved) {
  const rewarded = {};
  const records = {};
  for (let chapter = 1; chapter <= 4; chapter++) {
    for (const objective of STORY_OBJECTIVES) {
      const id = `${chapter}:${objective.id}`;
      if (saved?.rewarded?.[id] === true) rewarded[id] = true;
    }
    const record = saved?.records?.[chapter];
    if (record && Number.isFinite(record.time) && record.time >= 0 && Number.isFinite(record.score) && record.score >= 0)
      records[chapter] = { time: record.time, score: record.score };
  }
  // Preproduction infinite records never grant Story completion.
  return { completed: saved?.completed === true, rewarded, records };
}

export function awardStoryChapter(saved, chapter, run) {
  if (![1, 2, 3, 4].includes(chapter) ||
      ![run?.time, run?.score, run?.stability, run?.combo].every(n => Number.isFinite(n) && n >= 0) ||
      run.stability <= 0 || run.stability > 100) return null;
  const story = readStory(saved);
  let reward = 0;
  for (const objective of STORY_OBJECTIVES) {
    const id = `${chapter}:${objective.id}`;
    if (!story.rewarded[id] && objective.succeeds(run)) {
      story.rewarded[id] = true;
      reward += 25;
    }
  }
  const previous = story.records[chapter];
  story.records[chapter] = { time: Math.min(previous?.time ?? Infinity, run.time), score: Math.max(previous?.score ?? 0, run.score) };
  if (chapter === 4) story.completed = true;
  return { story, reward };
}
