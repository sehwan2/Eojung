import { showLoading, hideLoading } from "./app.js";

let membersCache = [];
let sortState = { key: null, asc: true };
let editingId = null;
let detailModal = null;
let memberModalSetup = false;
let memberModalEditing = false;

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

/* =========================
   렌더
========================= */
export async function renderMembers() {
  document.getElementById("page-title").innerText = "멤버 리스트";

  document.getElementById("page-content").innerHTML = `
    <div class="card">
      <div class="table-wrapper">
        <table class="member-table">
          <thead>
            <tr class="input-row">
              <th class="col-action"></th> <th class="col-no"></th>     <th class="col-nickname"><input id="i-nickname" placeholder="이름"></th>
              <th class="col-birth"><input id="i-birth" type="date"></th>
              <th class="col-phone"><input id="i-phone" placeholder="전화번호"></th>
              <th class="col-gender">
                <select id="i-gender">
                  <option value="">성별</option>
                  <option value="남">남</option>
                  <option value="여">여</option>
                </select>
              </th>
              <th class="col-region"><input id="i-region" placeholder="지역"></th>
              <th class="col-status">
                <select id="i-status">
                  <option>활동</option>
                  <option>외출</option>
                  <option>강퇴</option>
                </select>
              </th>
              <th class="col-chk"><input type="checkbox" id="i-black"></th>
              <th class="col-chk"><input type="checkbox" id="i-admin"></th>
              <th class="col-memo"><input id="i-memo" placeholder="메모"></th>
              <th class="col-action">
                <button id="add-btn">등록</button>
              </th>
            </tr>
            <tr class="header-row">
              <th class="col-action"></th>
              <th class="col-no">No</th>
              <th class="col-nickname sortable" data-key="nickname" data-label="이름">이름</th>
              <th class="col-birth sortable" data-key="birth_date" data-label="생년월일">생년월일</th>
              <th class="col-phone" data-key="phone" data-label="전화번호">전화번호</th>
              <th class="col-gender sortable" data-key="gender" data-label="성별">성별</th>
              <th class="col-region sortable" data-key="region" data-label="지역">지역</th>
              <th class="col-status sortable" data-key="status" data-label="상태">상태</th>
              <th class="col-chk sortable" data-key="black" data-label="블랙">블랙</th>
              <th class="col-chk sortable" data-key="admin" data-label="운영진">운영진</th>
              <th class="col-memo">메모</th>
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
          <div class="member-modal__actions">
            <button type="button" class="member-modal__action-btn" data-member-edit>??</button>
            <button type="button" class="member-modal__action-btn is-danger" data-member-delete>??</button>
            <button type="button" class="member-modal__close" aria-label="??" data-member-modal-close>&times;</button>
          </div>
        </div>
        <div class="member-modal__content">
          <div class="member-modal__grid">
            <div class="member-modal__pair">
              <span class="member-modal__label">생년월일</span>
              <span class="member-modal__value" data-member-field="birth_date"></span>
            </div>
            <div class="member-modal__pair">
              <span class="member-modal__label">전화번호</span>
              <span class="member-modal__value" data-member-field="phone"></span>
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
          <!-- 날떼 연장 기록/불참 기록 - 임시 Hide
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
          -->
        </div>
      </div>
    </div>
  `;

  setupMemberDetailModal();
  document.getElementById("add-btn").onclick = addMember;
  setupResponsiveInputLabels();
  setupAddGenderToggle();
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
        <button class="edit-btn icon-btn icon-edit" onclick="editMember(${m.id})" aria-label="edit">${iconEdit()}</button>
      </td>
      <td class="col-no">${i + 1}</td>
      <td class="col-nickname editable" data-field="nickname">${escapeHtml(m.nickname)}</td>
      <td class="col-birth">${escapeHtml(m.birth_date ? String(m.birth_date).substring(0, 10) : "")}</td>
      <td class="col-phone editable" data-field="phone">${escapeHtml(m.phone || "")}</td>
      <td class="col-gender editable" data-field="gender">${escapeHtml(m.gender)}</td>
      <td class="col-region editable" data-field="region">${escapeHtml(m.region || "")}</td>
      <td class="col-status editable" data-field="status">${escapeHtml(m.status)}</td>
      <td class="col-chk editable center" data-field="black">${m.black ? iconBlackCard() : ""}</td>
      <td class="col-chk editable center" data-field="admin">${m.admin ? iconAdminUser() : ""}</td>
      <td class="col-memo editable" data-field="memo">
        <div class="memo-text">${escapeHtml(m.memo || "")}</div>
      </td>
      <td class="col-action">
        <button class="del-btn icon-btn icon-delete" onclick="deleteMember(${m.id})" aria-label="delete">${iconDelete()}</button>
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
    alert("\uD2E4\uB978 \uBA64\uBC84\uB97C \uC218\uC815 \uC911\uC785\uB2C8\uB2E4. \uBA3C\uC800 \uC800\uC7A5\uD574\uC8FC\uC138\uC694.");
    return;
  }

  editingId = id;
  const row = document.querySelector(`tr[data-id="${id}"]`);
  const member = membersCache.find(m => String(m.id) === String(id));
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
    } else if (field === "gender") {
      td.innerHTML = renderGenderEditor(value, true);
      bindGenderEditor(td);
    } else if (field === "black" || field === "admin") {
      const checked = member ? Boolean(member[field]) : false;
      td.innerHTML = `<input type="checkbox" ${checked ? "checked" : ""}>`;
    } else {
      td.innerHTML = `<input value="${escapeHtml(value)}">`;
    }
  });

  row.querySelector(".edit-btn").innerHTML = iconSave();
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
  const originalMember = membersCache.find(m => String(m.id) === String(id));

  const data = {
    id,
    nickname: row.querySelector('[data-field="nickname"] input').value,
    birth_date: originalMember?.birth_date,
    phone: row.querySelector('[data-field="phone"] input').value,
    gender: getGenderFieldValue(row.querySelector('[data-field="gender"]')),
    region: row.querySelector('[data-field="region"] input').value,
    status: row.querySelector('[data-field="status"] select').value,
    black: row.querySelector('[data-field="black"] input').checked,
    admin: row.querySelector('[data-field="admin"] input').checked,
    memo: row.querySelector('[data-field="memo"] input').value
  };

  if (hasDuplicateMemberIdentity({
    nickname: data.nickname,
    birth_date: originalMember?.birth_date,
    gender: data.gender
  }, id)) {
    showToast("동일한 닉네임/생년월일/성별 조합은 등록할 수 없습니다.");
    return;
  }

  showLoading();
  try {
    const res = await fetch("/.netlify/functions/updateMember", {
      method: "POST",
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("\uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
    showToast("\uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
    editingId = null;
    await loadMembers();
  } catch (e) {
    showToast(e.message || "\uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
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
    birth_date: val("i-birth"),
    phone: val("i-phone"),
    gender: val("i-gender"),
    region: val("i-region"),
    status: val("i-status"),
    black: chk("i-black"),
    admin: chk("i-admin"),
    memo: val("i-memo")
  };

  if (hasDuplicateMemberIdentity(data)) {
    showToast("동일한 닉네임/생년월일/성별 조합은 등록할 수 없습니다.");
    return;
  }

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

function iconEdit() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0 0-3L17.5 5a2.1 2.1 0 0 0-3 0L4 15.5V20zm3.2-2H6v-1.2l8.8-8.8 1.2 1.2L7.2 18z"/></svg>`;
}

function iconDelete() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM6 7h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7z"/></svg>`;
}

function iconSave() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h12l4 4v14H3V3h2zm2 0v6h8V3H7zm0 16h10V11H7v8z"/></svg>`;
}

function iconAdminUser() {
  return `<span class="status-icon status-icon--admin" aria-label="운영진">👤</span>`;
}

function iconBlackCard() {
  return `<span class="status-icon status-icon--black" aria-label="블랙">🟥</span>`;
}

function renderGenderEditor(currentValue, compact = false) {
  const value = String(currentValue || "");
  const maleSelected = value === "\uB0A8";
  const femaleSelected = value === "\uC5EC";
  const cls = compact ? "gender-toggle is-compact" : "gender-toggle";
  const cycleLabel = femaleSelected ? "\uC5EC" : "\uB0A8";
  return `
    <div class="${cls}" data-gender-toggle>
      <button type="button" class="gender-chip${maleSelected ? " is-active" : ""}" data-value="\uB0A8" aria-label="\uB0A8">\u2642</button>
      <button type="button" class="gender-chip${femaleSelected ? " is-active" : ""}" data-value="\uC5EC" aria-label="\uC5EC">\u2640</button>
    </div>
    <button type="button" class="gender-cycle" data-gender-cycle>${cycleLabel}</button>
    <select class="gender-select-native" data-gender-native>
      <option value=""></option>
      <option value="\uB0A8"${maleSelected ? " selected" : ""}>\uB0A8</option>
      <option value="\uC5EC"${femaleSelected ? " selected" : ""}>\uC5EC</option>
    </select>
  `;
}

function bindGenderEditor(scope) {
  if (!scope) return;
  const native = scope.querySelector("[data-gender-native]");
  if (!native) return;
  const cycle = scope.querySelector("[data-gender-cycle]");

  const syncCycle = () => {
    if (!cycle) return;
    const isFemale = native.value === "\uC5EC";
    cycle.textContent = isFemale ? "\uC5EC" : "\uB0A8";
    cycle.classList.toggle("is-female", isFemale);
    cycle.classList.toggle("is-male", !isFemale);
  };

  scope.querySelectorAll("[data-gender-toggle] .gender-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      native.value = btn.dataset.value || "";
      scope.querySelectorAll("[data-gender-toggle] .gender-chip").forEach(chip => {
        chip.classList.toggle("is-active", chip === btn);
      });
      syncCycle();
    });
  });

  if (cycle) {
    cycle.addEventListener("click", () => {
      native.value = native.value === "\uB0A8" ? "\uC5EC" : "\uB0A8";
      scope.querySelectorAll("[data-gender-toggle] .gender-chip").forEach(chip => {
        chip.classList.toggle("is-active", chip.dataset.value === native.value);
      });
      syncCycle();
    });
  }

  syncCycle();
}

