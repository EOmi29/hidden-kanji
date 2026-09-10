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
