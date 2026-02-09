import { showLoading, hideLoading } from "./app.js";
let members = [];
let extensions = [];
let selectedMember = null;

export async function renderExtensions() {
  document.getElementById("page-title").innerText = "날떼 기한 연장";

  document.getElementById("page-content").innerHTML = `
    <div class="card">
      <div class="table-wrapper">
        <table class="wide-table">
          <thead>
            <tr class="input-row">
              <th></th>
              <th>
                <input id="e-nickname" placeholder="닉네임" autocomplete="off">
                <div id="nickname-suggest" class="suggest-box"></div>
              </th>
              <th><input id="e-birth" disabled></th>
              <th><input id="e-gender" disabled></th>
              <th><input id="e-region" disabled></th>
              <th><input type="date" id="e-date"></th>
              <th><input id="e-days" disabled></th>
              <th><input id="e-status" value="유지"></th>
              <th><button id="add-extension">등록</button></th>
            </tr>
            <tr>
              <th>No</th>
              <th>닉네임</th>
              <th>나이</th>
              <th>성별</th>
              <th>지역</th>
              <th>입장 날짜</th>
              <th>연장 일수</th>
              <th>사유</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody id="extension-body"></tbody>
        </table>
      </div>
    </div>
  `;

  await loadMembers();
  await loadExtensions();

  document.getElementById("e-nickname").oninput = handleTypeahead;
  document.getElementById("e-date").onchange = calcDays;
  document.getElementById("add-extension").onclick = addExtension;
}

/* ---------- data ---------- */

async function loadMembers() {
  try {
    const res = await fetch("/.netlify/functions/getMembers");
    if (res.ok) members = await res.json();
  } catch (_) {
    members = [];
  }
}

async function loadExtensions() {
  showLoading();
  try {
    const res = await fetch("/.netlify/functions/getExtensions");
    if (!res.ok) throw new Error("목록을 불러오지 못했습니다.");
    extensions = await res.json();
    renderTable();
  } catch (e) {
    alert(e.message || "오류가 발생했습니다.");
  } finally {
    hideLoading();
  }
}

/* ---------- render ---------- */

function renderTable() {
  const body = document.getElementById("extension-body");
  body.innerHTML = extensions.map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(e.nickname)}</td>
      <td>${escapeHtml(e.birth_year)}</td>
      <td>${escapeHtml(e.gender)}</td>
      <td>${escapeHtml(e.region)}</td>
      <td>${formatDate(e.enter_date)}</td>
      <td>${formatDaysFromEnterDate(e.enter_date)}</td>
      <td>${escapeHtml(e.status)}</td>
      <td><button onclick="deleteExtension(${e.id})" aria-label="삭제">🗑</button></td>
    </tr>
  `).join("");
}

/* ---------- typeahead ---------- */

function handleTypeahead(e) {
  const value = e.target.value;
  const box = document.getElementById("nickname-suggest");

  selectedMember = null;
  box.innerHTML = "";

  if (!value) return;

  members
    .filter(m => m.nickname.includes(value))
    .forEach(m => {
      const div = document.createElement("div");
      div.innerText = m.nickname;
      div.onclick = () => selectMember(m);
      box.appendChild(div);
    });
}

function selectMember(m) {
  selectedMember = m;

  document.getElementById("e-nickname").value = m.nickname;
  document.getElementById("e-birth").value = m.birth_year;
  document.getElementById("e-gender").value = m.gender;
  document.getElementById("e-region").value = m.region;

  document.getElementById("nickname-suggest").innerHTML = "";
}

/* ---------- logic ---------- */

function calcDays() {
  const date = document.getElementById("e-date").value;
  if (!date) return;

  const start = new Date(date);
  const today = new Date();
  const diff = Math.ceil((today - start) / (1000 * 60 * 60 * 24));

  document.getElementById("e-days").value = diff;
}

async function addExtension() {
  if (!selectedMember) {
    alert("멤버를 선택하세요");
    return;
  }
  showLoading();
  try {
    const res = await fetch("/.netlify/functions/addExtension", {
      method: "POST",
      body: JSON.stringify({
        member_id: selectedMember.id,
        enter_date: v("e-date"),
        extend_days: v("e-days"),
        status: v("e-status")
      })
    });
    if (!res.ok) throw new Error("등록에 실패했습니다.");
    await loadExtensions();
  } catch (e) {
    alert(e.message || "오류가 발생했습니다.");
  } finally {
    hideLoading();
  }
}

window.deleteExtension = async (id) => {
  showLoading();
  try {
    const res = await fetch("/.netlify/functions/deleteExtension", {
      method: "POST",
      body: JSON.stringify({ id })
    });
    if (!res.ok) throw new Error("삭제에 실패했습니다.");
    await loadExtensions();
  } catch (e) {
    alert(e.message || "오류가 발생했습니다.");
  } finally {
    hideLoading();
  }
};

const v = id => document.getElementById(id).value;

function formatDate(val) {
  if (!val) return "";
  return String(val).substring(0, 10);
}

function formatDaysFromEnterDate(val) {
  const diff = computeDaysSince(val);
  if (diff == null) return "정보 없음";
  return `${diff}일 경과`;
}

function computeDaysSince(val) {
  if (!val) return null;
  const enter = new Date(val);
  if (Number.isNaN(enter.getTime())) return null;
  const today = new Date();
  const diffMs = today.getTime() - enter.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays : 0;
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
