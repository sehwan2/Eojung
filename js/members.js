import { showLoading, hideLoading } from "./app.js";

let membersCache = [];
let sortState = { key: null, asc: true };
let editingId = null;
let detailModal = null;
let memberModalSetup = false;

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

/* =========================
   렌더
========================= */
/* =========================
   렌더 (수정본)
========================= */
export async function renderMembers() {
  document.getElementById("page-title").innerText = "멤버 리스트";

  document.getElementById("page-content").innerHTML = `
    <div class="card">
      <div class="table-wrapper">
        <table class="member-table">
          <thead>
            <tr class="input-row">
              <th class="col-action"></th> <th class="col-no"></th>     <th class="col-nickname"><input id="i-nickname" placeholder="닉네임"></th>
              <th class="col-birth"><input id="i-birth" placeholder="년생"></th>
              <th class="col-gender">
                <select id="i-gender">
                  <option value="">성별</option>
                  <option value="남">남</option>
                  <option value="여">여</option>
                </select>
              </th>
              <th class="col-region"><input id="i-region" placeholder="지역"></th>
              <th class="col-chk"><input type="checkbox" id="i-doc"></th>
              <th class="col-realname"><input id="i-realname" placeholder="본명"></th>
              <th class="col-status">
                <select id="i-status">
                  <option>활동</option>
                  <option>외출</option>
                  <option>강퇴</option>
                </select>
              </th>
              <th class="col-chk"><input type="checkbox" id="i-black"></th>
              <th class="col-chk"><input type="checkbox" id="i-admin"></th>
              <th class="col-memo"><input id="i-memo" placeholder="비고"></th>
              <th class="col-action">
                <button id="add-btn">등록</button>
              </th>
            </tr>
            <tr class="header-row">
              <th class="col-action"></th>
              <th class="col-no">No</th>
              <th class="col-nickname sortable" data-key="nickname" data-label="닉네임">닉네임</th>
              <th class="col-birth sortable" data-key="birth_year" data-label="나이">나이</th>
              <th class="col-gender sortable" data-key="gender" data-label="성별">성별</th>
              <th class="col-region sortable" data-key="region" data-label="지역">지역</th>
              <th class="col-chk sortable" data-key="doc_confirm" data-label="서류">서류</th>
              <th class="col-realname">본명</th>
              <th class="col-status sortable" data-key="status" data-label="상태">상태</th>
              <th class="col-chk sortable" data-key="black" data-label="블랙">블랙</th>
              <th class="col-chk sortable" data-key="admin" data-label="운영진">운영진</th>
              <th class="col-memo">비고</th>
              <th class="col-action">삭제</th>
            </tr>
          </thead>
          <tbody id="member-body"></tbody>
        </table>
      </div>
    </div>
    <div id="member-detail-modal" class="member-modal hidden" aria-hidden="true">
      <div class="member-modal__backdrop" data-member-modal-close></div>
      <div class="member-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="member-modal-title">
        <div class="member-modal__header">
          <div>
            <p id="member-modal-title" class="member-modal__name" data-member-nickname></p>
            <p class="member-modal__subtitle" data-member-subtitle></p>
          </div>
          <button type="button" class="member-modal__close" aria-label="닫기" data-member-modal-close>&times;</button>
        </div>
        <div class="member-modal__content">
          <div class="member-modal__grid">
            <div class="member-modal__pair">
              <span class="member-modal__label">생년</span>
              <span class="member-modal__value" data-member-field="birth_year"></span>
            </div>
            <div class="member-modal__pair">
              <span class="member-modal__label">성별</span>
              <span class="member-modal__value" data-member-field="gender"></span>
            </div>
            <div class="member-modal__pair">
              <span class="member-modal__label">지역</span>
              <span class="member-modal__value" data-member-field="region"></span>
            </div>
            <div class="member-modal__pair">
              <span class="member-modal__label">상태</span>
              <span class="member-modal__value" data-member-field="status"></span>
            </div>
            <div class="member-modal__pair">
              <span class="member-modal__label">서류확인</span>
              <span class="member-modal__value" data-member-field="doc_confirm"></span>
            </div>
            <div class="member-modal__pair">
              <span class="member-modal__label">블랙리스트</span>
              <span class="member-modal__value" data-member-field="black"></span>
            </div>
            <div class="member-modal__pair">
              <span class="member-modal__label">관리자</span>
              <span class="member-modal__value" data-member-field="admin"></span>
            </div>
          </div>
          <div class="member-modal__memo">
            <span class="member-modal__label">메모</span>
            <p class="member-modal__value" data-member-field="memo"></p>
          </div>
          <section class="member-modal__section">
            <div class="member-modal__section-head">
              <h3>날떼 연장 기록</h3>
            </div>
            <div id="member-extensions" class="member-modal__records"></div>
          </section>
          <section class="member-modal__section">
            <div class="member-modal__section-head">
              <h3>불참 기록</h3>
            </div>
            <div id="member-absences" class="member-modal__records"></div>
          </section>
        </div>
      </div>
    </div>
  `;

  setupMemberDetailModal();
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
  try {
    const res = await fetch("/.netlify/functions/getMembers");
    if (!res.ok) throw new Error("멤버 목록을 불러오지 못했습니다.");
    membersCache = await res.json();
    renderTable(membersCache);
    attachMemberRowHandler();
    document.querySelectorAll(".sortable").forEach(th => {
      th.onclick = () => sortBy(th.dataset.key);
    });
    updateSortIndicators();
  } catch (e) {
    showToast(e.message || "오류가 발생했습니다.");
  } finally {
    hideLoading();
  }
}

