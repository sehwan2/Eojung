import { showLoading, hideLoading } from "./app.js";

let membersCache = [];
let sortState = { key: null, asc: true };
let editingId = null;

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}


/* =========================
   렌더
========================= */
export async function renderMembers() {
  document.getElementById("page-title").innerText = "멤버 리스트";

  document.getElementById("page-content").innerHTML = `
    <div class="card">
      <div class="table-wrapper">
        <table class="wide-table">
          <thead>
            <tr class="input-row">
              <th></th>
              <th><input id="i-nickname" placeholder="닉네임"></th>
              <th><input id="i-birth" placeholder="년생"></th>
              <th>
                <select id="i-gender">
                  <option value="">성별</option>
                  <option value="남">남</option>
                  <option value="여">여</option>
                </select>
              </th>
              <th><input id="i-region" placeholder="지역"></th>
              <th><input type="checkbox" id="i-doc"></th>
              <th><input id="i-realname" placeholder="본명"></th>
              <th><input id="i-status" placeholder="상태"></th>
              <th><input type="checkbox" id="i-black"></th>
              <th><input type="checkbox" id="i-admin"></th>
              <th><input id="i-memo" placeholder="비고"></th>
              <th><button id="add-btn">등록</button></th>
            </tr>
            <tr>
              <th></th>
              ${header("No")}
              ${header("닉네임", "nickname")}
              ${header("나이", "birth_year")}
              ${header("성별", "gender")}
              ${header("지역", "region")}
              ${header("서류")}
              ${header("본명")}
              ${header("상태", "status")}
              ${header("블랙")}
              ${header("운영진")}
              <th>비고</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody id="member-body"></tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById("add-btn").onclick = addMember;
  await loadMembers();
}

function header(label, key) {
  if (!key) return `<th>${label}</th>`;
  return `<th class="sortable" data-key="${key}">${label}</th>`;
}

/* =========================
   데이터 로딩
========================= */
async function loadMembers() {
  showLoading();
  const res = await fetch("/.netlify/functions/getMembers");
  membersCache = await res.json();
  renderTable(membersCache);

  document.querySelectorAll(".sortable").forEach(th => {
    th.onclick = () => sortBy(th.dataset.key);
  });

  hideLoading();
}

/* =========================
   테이블
========================= */
function renderTable(list) {
  const body = document.getElementById("member-body");

  body.innerHTML = list.map((m, i) => `
    <tr data-id="${m.id}">
      <td>
        <button class="edit-btn" onclick="editMember(${m.id})">✏️</button>
      </td>
      <td>${i + 1}</td>

      <td class="editable" data-field="nickname">${m.nickname}</td>
      <td>${m.birth_year}</td>
      <td>${m.gender}</td>

      <td class="editable" data-field="region">${m.region || ""}</td>
      <td>${m.doc_confirm ? "✔" : ""}</td>
      <td>${m.real_name || ""}</td>

      <td class="editable" data-field="status">${m.status}</td>
      <td class="editable" data-field="black">${m.black ? "✔" : ""}</td>
      <td class="editable" data-field="admin">${m.admin ? "✔" : ""}</td>
      <td class="editable" data-field="memo">${m.memo || ""}</td>

      <td>
        <button class="del-btn" onclick="deleteMember(${m.id})">🗑</button>
      </td>
    </tr>
  `).join("");
}

function sortBy(key) {
  sortState.asc = sortState.key === key ? !sortState.asc : true;
  sortState.key = key;

  const sorted = [...membersCache].sort((a, b) => {
    if (a[key] > b[key]) return sortState.asc ? 1 : -1;
    if (a[key] < b[key]) return sortState.asc ? -1 : 1;
    return 0;
  });

  renderTable(sorted);
}

/* =========================
   ✏️ 수정 모드
========================= */
window.editMember = (id) => {
  if (editingId && editingId !== id) {
    alert("다른 멤버를 수정 중입니다. 먼저 저장하세요.");
    return;
  }

  editingId = id;
  const row = document.querySelector(`tr[data-id="${id}"]`);
  row.classList.add("editing");

  row.querySelectorAll(".editable").forEach(td => {
    const field = td.dataset.field;
    const value = td.innerText.trim();

    if (field === "status") {
      td.innerHTML = `
        <select>
          <option>활동</option>
          <option>외출</option>
          <option>강퇴</option>
        </select>`;
      td.querySelector("select").value = value;
    } else if (field === "black" || field === "admin") {
      td.innerHTML = `<input type="checkbox" ${value === "✔" ? "checked" : ""}>`;
    } else {
      td.innerHTML = `<input value="${value}">`;
    }
  });

  row.querySelector(".edit-btn").innerText = "💾";
  row.querySelector(".edit-btn").onclick = () => saveMember(id);

  const delBtn = row.querySelector(".del-btn");
  delBtn.disabled = true;
  delBtn.style.opacity = 0.3;
};

/* =========================
   💾 저장
========================= */
async function saveMember(id) {
  const row = document.querySelector(`tr[data-id="${id}"]`);

  const data = {
    id,
    nickname: row.querySelector('[data-field="nickname"] input').value,
    region: row.querySelector('[data-field="region"] input').value,
    status: row.querySelector('[data-field="status"] select').value,
    black: row.querySelector('[data-field="black"] input').checked,
    admin: row.querySelector('[data-field="admin"] input').checked,
    memo: row.querySelector('[data-field="memo"] input').value
  };

  showLoading();
  await fetch("/.netlify/functions/updateMember", {
    method: "POST",
    body: JSON.stringify(data)
  });
  hideLoading();
  showToast("저장되었습니다 ✅");
  editingId = null;
  await loadMembers();
}

/* =========================
   ➕ 추가 / ❌ 삭제
========================= */
async function addMember() {
  const data = {
    nickname: val("i-nickname"),
    birth_year: val("i-birth"),
    gender: val("i-gender"),
    region: val("i-region"),
    doc_confirm: chk("i-doc"),
    real_name: val("i-realname"),
    status: val("i-status"),
    black: chk("i-black"),
    admin: chk("i-admin"),
    memo: val("i-memo")
  };

  showLoading();
  await fetch("/.netlify/functions/addMember", {
    method: "POST",
    body: JSON.stringify(data)
  });
  hideLoading();
  showToast("저장되었습니다 ✅");
  await loadMembers();
}

window.deleteMember = async (id) => {
  const ok = confirm("정말 이 멤버를 삭제할까요?\n되돌릴 수 없습니다.");
  if (!ok) return;

  showLoading();
  await fetch("/.netlify/functions/deleteMember", {
    method: "POST",
    body: JSON.stringify({ id })
  });
  hideLoading();

  await loadMembers();
};

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && editingId) {
    const ok = confirm("수정을 취소할까요?");
    if (!ok) return;

    editingId = null;
    loadMembers(); // 원래 데이터로 복구
  }
});

const val = id => document.getElementById(id).value;
const chk = id => document.getElementById(id).checked;
