import { showLoading, hideLoading, getAuthHeaders } from "./app.js";

let members = [];
let extensions = [];
let selectedMember = null;
let sortState = { key: null, asc: true };

export async function renderExtensions() {
  document.getElementById("page-title").innerText = "\uB0A0\uB5BC \uAE30\uD55C \uC5F0\uC7A5";

  document.getElementById("page-content").innerHTML = `
    <div class="card">
      <div class="table-wrapper">
        <table class="wide-table">
          <thead>
            <tr class="input-row">
              <th class="col-no"></th>
              <th class="col-nickname">
                <input id="e-nickname" placeholder="이름" autocomplete="off">
                <div id="nickname-suggest" class="suggest-box"></div>
              </th>
              <th class="col-birth"><input id="e-birth" disabled></th>
              <th class="col-gender"><input id="e-gender" disabled></th>
              <th class="col-region"><input id="e-region" disabled></th>
              <th class="col-date"><input type="date" id="e-date"></th>
              <th class="col-days"><input id="e-days" disabled></th>
              <th class="col-status"><input id="e-status" value="\uC720\uC9C0"></th>
              <th class="col-action"><button id="add-extension">\uB4F1\uB85D</button></th>
            </tr>
            <tr>
              <th class="col-no">No</th>
              <th class="col-nickname sortable" data-key="nickname" data-label="이름">이름</th>
              <th class="col-birth sortable" data-key="birth_date" data-label="\uC0DD\uB144\uC6D4\uC77C">\uC0DD\uB144\uC6D4\uC77C</th>
              <th class="col-gender sortable" data-key="gender" data-label="\uC131\uBCC4">\uC131\uBCC4</th>
              <th class="col-region sortable" data-key="region" data-label="\uC9C0\uC5ED">\uC9C0\uC5ED</th>
              <th class="col-date sortable" data-key="enter_date" data-label="\uC785\uC7A5 \uB0A0\uC9DC">\uC785\uC7A5 \uB0A0\uC9DC</th>
              <th class="col-days sortable" data-key="extend_days" data-label="\uC5F0\uC7A5 \uC77C\uC218">\uC5F0\uC7A5 \uC77C\uC218</th>
              <th class="col-status sortable" data-key="status" data-label="\uC0AC\uC720">\uC0AC\uC720</th>
              <th class="col-action">\uC0AD\uC81C</th>
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
    if (!res.ok) throw new Error("\uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    extensions = await res.json();
    renderSortedTable();
  } catch (e) {
    alert(e.message || "\uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
  } finally {
    hideLoading();
  }
}

function renderTable() {
  const body = document.getElementById("extension-body");
  const sorted = getSortedExtensions();
  body.innerHTML = sorted.map((e, i) => `
    <tr>
      <td class="col-no">${i + 1}</td>
      <td class="col-nickname">${escapeHtml(e.nickname)}</td>
      <td class="col-birth">${escapeHtml(e.birth_date ? String(e.birth_date).substring(0, 10) : "")}</td>
      <td class="col-gender">${escapeHtml(e.gender)}</td>
      <td class="col-region">${escapeHtml(e.region)}</td>
      <td class="col-date">${formatDate(e.enter_date)}</td>
      <td class="col-days">${formatDaysFromEnterDate(e.enter_date)}</td>
      <td class="col-status">${escapeHtml(e.status)}</td>
      <td class="col-action"><button class="icon-btn icon-delete" onclick="deleteExtension(${e.id})" aria-label="\uC0AD\uC81C">${iconDelete()}</button></td>
    </tr>
  `).join("");
}

function renderSortedTable() {
  renderTable();
  bindSortHandlers();
  updateSortIndicators();
}

function bindSortHandlers() {
  document.querySelectorAll(".wide-table .sortable").forEach(th => {
    th.onclick = () => sortBy(th.dataset.key);
  });
}

function sortBy(key) {
  sortState.asc = sortState.key === key ? !sortState.asc : true;
  sortState.key = key;
  renderSortedTable();
}

function getSortedExtensions() {
  if (!sortState.key) return [...extensions];
  const key = sortState.key;
  return [...extensions].sort((a, b) => {
    const left = getSortValue(a, key);
    const right = getSortValue(b, key);
    if (left > right) return sortState.asc ? 1 : -1;
    if (left < right) return sortState.asc ? -1 : 1;
    return 0;
  });
}

function getSortValue(item, key) {
  if (key === "enter_date") {
    const ts = new Date(item.enter_date).getTime();
    return Number.isNaN(ts) ? -Infinity : ts;
  }
  if (key === "extend_days") {
    const days = computeDaysSince(item.enter_date);
    return days == null ? -Infinity : days;
  }
  if (key === "birth_date") {
    const ts = new Date(item.birth_date).getTime();
    return Number.isNaN(ts) ? -Infinity : ts;
  }
  return String(item[key] ?? "").toLowerCase();
}

function updateSortIndicators() {
  document.querySelectorAll(".wide-table .sortable").forEach(th => {
    const key = th.dataset.key;
    const baseLabel = th.dataset.label || th.textContent.trim();
    const arrow = sortState.key === key ? (sortState.asc ? " \u2191" : " \u2193") : "";
    th.innerHTML = `${baseLabel}${arrow ? `<span class="sort-arrow">${arrow}</span>` : ""}`;
  });
}

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
  document.getElementById("e-birth").value = m.birth_date ? String(m.birth_date).substring(0, 10) : "";
  document.getElementById("e-gender").value = m.gender;
  document.getElementById("e-region").value = m.region;

  document.getElementById("nickname-suggest").innerHTML = "";
}

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
    alert("\uBA64\uBC84\uB97C \uC120\uD0DD\uD558\uC138\uC694.");
    return;
  }
  showLoading();
  try {
    const res = await fetch("/.netlify/functions/addExtension", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        member_id: selectedMember.id,
        enter_date: v("e-date"),
        extend_days: v("e-days"),
        status: v("e-status")
      })
    });
    if (!res.ok) throw new Error("\uB4F1\uB85D\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
    await loadExtensions();
  } catch (e) {
    alert(e.message || "\uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
  } finally {
    hideLoading();
  }
}

window.deleteExtension = async (id) => {
  showLoading();
  try {
    const res = await fetch("/.netlify/functions/deleteExtension", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify({ id })
    });
    if (!res.ok) throw new Error("\uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
    await loadExtensions();
  } catch (e) {
    alert(e.message || "\uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
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
  if (diff == null) return "\uC815\uBCF4 \uC5C6\uC74C";
  return `${diff}\uC77C \uACBD\uACFC`;
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

function iconDelete() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM6 7h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7z"/></svg>`;
}
