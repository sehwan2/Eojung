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
  const res = await fetch("/.netlify/functions/getMembers");
  members = await res.json();
}

async function loadExtensions() {
  showLoading();
  const res = await fetch("/.netlify/functions/getExtensions");
  extensions = await res.json();
  renderTable();
  hideLoading();
}

/* ---------- render ---------- */

function renderTable() {
  const body = document.getElementById("extension-body");
  body.innerHTML = extensions.map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${e.nickname}</td>
      <td>${e.birth_year}</td>
      <td>${e.gender}</td>
      <td>${e.region}</td>
      <td>${e.enter_date}</td>
      <td>${e.extend_days}</td>
      <td>${e.status}</td>
      <td><button onclick="deleteExtension(${e.id})">🗑</button></td>
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

  await fetch("/.netlify/functions/addExtension", {
    method: "POST",
    body: JSON.stringify({
      member_id: selectedMember.id,
      enter_date: v("e-date"),
      extend_days: v("e-days"),
      status: v("e-status")
    })
  });

  await loadExtensions();
}

window.deleteExtension = async (id) => {
  await fetch("/.netlify/functions/deleteExtension", {
    method: "POST",
    body: JSON.stringify({ id })
  });
  await loadExtensions();
};

const v = id => document.getElementById(id).value;
