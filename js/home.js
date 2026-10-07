// ===== データの整理 =====
// js/data.js（kanjiData: 配列）から、学年・学期ごと／中学生の読みごとのリストを作る
const JUNIOR = "中学生";
const JUNIOR_GROUPS = [
  { label: "あ", terms: [1] },
  { label: "か", terms: [2] },
  { label: "さ", terms: [3] },
  { label: "た", terms: [4] },
  { label: "な・は", terms: [5, 6] },
  { label: "ま・や・ら・わ", terms: [7, 8, 9, 10] }
];

const elementary = {}; // elementary[学年][学期] = [漢字...]
const junior = {};     // junior[読みのグループ] = [漢字...]

kanjiData.forEach(e => {
  if (e.grade >= 1 && e.grade <= 6) {
    if (!elementary[e.grade]) elementary[e.grade] = {};
    if (!elementary[e.grade][e.term]) elementary[e.grade][e.term] = [];
    elementary[e.grade][e.term].push(e.kanji);
  }
});
JUNIOR_GROUPS.forEach(gp => {
  junior[gp.label] = kanjiData
    .filter(e => e.grade === 7 && gp.terms.includes(e.term))
    .map(e => e.kanji);
});

// ===== 状態 =====
let selectedGrades = [];   // "1"〜"6" と JUNIOR
let selectedTerms = [];    // "学年-学期"（例 "2-3"）
let selectedReadings = []; // "あ" "か" ...
let freeKanjiList = [];
let gridSize = 6;
let gridChosen = false;
let limitCount = 0;

const gradeButtonsDiv = document.getElementById("gradeButtons");
const termButtonsDiv = document.getElementById("termButtons");
const juniorButtonsDiv = document.getElementById("juniorButtons");
const kanjiListDiv = document.getElementById("kanjiList");
const freeKanjiListDiv = document.getElementById("freeKanjiList");
const freeInputField = document.getElementById("freeInputField");

const stepTerm = document.getElementById("stepTerm");
const stepJunior = document.getElementById("stepJunior");
const stepKanji = document.getElementById("stepKanji");
const stepGrid = document.getElementById("stepGrid");
const stepCount = document.getElementById("stepCount");

// ふりがな付きの文字列を作る
const ruby = (base, yomi) => `<ruby>${base}<rt>${yomi}</rt></ruby>`;

// ===== 項目の表示・非表示（上から順に現れる） =====
function setVisible(el, show) {
  if (show && el.hidden) {
    el.hidden = false;
    el.classList.remove("reveal");
    void el.offsetWidth; // アニメーションをやり直す
    el.classList.add("reveal");
  } else if (!show) {
    el.hidden = true;
  }
}

function countPicked() {
  return document.querySelectorAll("#kanjiList span.selected, #freeKanjiList span.selected").length;
}

function updateFlow() {
  const hasElementary = selectedGrades.some(g => g !== JUNIOR);
  const hasJunior = selectedGrades.includes(JUNIOR);
  const hasPick = countPicked() > 0;

  setVisible(stepTerm, hasElementary);
  setVisible(stepJunior, hasJunior);
  setVisible(stepKanji, kanjiListDiv.children.length > 0);
  setVisible(stepGrid, hasPick);
  setVisible(stepCount, hasPick && gridChosen);
}

// 画面内メッセージ（alertの代わり。ふりがな付きで表示できる）
function showMessage(el, html) {
  el.innerHTML = html;
  el.hidden = false;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.hidden = true; }, 3500);
}

// ===== ② 学年ボタン（1〜6年 と 中学生） =====
function renderGradeButtons() {
  gradeButtonsDiv.innerHTML = "";

  for (let g = 1; g <= 6; g++) {
    if (!elementary[g]) continue;
    const btn = document.createElement("button");
    btn.innerHTML = `${g}${ruby("年", "ねん")}`;
    btn.classList.add("primary-btn");
    btn.onclick = () => toggleGrade(String(g), btn);
    gradeButtonsDiv.appendChild(btn);
  }

  const jbtn = document.createElement("button");
  jbtn.innerHTML = ruby("中学生", "ちゅうがくせい");
  jbtn.classList.add("junior-btn");
  jbtn.onclick = () => toggleGrade(JUNIOR, jbtn);
  gradeButtonsDiv.appendChild(jbtn);
}

function toggleGrade(g, btn) {
  if (selectedGrades.includes(g)) {
    selectedGrades = selectedGrades.filter(x => x !== g);
    btn.classList.remove("active");
  } else {
    selectedGrades.push(g);
    btn.classList.add("active");
  }

  // 外れた学年の学期選択を取り消す
  selectedTerms = selectedTerms.filter(key => selectedGrades.includes(key.split("-")[0]));
  if (!selectedGrades.includes(JUNIOR)) {
    selectedReadings = [];
    document.querySelectorAll("#juniorButtons button").forEach(b => b.classList.remove("active"));
  }

  renderTerms();
  renderKanjiList();
}