/* =========================
   테이블 렌더
========================= */
function renderTable(list) {
  const body = document.getElementById("member-body");
  body.innerHTML = list.map((m, i) => `
    <tr data-id="${m.id}">
      <td class="col-action">
        <button class="edit-btn" onclick="editMember(${m.id})" aria-label="수정">✏️</button>
      </td>
      <td class="col-no">${i + 1}</td>
      <td class="col-nickname editable" data-field="nickname">${escapeHtml(m.nickname)}</td>
      <td class="col-birth">${escapeHtml(m.birth_year)}</td>
      <td class="col-gender">${escapeHtml(m.gender)}</td>
      <td class="col-region editable" data-field="region">${escapeHtml(m.region || "")}</td>
      <td class="col-chk center">${m.doc_confirm ? "✔" : ""}</td>
      <td class="col-realname">${escapeHtml(m.real_name || "")}</td>
      <td class="col-status editable" data-field="status">${escapeHtml(m.status)}</td>
      <td class="col-chk editable center" data-field="black">${m.black ? "✔" : ""}</td>
      <td class="col-chk editable center" data-field="admin">${m.admin ? "✔" : ""}</td>
      <td class="col-memo editable" data-field="memo">${escapeHtml(m.memo || "")}</td>
      <td class="col-action">
        <button class="del-btn" onclick="deleteMember(${m.id})" aria-label="삭제">🗑</button>
      </td>
    </tr>
  `).join("");
}
/* =========================
   정렬
========================= */
function sortBy(key) {
  sortState.asc = sortState.key === key ? !sortState.asc : true;
  sortState.key = key;

  const sorted = [...membersCache].sort((a, b) => {
    if (a[key] > b[key]) return sortState.asc ? 1 : -1;
    if (a[key] < b[key]) return sortState.asc ? -1 : 1;
    return 0;
  });

  renderTable(sorted);
  attachMemberRowHandler();
  updateSortIndicators();
}

function updateSortIndicators() {
  document.querySelectorAll(".sortable").forEach(th => {
    const label = th.dataset.label || th.textContent.trim().replace(/\s*[↑↓]\s*$/, "");
    const key = th.dataset.key;
    const arrow =
      sortState.key === key
        ? (sortState.asc ? " ↑" : " ↓")
        : "";
    th.innerHTML = label + (arrow ? `<span class="sort-arrow">${arrow}</span>` : "");
  });
}

/* =========================
   ✏️ 수정
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
      td.innerHTML = `<input value="${escapeHtml(value)}">`;
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
  try {
    const res = await fetch("/.netlify/functions/updateMember", {
      method: "POST",
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("저장에 실패했습니다.");
    showToast("저장되었습니다 ✅");
    editingId = null;
    await loadMembers();
  } catch (e) {
    showToast(e.message || "오류가 발생했습니다.");
  } finally {
    hideLoading();
  }
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
  try {
    const res = await fetch("/.netlify/functions/addMember", {
      method: "POST",
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("등록에 실패했습니다.");
    showToast("저장되었습니다 ✅");
    await loadMembers();
  } catch (e) {
    showToast(e.message || "오류가 발생했습니다.");
  } finally {
    hideLoading();
  }
}

window.deleteMember = async (id) => {
  const ok = confirm("정말 이 멤버를 삭제할까요?\n되돌릴 수 없습니다.");
  if (!ok) return;

  showLoading();
  try {
    const res = await fetch("/.netlify/functions/deleteMember", {
      method: "POST",
      body: JSON.stringify({ id })
    });
    if (!res.ok) throw new Error("삭제에 실패했습니다.");
    await loadMembers();
  } catch (e) {
    showToast(e.message || "오류가 발생했습니다.");
  } finally {
    hideLoading();
  }
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

/** HTML 이스케이프 (XSS 방지) */
function escapeHtml(str) {
  if (str == null) return "";
  const s = String(str);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(value) {
  if (!value) return "";
  return String(value).substring(0, 10);
}

function attachMemberRowHandler() {
  const body = document.getElementById("member-body");
  if (!body || body.dataset.detailListener) return;
  body.dataset.detailListener = "1";
  body.addEventListener("click", (event) => {
    if (event.target.closest("button") || event.target.closest("input") || event.target.closest("select")) return;
    const row = event.target.closest("tr[data-id]");
    if (!row || row.classList.contains("editing")) return;
    const memberId = row.dataset.id;
    if (!memberId) return;
    const member = membersCache.find(m => String(m.id) === memberId);
    if (!member) return;
    showMemberDetailModal(member);
  });
}

function setupMemberDetailModal() {
  detailModal = document.getElementById("member-detail-modal");
  if (!detailModal) return;
  if (detailModal.dataset.modalInit) return;
  detailModal.dataset.modalInit = "1";

  detailModal.addEventListener("click", (event) => {
    if (event.target === detailModal || event.target.closest("[data-member-modal-close]")) {
      hideMemberDetailModal();
    }
  });

  if (memberModalSetup) return;
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && detailModal && !detailModal.classList.contains("hidden")) {
      hideMemberDetailModal();
    }
  });
  memberModalSetup = true;
}