function getGenderFieldValue(fieldCell) {
  if (!fieldCell) return "";
  const native = fieldCell.querySelector("[data-gender-native]");
  if (native) return native.value;
  const selected = fieldCell.querySelector("[data-gender-toggle] .gender-chip.is-active");
  if (selected) return selected.dataset.value || "";
  const input = fieldCell.querySelector("input");
  if (input) return input.value;
  return (fieldCell.textContent || "").trim();
}

function setupAddGenderToggle() {
  const select = document.getElementById("i-gender");
  if (!select) return;
  const wrap = select.parentElement;
  if (!wrap) return;

  let toggle = wrap.querySelector("[data-gender-toggle-root]");
  if (!toggle) {
    toggle = document.createElement("div");
    toggle.className = "gender-toggle";
    toggle.dataset.genderToggleRoot = "1";
    toggle.innerHTML = `
      <button type="button" class="gender-chip" data-value="\uB0A8" aria-label="\uB0A8">\u2642</button>
      <button type="button" class="gender-chip" data-value="\uC5EC" aria-label="\uC5EC">\u2640</button>
    `;
    wrap.appendChild(toggle);
  }

  let cycle = wrap.querySelector("[data-gender-cycle-root]");
  if (!cycle) {
    cycle = document.createElement("button");
    cycle.type = "button";
    cycle.className = "gender-cycle";
    cycle.dataset.genderCycleRoot = "1";
    wrap.appendChild(cycle);
  }

  const sync = () => {
    const isFemale = select.value === "\uC5EC";
    toggle.querySelectorAll(".gender-chip").forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.value === select.value);
    });
    cycle.textContent = isFemale ? "\uC5EC" : "\uB0A8";
    cycle.classList.toggle("is-female", isFemale);
    cycle.classList.toggle("is-male", !isFemale);
  };

  toggle.querySelectorAll(".gender-chip").forEach(btn => {
    btn.onclick = () => {
      select.value = btn.dataset.value || "";
      sync();
    };
  });

  cycle.onclick = () => {
    select.value = select.value === "\uB0A8" ? "\uC5EC" : "\uB0A8";
    sync();
  };

  sync();
}

