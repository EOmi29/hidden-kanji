// 1. データの統合（windowオブジェクトから確実に取得）
const allKanjiData = { 
  ...(window.kanjiData || {}), 
  ...(window.juniorKanjiData || {}) 
};

let selectedGrades = [];
let selectedTerms = [];
let selectedKanji = [];
let freeKanjiList = [];
let gridSize = 6;
let limitCount = 0;

const gradeButtonsDiv = document.getElementById("gradeButtons");
const termButtonsDiv = document.getElementById("termButtons");
const kanjiListDiv = document.getElementById("kanjiList");
const freeKanjiListDiv = document.getElementById("freeKanjiList");
const freeInputField = document.getElementById("freeInputField");

// ===== ① カテゴリーボタン（小学校・中学校を分けて生成） =====
function renderGradeButtons() {
  gradeButtonsDiv.innerHTML = "";

  // --- 小学校セクション ---
  const primarySection = document.createElement("div");
  primarySection.innerHTML = "<p style='margin: 10px 0 5px; font-weight: bold; color: #2c3e50;'>【小学校】学年を選択</p>";
  gradeButtonsDiv.appendChild(primarySection);

  // 1〜6年を順番に生成
  for (let g = 1; g <= 6; g++) {
    if (allKanjiData[g]) {
      const btn = document.createElement("button");
      btn.textContent = g + "年";
      btn.classList.add("primary-btn"); // CSSで色分けしたい時用のクラス名
      btn.onclick = () => toggleGrade(g.toString(), btn);
      gradeButtonsDiv.appendChild(btn);
    }
  }

  // --- 中学校セクション ---
  const juniorSection = document.createElement("div");
  juniorSection.innerHTML = "<p style='margin: 20px 0 5px; font-weight: bold; color: #2c3e50;'>【中学校】読みの50音を選択</p>";
  gradeButtonsDiv.appendChild(juniorSection);

  // 数字以外（あ、か、さ...）を生成
  for (let g in allKanjiData) {
    if (isNaN(g)) {
      const btn = document.createElement("button");
      btn.textContent = g;
      btn.classList.add("junior-btn"); // CSSで色分けしたい時用のクラス名
      btn.onclick = () => toggleGrade(g, btn);
      gradeButtonsDiv.appendChild(btn);
    }
  }
}

function toggleGrade(g, btn) {
  if (selectedGrades.includes(g)) {
    selectedGrades = selectedGrades.filter(x => x !== g);
    btn.classList.remove("active");
  } else {
    selectedGrades.push(g);
    btn.classList.add("active");
  }
  renderTerms();
}

// ===== ② 学期または50音リストの描画 =====
function renderTerms() {
  termButtonsDiv.innerHTML = "";
  
  selectedTerms = selectedTerms.filter(key => {
    const [g] = key.split("-");
    return selectedGrades.includes(g);
  });

  selectedGrades.forEach(g => {
    const data = allKanjiData[g];
    if (!data) return;

    const wrapper = document.createElement("div");
    const label = isNaN(g) ? g : `${g}年`;
    wrapper.innerHTML = `<strong>${label}</strong> `;

    if (Array.isArray(data)) {
      const btn = document.createElement("button");
      btn.textContent = "全表示";
      const key = `${g}-ALL`;
      if (selectedTerms.includes(key)) btn.classList.add("active");
      btn.onclick = () => toggleTerm(g, "ALL", btn);
      wrapper.appendChild(btn);
    } else {
      for (let term in data) {
        if (g === "1" && term === "1学期" && data[term].length === 0) continue;
        const btn = document.createElement("button");
        btn.textContent = term;
        const key = `${g}-${term}`;
        if (selectedTerms.includes(key)) btn.classList.add("active");
        btn.onclick = () => toggleTerm(g, term, btn);
        wrapper.appendChild(btn);
      }
    }
    termButtonsDiv.appendChild(wrapper);
  });
  renderKanjiList();
}

function toggleTerm(g, term, btn) {
  const key = `${g}-${term}`;
  if (selectedTerms.includes(key)) {
    selectedTerms = selectedTerms.filter(x => x !== key);
    btn.classList.remove("active");
  } else {
    selectedTerms.push(key);
    btn.classList.add("active");
  }
  renderKanjiList();
}

// ===== ③ 漢字一覧描画 =====
function renderKanjiList() {
  kanjiListDiv.innerHTML = "";
  selectedKanji = [];

  selectedTerms.forEach(key => {
    const [g, term] = key.split("-");
    const data = allKanjiData[g];

    if (term === "ALL") {
      data.forEach(k => {
        if (!selectedKanji.includes(k)) selectedKanji.push(k);
      });
    } else if (data[term]) {
      data[term].forEach(k => {
        if (!selectedKanji.includes(k)) selectedKanji.push(k);
      });
    }
  });

  selectedKanji.forEach(k => {
    const span = document.createElement("span");
    span.textContent = k;
    span.onclick = () => span.classList.toggle("selected");
    kanjiListDiv.appendChild(span);
  });
}

// ===== ④ 自由入力で追加 =====
function renderFreeKanjiList() {
  freeKanjiListDiv.innerHTML = "";
  freeKanjiList.forEach(k => {
    const span = document.createElement("span");
    span.textContent = k;
    span.classList.add("selected"); // 入力した字は最初からON
    span.onclick = () => {
      span.classList.toggle("selected");
    };
    span.ondblclick = () => {
      freeKanjiList = freeKanjiList.filter(x => x !== k);
      renderFreeKanjiList();
    };
    freeKanjiListDiv.appendChild(span);
  });
}

function addFreeKanji() {
  const raw = freeInputField.value;
  // 漢字（Hanスクリプト）だけを抽出し、重複を除く
  const chars = [...new Set(raw.match(/\p{Script=Han}/gu) || [])];

  if (chars.length === 0) {
    if (raw.trim() !== "") alert("漢字が見つかりませんでした");
    return;
  }

  chars.forEach(c => {
    if (!freeKanjiList.includes(c)) freeKanjiList.push(c);
  });

  freeInputField.value = "";
  renderFreeKanjiList();
}

document.getElementById("addFreeBtn").onclick = addFreeKanji;

freeInputField.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addFreeKanji();
  }
});

// ===== ボタンイベント初期設定 =====
document.getElementById("selectAllKanjiBtn").onclick = () => {
  document.querySelectorAll("#kanjiList span").forEach(span => {
    span.classList.add("selected");
  });
};

document.querySelectorAll(".gridBtn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".gridBtn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    gridSize = Number(btn.dataset.grid);
  };
});

document.querySelectorAll(".countBtn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".countBtn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    limitCount = Number(btn.dataset.count);
  };
});

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

document.getElementById("startBtn").onclick = () => {
  const picked = [];
  document.querySelectorAll("#kanjiList span.selected, #freeKanjiList span.selected").forEach(span => {
    if (!picked.includes(span.textContent)) picked.push(span.textContent);
  });

  if (picked.length === 0) {
    alert("出題する漢字を選択してください");
    return;
  }

  shuffle(picked);
  localStorage.setItem("kanjiList", JSON.stringify(picked));
  localStorage.setItem("gridSize", gridSize);
  localStorage.setItem("qIndex", 0);
  localStorage.setItem("totalScore", 0);
  localStorage.setItem("limitCount", limitCount);

  location.href = "play.html";
};

// 実行！
renderGradeButtons();