function showMemberDetailModal(member) {
  setupMemberDetailModal();
  if (!detailModal) return;
  updateMemberModalInfo(member);
  detailModal.classList.remove("hidden");
  detailModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  loadMemberRelations(member.id);
}

function hideMemberDetailModal() {
  if (!detailModal) return;
  detailModal.classList.add("hidden");
  detailModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function updateMemberModalInfo(member) {
  if (!detailModal) return;
  const nicknameEl = detailModal.querySelector("[data-member-nickname]");
  const subtitleEl = detailModal.querySelector("[data-member-subtitle]");
  if (nicknameEl) nicknameEl.textContent = member.nickname || "알 수 없음";
  if (subtitleEl) {
    const regionLabel = member.region || "지역 없음";
    subtitleEl.textContent = `ID ${member.id} · ${regionLabel}`;
  }

  detailModal.querySelectorAll("[data-member-field]").forEach(el => {
    const field = el.dataset.memberField;
    let value = member[field];
    if (field === "doc_confirm") {
      value = formatBooleanLabel(member.doc_confirm, "완료", "미완료");
    } else if (field === "black") {
      value = formatBooleanLabel(member.black, "예", "아니오");
    } else if (field === "admin") {
      value = formatBooleanLabel(member.admin, "예", "아니오");
    } else if (field === "memo") {
      value = member.memo ? member.memo : "없음";
    } else {
      value = value ?? "-";
    }
    el.textContent = value;
  });
}

async function loadMemberRelations(memberId) {
  if (!detailModal) return;
  const extContainer = detailModal.querySelector("#member-extensions");
  const absContainer = detailModal.querySelector("#member-absences");
  if (!extContainer || !absContainer) return;

  const placeholder = `<p class="member-modal__placeholder">불러오는 중…</p>`;
  extContainer.innerHTML = placeholder;
  absContainer.innerHTML = placeholder;

  try {
    const [extRes, absRes] = await Promise.all([
      fetch(`/.netlify/functions/getExtensions?memberId=${memberId}`),
      fetch(`/.netlify/functions/getAbsences?memberId=${memberId}`)
    ]);

    if (!extRes.ok || !absRes.ok) {
      throw new Error("관련 정보를 불러오는 중 오류가 발생했습니다.");
    }

    const [extensions, absences] = await Promise.all([extRes.json(), absRes.json()]);
    extContainer.innerHTML = renderExtensionRecords(extensions);
    absContainer.innerHTML = renderAbsenceRecords(absences);
  } catch (error) {
    const message = error.message || "관련 정보를 불러오지 못했습니다.";
    extContainer.innerHTML = `<p class="member-modal__error">${message}</p>`;
    absContainer.innerHTML = `<p class="member-modal__error">${message}</p>`;
    showToast(message);
  }
}

function renderExtensionRecords(list) {
  if (!list || !list.length) {
    return `<p class="member-modal__placeholder">기록 없음</p>`;
  }

  return list.map(item => {
    const dateLabel = formatDate(item.enter_date) || "날짜 없음";
    const daysLabel = item.extend_days != null ? `${item.extend_days}일 연장` : "일수 없음";
    return `
      <article class="member-modal__record">
        <div>
          <p class="member-modal__record-label">${dateLabel}</p>
          <p class="member-modal__record-sub">${daysLabel}</p>
        </div>
        <span class="member-modal__record-meta">${escapeHtml(item.status || "-")}</span>
      </article>
    `;
  }).join("");
}

function renderAbsenceRecords(list) {
  if (!list || !list.length) {
    return `<p class="member-modal__placeholder">기록 없음</p>`;
  }

  return list.map(item => {
    const dateLabel = formatDate(item.event_datetime) || "날짜 없음";
    const noticeLabel = escapeHtml(item.notice_time || "시간 없음");
    const hostLabel = escapeHtml(item.host || "벙주 없음");
    return `
      <article class="member-modal__record">
        <div>
          <p class="member-modal__record-label">${dateLabel}</p>
          <p class="member-modal__record-sub">${noticeLabel}</p>
        </div>
        <span class="member-modal__record-meta">벙주 :  ${hostLabel}</span>
      </article>
    `;
  }).join("");
}

function formatBooleanLabel(value, positive, negative) {
  return value ? positive : negative;
}
