import { showLoading, hideLoading, getAuthHeaders } from "./app.js";

let members = [];
let absences = [];
let selectedMember = null;
let sortState = { key: null, asc: true };

export async function renderAbsences() {
  showLoading();
  document.getElementById("page-title").innerText = "\uBC99 \uBD88\uCC38\uC790 \uAD00\uB9AC";

  document.getElementById("page-content").innerHTML = `
    <div class="card">
      <div class="table-wrapper">
        <table class="absence-table">
          <thead>
            <tr class="input-row">
              <th class="col-no"></th>
              <th class="col-nickname" style="position:relative">
                <input id="abs-nickname" placeholder="이름" autocomplete="off" />
                <div id="abs-suggest" class="suggest-box"></div>
              </th>
              <th class="col-birth"><input id="abs-birth" disabled /></th>
              <th class="col-gender"><input id="abs-gender" disabled /></th>
              <th class="col-region"><input id="abs-region" disabled /></th>
              <th class="col-date"><input id="abs-datetime" type="date" /></th>
              <th class="col-host"><input id="abs-host" placeholder="\uBC99\uC8FC" /></th>
              <th class="col-notice">
                <select id="abs-notice">
                  <option value="">\uC120\uD0DD</option>
                  <option value="2\uC77C\uC804">2\uC77C\uC804</option>
                  <option value="1\uC77C\uC804">1\uC77C\uC804</option>
                  <option value="\uB2F9\uC77C">\uB2F9\uC77C</option>
                </select>
              </th>
              <th class="col-action">
                <button id="abs-add-btn">\uB4F1\uB85D</button>
              </th>
            </tr>
            <tr>
              <th class="col-no">No</th>
              <th class="col-nickname sortable" data-key="nickname" data-label="이름">이름</th>
              <th class="col-birth sortable" data-key="birth_date" data-label="\uC0DD\uB144\uC6D4\uC77C">\uC0DD\uB144\uC6D4\uC77C</th>
              <th class="col-gender sortable" data-key="gender" data-label="\uC131\uBCC4">\uC131\uBCC4</th>
              <th class="col-region sortable" data-key="region" data-label="\uC9C0\uC5ED">\uC9C0\uC5ED</th>
              <th class="col-date sortable" data-key="event_datetime" data-label="\uBC99 \uB0A0\uC9DC">\uBC99 \uB0A0\uC9DC</th>
              <th class="col-host sortable" data-key="host" data-label="\uBC99\uC8FC">\uBC99\uC8FC</th>
              <th class="col-notice sortable" data-key="notice_time" data-label="\uCDE8\uC18C\uD1B5\uBCF4">\uCDE8\uC18C\uD1B5\uBCF4</th>
              <th class="col-action">\uC0AD\uC81C</th>
            </tr>
          </thead>
          <tbody id="absence-body"></tbody>
        </table>
      </div>
    </div>
  `;

  try {
    const [membersRes, absencesRes] = await Promise.all([
      fetch("/.netlify/functions/getMembers"),
      fetch("/.netlify/functions/getAbsences")
    ]);
    if (!membersRes.ok || !absencesRes.ok) {
      throw new Error("\uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    }
    members = await membersRes.json();
    absences = await absencesRes.json();
  } catch (e) {
    alert(e.message || "\uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
  } finally {
    hideLoading();
  }

  selectedMember = null;

  const nicknameInput = document.getElementById("abs-nickname");
  const suggestBox = document.getElementById("abs-suggest");

  nicknameInput.addEventListener("input", () => {
    const keyword = nicknameInput.value.trim();
    suggestBox.innerHTML = "";
    selectedMember = null;

    if (!keyword) return;

    members
      .filter(m => m.nickname.includes(keyword))
      .forEach(m => {
        const div = document.createElement("div");
        div.innerText = m.nickname;
        div.onclick = () => {
          selectedMember = m;
          nicknameInput.value = m.nickname;
          document.getElementById("abs-birth").value = m.birth_date ? String(m.birth_date).substring(0, 10) : "";
          document.getElementById("abs-gender").value = m.gender;
          document.getElementById("abs-region").value = m.region;
          suggestBox.innerHTML = "";
        };
        suggestBox.appendChild(div);
      });
  });

  document.addEventListener("click", e => {
    if (!nicknameInput.contains(e.target)) {
      suggestBox.innerHTML = "";
    }
  });

  renderAbsenceTable();
  bindSortHandlers();
  updateSortIndicators();

  window.deleteAbsence = async (id) => {
    showLoading();
    try {
      const res = await fetch("/.netlify/functions/deleteAbsence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error("\uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
      await renderAbsences();
    } catch (e) {
      alert(e.message || "\uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    } finally {
      hideLoading();
    }
  };

  document.getElementById("abs-add-btn").onclick = async () => {
    if (!selectedMember) {
      alert("\uB2C9\uB124\uC784\uC744 \uC120\uD0DD\uD558\uC138\uC694.");
      return;
    }

    showLoading();
    try {
      const res = await fetch("/.netlify/functions/addAbsence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          member_id: selectedMember.id,
          event_datetime: document.getElementById("abs-datetime").value,
          host: document.getElementById("abs-host").value,
          notice_time: document.getElementById("abs-notice").value
        })
      });
      if (!res.ok) throw new Error("\uB4F1\uB85D\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
      await renderAbsences();
    } catch (e) {
      alert(e.message || "\uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    } finally {
      hideLoading();
    }
  };
}

function renderAbsenceTable() {
  const body = document.getElementById("absence-body");
  const sorted = getSortedAbsences();

  body.innerHTML = sorted.map((a, i) => `
    <tr>
      <td class="col-no">${i + 1}</td>
      <td class="col-nickname">${escapeHtml(a.nickname)}</td>
      <td class="col-birth">${escapeHtml(a.birth_date ? String(a.birth_date).substring(0, 10) : "")}</td>
      <td class="col-gender">${escapeHtml(a.gender)}</td>
      <td class="col-region">${escapeHtml(a.region)}</td>
      <td class="col-date">${formatDate(a.event_datetime)}</td>
      <td class="col-host">${escapeHtml(a.host || "")}</td>
      <td class="col-notice">${escapeHtml(a.notice_time || "")}</td>
      <td class="col-action"><button class="icon-btn icon-delete" onclick="deleteAbsence(${a.id})" aria-label="\uC0AD\uC81C">${iconDelete()}</button></td>
    </tr>
  `).join("");
}

function bindSortHandlers() {
  document.querySelectorAll(".absence-table .sortable").forEach(th => {
    th.onclick = () => sortBy(th.dataset.key);
  });
}

function sortBy(key) {
  sortState.asc = sortState.key === key ? !sortState.asc : true;
  sortState.key = key;
  renderAbsenceTable();
  updateSortIndicators();
}

function getSortedAbsences() {
  if (!sortState.key) return [...absences];
  const key = sortState.key;
  return [...absences].sort((a, b) => {
    const left = getSortValue(a, key);
    const right = getSortValue(b, key);
    if (left > right) return sortState.asc ? 1 : -1;
    if (left < right) return sortState.asc ? -1 : 1;
    return 0;
  });
}

function getSortValue(item, key) {
  if (key === "event_datetime") {
    const ts = new Date(item.event_datetime).getTime();
    return Number.isNaN(ts) ? -Infinity : ts;
  }
  if (key === "birth_date") {
    const ts = new Date(item.birth_date).getTime();
    return Number.isNaN(ts) ? -Infinity : ts;
  }
  return String(item[key] ?? "").toLowerCase();
}

function updateSortIndicators() {
  document.querySelectorAll(".absence-table .sortable").forEach(th => {
    const key = th.dataset.key;
    const baseLabel = th.dataset.label || th.textContent.trim();
    const arrow = sortState.key === key ? (sortState.asc ? " \u2191" : " \u2193") : "";
    th.innerHTML = `${baseLabel}${arrow ? `<span class="sort-arrow">${arrow}</span>` : ""}`;
  });
}

function formatDate(dt) {
  if (!dt) return "";
  return String(dt).substring(0, 10);
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