function setupResponsiveInputLabels() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const pairs = [
    ["i-nickname", "이름", "이름"],
    ["i-birth", "생년월일", "생일"],
    ["i-phone", "전화번호", "전화"],
    ["i-region", "지역", "지"],
    ["i-memo", "메모", "메"]
  ];
  pairs.forEach(([id, full, compact]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.placeholder = isMobile ? compact : full;
  });

  if (!window.__memberPlaceholderResizeBound) {
    window.addEventListener("resize", () => setupResponsiveInputLabels());
    window.__memberPlaceholderResizeBound = true;
  }
}

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
    if (event.target.closest("[data-member-edit]")) {
      handleModalEditAction();
      return;
    }
    if (event.target.closest("[data-member-delete]")) {
      handleModalDeleteAction();
      return;
    }
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
  detailModal.dataset.memberId = String(member.id);
  memberModalEditing = false;
  syncModalActionButtons();
  ensureMemberModalEditor();
  setModalEditMode(false);
  updateMemberModalInfo(member);
  detailModal.classList.remove("hidden");
  detailModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  loadMemberRelations(member.id);
}

function hideMemberDetailModal() {
  if (!detailModal) return;
  memberModalEditing = false;
  setModalEditMode(false);
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
    if (field === "birth_date") {
      value = member.birth_date ? String(member.birth_date).substring(0, 10) : "-";
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

function syncModalActionButtons() {
  if (!detailModal) return;
  const editBtn = detailModal.querySelector("[data-member-edit]");
  const deleteBtn = detailModal.querySelector("[data-member-delete]");
  if (editBtn) editBtn.textContent = memberModalEditing ? "저장" : "수정";
  if (deleteBtn) deleteBtn.textContent = memberModalEditing ? "취소" : "삭제";
}

function ensureMemberModalEditor() {
  if (!detailModal) return null;
  let editor = detailModal.querySelector("#member-modal-editor");
  if (editor) return editor;
  const content = detailModal.querySelector(".member-modal__content");
  if (!content) return null;
  editor = document.createElement("section");
  editor.id = "member-modal-editor";
  editor.className = "member-modal__editor hidden";
  editor.innerHTML = `
    <input id="mme-nickname" placeholder="이름" />
    <input type="date" id="mme-birth-date" />
    <input id="mme-phone" placeholder="전화번호" />
    <select id="mme-gender">
      <option value="남">남</option>
      <option value="여">여</option>
    </select>
    <input id="mme-region" placeholder="지역" />
    <select id="mme-status">
      <option>활동</option>
      <option>외출</option>
      <option>강퇴</option>
    </select>
    <label><input type="checkbox" id="mme-black" /> 블랙</label>
    <label><input type="checkbox" id="mme-admin" /> 운영진</label>
    <textarea id="mme-memo" class="full" placeholder="메모"></textarea>
  `;
  content.insertBefore(editor, content.firstElementChild);
  return editor;
}

function setModalEditMode(enabled) {
  if (!detailModal) return;
  const editor = ensureMemberModalEditor();
  const grid = detailModal.querySelector(".member-modal__grid");
  const memo = detailModal.querySelector(".member-modal__memo");
  const sections = detailModal.querySelectorAll(".member-modal__section");
  if (editor) editor.classList.toggle("hidden", !enabled);
  if (grid) grid.classList.toggle("hidden", enabled);
  if (memo) memo.classList.toggle("hidden", enabled);
  sections.forEach(section => section.classList.toggle("hidden", enabled));
  detailModal.classList.toggle("is-editing", enabled);
  syncModalActionButtons();
}

function populateModalEditor(member) {
  const editor = ensureMemberModalEditor();
  if (!editor || !member) return;
  const nickname = editor.querySelector("#mme-nickname");
  const birthDate = editor.querySelector("#mme-birth-date");
  const phone = editor.querySelector("#mme-phone");
  const gender = editor.querySelector("#mme-gender");
  const region = editor.querySelector("#mme-region");
  const status = editor.querySelector("#mme-status");
  const black = editor.querySelector("#mme-black");
  const admin = editor.querySelector("#mme-admin");
  const memo = editor.querySelector("#mme-memo");
  if (nickname) nickname.value = member.nickname || "";
  if (birthDate) birthDate.value = member.birth_date ? String(member.birth_date).substring(0, 10) : "";
  if (phone) phone.value = member.phone || "";
  if (gender) gender.value = member.gender || "남";
  if (region) region.value = member.region || "";
  if (status) status.value = member.status || "활동";
  if (black) black.checked = Boolean(member.black);
  if (admin) admin.checked = Boolean(member.admin);
  if (memo) memo.value = member.memo || "";
}

function getActiveModalMember() {
  if (!detailModal) return null;
  const id = detailModal.dataset.memberId;
  if (!id) return null;
  return membersCache.find(m => String(m.id) === String(id)) || null;
}

async function handleModalEditAction() {
  const member = getActiveModalMember();
  if (!member) return;
  if (!memberModalEditing) {
    memberModalEditing = true;
    populateModalEditor(member);
    setModalEditMode(true);
    return;
  }
  const editor = ensureMemberModalEditor();
  if (!editor) return;
  const payload = {
    id: member.id,
    nickname: editor.querySelector("#mme-nickname")?.value || "",
    birth_date: editor.querySelector("#mme-birth-date")?.value || "",
    phone: editor.querySelector("#mme-phone")?.value || "",
    gender: editor.querySelector("#mme-gender")?.value || "남",
    region: editor.querySelector("#mme-region")?.value || "",
    status: editor.querySelector("#mme-status")?.value || "활동",
    black: Boolean(editor.querySelector("#mme-black")?.checked),
    admin: Boolean(editor.querySelector("#mme-admin")?.checked),
    memo: editor.querySelector("#mme-memo")?.value || ""
  };

  if (hasDuplicateMemberIdentity({
    nickname: payload.nickname,
    birth_date: payload.birth_date,
    gender: payload.gender
  }, member.id)) {
    showToast("동일한 닉네임/생년월일/성별 조합은 등록할 수 없습니다.");
    return;
  }

  showLoading();
  try {
    const res = await fetch("/.netlify/functions/updateMember", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("수정에 실패했습니다.");
    await loadMembers();
    const refreshed = membersCache.find(m => String(m.id) === String(member.id));
    if (refreshed) {
      updateMemberModalInfo(refreshed);
      detailModal.dataset.memberId = String(refreshed.id);
    }
    memberModalEditing = false;
    setModalEditMode(false);
    showToast("수정되었습니다.");
  } catch (error) {
    showToast(error.message || "오류가 발생했습니다.");
  } finally {
    hideLoading();
  }
}

function handleModalDeleteAction() {
  const member = getActiveModalMember();
  if (!member) return;
  if (memberModalEditing) {
    memberModalEditing = false;
    setModalEditMode(false);
    updateMemberModalInfo(member);
    return;
  }
  hideMemberDetailModal();
  window.deleteMember(member.id);
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

function normalizeIdentityValue(value) {
  if (value == null) return "";
  return String(value).trim();
}

function hasDuplicateMemberIdentity(target, excludeId = null) {
  const targetNickname = normalizeIdentityValue(target?.nickname).toLowerCase();
  const targetBirthDate = normalizeIdentityValue(target?.birth_date);
  const targetGender = normalizeIdentityValue(target?.gender);
  if (!targetNickname || !targetBirthDate || !targetGender) return false;

  return membersCache.some(member => {
    if (excludeId != null && String(member.id) === String(excludeId)) return false;
    const memberNickname = normalizeIdentityValue(member.nickname).toLowerCase();
    const memberBirthDate = normalizeIdentityValue(member.birth_date);
    const memberGender = normalizeIdentityValue(member.gender);
    return (
      memberNickname === targetNickname &&
      memberBirthDate === targetBirthDate &&
      memberGender === targetGender
    );
  });
}
