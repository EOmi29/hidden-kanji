const kanjiList = JSON.parse(localStorage.getItem("kanjiList") || "[]");
let qIndex = Number(localStorage.getItem("qIndex") || 0);
const gridSize = Number(localStorage.getItem("gridSize") || 6);
const limitCount = Number(localStorage.getItem("limitCount") || 0);

let totalScore = Number(localStorage.getItem("totalScore") || 0);

const qNum = document.getElementById("qNum");
const kanjiChar = document.getElementById("kanjiChar");
const coverGrid = document.getElementById("coverGrid");
const scoreDisplay = document.getElementById("scoreDisplay");
const totalDisplay = document.getElementById("totalScoreDisplay");
const judgeArea = document.getElementById("judgeArea");

let openedCount = 0;

// ===== 読み・熟語の表示（data.js を利用） =====
const kanjiInfo = new Map(kanjiData.map(e => [e.kanji, e]));
const readingPanel = document.getElementById("readingPanel");
const wordsPanel = document.getElementById("wordsPanel");
const readingBody = document.getElementById("readingBody");
const wordsBody = document.getElementById("wordsBody");
const noDataNote = document.getElementById("noDataNote");

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// 数字は縦書きでも横向き1マスにまとめる（例：10月）
function combineDigits(html) {
  return html.replace(/[0-9]{1,4}/g, m => `<span class="tcy">${m}</span>`);
}

// 読み：区切り（・ 、 。 空白）で分け、ひらがな・カタカナを含まないものは除く
function parseReadings(reading) {
  return reading
    .split(/[・、。\s\u3000]+/)
    .map(x => x.trim())
    .filter(x => /[\u3041-\u3096\u30A1-\u30FA]/.test(x));
}

// 送りがな（︿ ﹀ で囲まれた部分）を〈 〉つきの色違い文字にする
function formatReading(part) {
  return escapeHtml(part).replace(/\uFE3F(.*?)\uFE40/g, '<span class="okuri">〈$1〉</span>');
}

function sizeClass(text, mid, long) {
  const n = [...text].length;
  return n >= long ? " xlong" : n >= mid ? " long" : "";
}

function renderDetails(kanji) {
  const info = kanjiInfo.get(kanji);
  if (!info) {
    noDataNote.hidden = false; // データがない漢字は、読み・熟語を出さない
    return;
  }

  readingBody.innerHTML = parseReadings(info.reading)
    .map(r => `<div class="item reading-item${sizeClass(r.replace(/[\uFE3F\uFE40]/g, ""), 8, 8)}">${formatReading(r)}</div>`)
    .join("");

  wordsBody.innerHTML = info.words
    .filter(w => w && w.trim() !== "")
    .map(w => `<div class="item word-item${sizeClass(w, 6, 9)}">${combineDigits(escapeHtml(w))}</div>`)
    .join("");

  readingPanel.classList.add("show");
  wordsPanel.classList.add("show");
}

function resetDetails() {
  readingPanel.classList.remove("show");
  wordsPanel.classList.remove("show");
  readingBody.innerHTML = "";
  wordsBody.innerHTML = "";
  noDataNote.hidden = true;
}

function getScoreTable() {
  if (gridSize === 4) return [10, 6, 3, 0];
  if (gridSize === 6) return [10, 8, 6, 4, 2, 0];
  if (gridSize === 9) return [10, 9, 7, 6, 4, 3, 2, 1, 0];
}

function loadQuestion() {
  openedCount = 0;
  qNum.textContent = `第${qIndex + 1}問`;
  kanjiChar.textContent = kanjiList[qIndex];
  judgeArea.style.display = "none";
  resetDetails();
  buildCovers();
  updateScore();
  totalDisplay.textContent = `合計得点：${totalScore}点`;
}

function buildCovers() {
  coverGrid.innerHTML = "";
  let rows, cols;
  if (gridSize === 4) [rows, cols] = [2,2];
  if (gridSize === 6) [rows, cols] = [3,2];
  if (gridSize === 9) [rows, cols] = [3,3];

  coverGrid.style.gridTemplateRows = `repeat(${rows},1fr)`;
  coverGrid.style.gridTemplateColumns = `repeat(${cols},1fr)`;

  for (let i = 0; i < gridSize; i++) {
    const div = document.createElement("div");
    div.className = "cover";
    div.onclick = () => {
      if (!div.classList.contains("hidden")) {
        div.classList.add("hidden");
        openedCount++;
        updateScore();
      }
    };
    coverGrid.appendChild(div);
  }
}

function updateScore() {
  if (openedCount === 0) {
    scoreDisplay.textContent = "";
    return;
  }
  const table = getScoreTable();
  const score = table[openedCount - 1] ?? 0;
  scoreDisplay.textContent = `ここでわかった人は：${score}点`;
}

document.getElementById("answerBtn").onclick = () => {
  document.querySelectorAll(".cover").forEach(c => c.classList.add("hidden"));
  judgeArea.style.display = "block";
  renderDetails(kanjiList[qIndex]);
};

document.getElementById("correctBtn").onclick = () => {
  const table = getScoreTable();
  const score = table[openedCount - 1] ?? 0;
  totalScore += score;
  localStorage.setItem("totalScore", totalScore);
  nextQuestion();
};

document.getElementById("wrongBtn").onclick = () => {
  localStorage.setItem("totalScore", totalScore);
  nextQuestion();
};

function nextQuestion() {
  qIndex++;

  const maxQ = limitCount > 0 ? limitCount : kanjiList.length;

  if (qIndex >= kanjiList.length || qIndex >= maxQ) {
    alert(`終了！合計得点：${totalScore}点`);
    location.href = "index.html";
  } else {
    localStorage.setItem("qIndex", qIndex);
    loadQuestion();
  }
}

loadQuestion();