// ===== ③ 学期ボタン（1〜6年） =====
function renderTerms() {
  termButtonsDiv.innerHTML = "";

  selectedGrades
    .filter(g => g !== JUNIOR)
    .sort((a, b) => Number(a) - Number(b))
    .forEach(g => {
      const data = elementary[g];
      if (!data) return;

      const wrapper = document.createElement("div");
      wrapper.innerHTML = `<strong>${g}${ruby("年", "ねん")}</strong> `;

      Object.keys(data).sort((a, b) => Number(a) - Number(b)).forEach(t => {
        const key = `${g}-${t}`;
        const btn = document.createElement("button");
        btn.innerHTML = `${t}${ruby("学期", "がっき")}`;
        if (selectedTerms.includes(key)) btn.classList.add("active");
        btn.onclick = () => toggleTerm(key, btn);
        wrapper.appendChild(btn);
      });

      termButtonsDiv.appendChild(wrapper);
    });

  updateFlow();
}

function toggleTerm(key, btn) {
  if (selectedTerms.includes(key)) {
    selectedTerms = selectedTerms.filter(x => x !== key);
    btn.classList.remove("active");
  } else {
    selectedTerms.push(key);
    btn.classList.add("active");
  }
  renderKanjiList();
}

// ===== ③ 読み方ボタン（中学生） =====
function renderJuniorButtons() {
  juniorButtonsDiv.innerHTML = "";
  JUNIOR_GROUPS.forEach(gp => {
    const btn = document.createElement("button");
    btn.textContent = gp.label;
    btn.onclick = () => toggleReading(gp.label, btn);
    juniorButtonsDiv.appendChild(btn);
  });
}

function toggleReading(label, btn) {
  if (selectedReadings.includes(label)) {
    selectedReadings = selectedReadings.filter(x => x !== label);
    btn.classList.remove("active");
  } else {
    selectedReadings.push(label);
    btn.classList.add("active");
  }
  renderKanjiList(); // 読み方を選んだ時点で、すぐ漢字の一覧を出す
}

// ===== ④ 漢字一覧 =====
function renderKanjiList() {
  // 選んでいた漢字は、一覧を作り直しても選択状態を引き継ぐ
  const prevSelected = new Set(
    [...kanjiListDiv.querySelectorAll("span.selected")].map(s => s.textContent)
  );

  const list = [];
  const add = k => { if (!list.includes(k)) list.push(k); };

  // 小学校：学年→学期の順
  Object.keys(elementary).sort((a, b) => Number(a) - Number(b)).forEach(g => {
    Object.keys(elementary[g]).sort((a, b) => Number(a) - Number(b)).forEach(t => {
      if (selectedTerms.includes(`${g}-${t}`)) elementary[g][t].forEach(add);
    });
  });
  // 中学校：読みの順
  JUNIOR_GROUPS.forEach(gp => {
    if (selectedReadings.includes(gp.label)) junior[gp.label].forEach(add);
  });

  kanjiListDiv.innerHTML = "";
  list.forEach(k => {
    const span = document.createElement("span");
    span.textContent = k;
    if (prevSelected.has(k)) span.classList.add("selected");
    span.onclick = () => {
      span.classList.toggle("selected");
      updateFlow();
    };
    kanjiListDiv.appendChild(span);
  });

  updateFlow();
}

// ===== ① 自由入力で追加 =====
function renderFreeKanjiList() {
  freeKanjiListDiv.innerHTML = "";
  freeKanjiList.forEach(k => {
    const span = document.createElement("span");
    span.textContent = k;
    span.classList.add("selected"); // 入力した字は最初からON
    span.onclick = () => {
      span.classList.toggle("selected");
      updateFlow();
    };
    span.ondblclick = () => {
      freeKanjiList = freeKanjiList.filter(x => x !== k);
      renderFreeKanjiList();
    };
    freeKanjiListDiv.appendChild(span);
  });
  updateFlow();
}

function addFreeKanji() {
  const raw = freeInputField.value;
  // 漢字（Hanスクリプト）だけを抽出し、重複を除く
  const chars = [...new Set(raw.match(/\p{Script=Han}/gu) || [])];

  if (chars.length === 0) {
    if (raw.trim() !== "") {
      showMessage(document.getElementById("freeMessage"),
        `${ruby("漢字", "かんじ")}が${ruby("見", "み")}つかりませんでした`);
    }
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
  updateFlow();
};

document.querySelectorAll(".gridBtn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".gridBtn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    gridSize = Number(btn.dataset.grid);
    gridChosen = true;
    updateFlow();
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
    showMessage(document.getElementById("startMessage"),
      `${ruby("出題", "しゅつだい")}する${ruby("漢字", "かんじ")}を${ruby("選択", "せんたく")}してください`);
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
renderJuniorButtons();
updateFlow();
