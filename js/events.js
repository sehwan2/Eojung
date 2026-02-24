import { showLoading, hideLoading, getAuthHeaders } from "./app.js";

let members = [];
let events = [];
let selectedHost = null;
let selectedAttendees = []; // [{ id, nickname }]

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

/* =========================
   렌더
========================= */
export async function renderEvents() {
  document.getElementById("page-title").innerText = "벙 관리";

  document.getElementById("page-content").innerHTML = `
    <div class="card event-form-card">
      <h3 class="event-form__title">벙 추가</h3>
      <div class="event-form">

        <div class="event-form__field">
          <label class="event-form__label">벙제</label>
          <input id="ev-title" class="event-form__input" placeholder="벙 이름" />
        </div>

        <div class="event-form__field">
          <label class="event-form__label">벙주</label>
          <div class="member-search-wrap">
            <input id="ev-host-input" class="event-form__input" placeholder="이름 검색" autocomplete="off" />
            <div id="ev-host-suggest" class="suggest-box"></div>
            <div id="ev-host-selected" class="selected-single"></div>
          </div>
        </div>

        <div class="event-form__field">
          <label class="event-form__label">날짜/시간</label>
          <input id="ev-datetime" class="event-form__input" type="datetime-local" />
        </div>

        <div class="event-form__field">
          <label class="event-form__label">장소</label>
          <input id="ev-location" class="event-form__input" placeholder="장소" />
        </div>

        <div class="event-form__field event-form__field--full">
          <label class="event-form__label">참석자</label>
          <div class="member-search-wrap">
            <input id="ev-attendee-input" class="event-form__input" placeholder="이름 검색 후 선택" autocomplete="off" />
            <div id="ev-attendee-suggest" class="suggest-box"></div>
            <div id="ev-attendee-chips" class="chip-list"></div>
          </div>
        </div>

      </div>
      <div class="event-form__footer">
        <button id="ev-add-btn" class="event-form__submit">벙 등록</button>
      </div>
    </div>

    <div class="card">
      <div class="table-wrapper">
        <table class="event-table">
          <thead>
            <tr>
              <th class="col-no">No</th>
              <th class="col-ev-title">벙제</th>
              <th class="col-ev-host">벙주</th>
              <th class="col-ev-datetime">날짜/시간</th>
              <th class="col-ev-location">장소</th>
              <th class="col-ev-attendees">참석자</th>
              <th class="col-action">삭제</th>
            </tr>
          </thead>
          <tbody id="event-body"></tbody>
        </table>
      </div>
    </div>
  `;

  selectedHost = null;
  selectedAttendees = [];

  await Promise.all([loadMembers(), loadEvents()]);

  setupHostSearch();
  setupAttendeeSearch();
  document.getElementById("ev-add-btn").onclick = addEvent;
}

/* =========================
   데이터 로딩
========================= */
async function loadMembers() {
  try {
    const res = await fetch("/.netlify/functions/getMembers");
    if (res.ok) members = await res.json();
  } catch (_) {
    members = [];
  }
}

async function loadEvents() {
  showLoading();
  try {
    const res = await fetch("/.netlify/functions/getEvents");
    if (!res.ok) throw new Error("벙 목록을 불러오지 못했습니다.");
    events = await res.json();
    renderTable();
  } catch (e) {
    showToast(e.message || "오류가 발생했습니다.");
  } finally {
    hideLoading();
  }
}

/* =========================
   테이블 렌더
========================= */
function renderTable() {
  const body = document.getElementById("event-body");
  if (!body) return;

  if (!events.length) {
    body.innerHTML = `<tr><td colspan="7" class="empty-row">등록된 벙이 없습니다.</td></tr>`;
    return;
  }

  body.innerHTML = events.map((ev, i) => {
    const attendeeText = Array.isArray(ev.attendees) && ev.attendees.length
      ? ev.attendees.map(a => escapeHtml(a.nickname)).join(", ")
      : "-";
    return `
      <tr>
        <td class="col-no">${i + 1}</td>
        <td class="col-ev-title">${escapeHtml(ev.title || "")}</td>
        <td class="col-ev-host">${escapeHtml(ev.host_nickname || "-")}</td>
        <td class="col-ev-datetime">${formatDatetime(ev.event_datetime)}</td>
        <td class="col-ev-location">${escapeHtml(ev.location || "-")}</td>
        <td class="col-ev-attendees" title="${attendeeText}">${attendeeText}</td>
        <td class="col-action">
          <button class="icon-btn icon-delete" onclick="deleteEvent(${ev.id})" aria-label="삭제">${iconDelete()}</button>
        </td>
      </tr>
    `;
  }).join("");
}

/* =========================
   벙주 검색
========================= */
function setupHostSearch() {
  const input = document.getElementById("ev-host-input");
  const suggest = document.getElementById("ev-host-suggest");
  const selected = document.getElementById("ev-host-selected");
  if (!input) return;

  input.addEventListener("input", () => {
    const keyword = input.value.trim();
    suggest.innerHTML = "";
    if (!keyword) return;

    const filtered = members.filter(m => m.nickname.includes(keyword)).slice(0, 8);
    filtered.forEach(m => {
      const div = document.createElement("div");
      div.textContent = m.nickname;
      div.onclick = () => {
        selectedHost = m;
        input.value = "";
        suggest.innerHTML = "";
        renderHostSelected();
      };
      suggest.appendChild(div);
    });
  });

  document.addEventListener("click", e => {
    if (!input.contains(e.target) && !suggest.contains(e.target)) {
      suggest.innerHTML = "";
    }
  });
}

function renderHostSelected() {
  const el = document.getElementById("ev-host-selected");
  if (!el) return;
  if (!selectedHost) { el.innerHTML = ""; return; }
  el.innerHTML = `
    <span class="chip">
      ${escapeHtml(selectedHost.nickname)}
      <button type="button" class="chip-remove" onclick="clearHost()">×</button>
    </span>
  `;
}

window.clearHost = () => {
  selectedHost = null;
  renderHostSelected();
};

/* =========================
   참석자 검색 (멀티)
========================= */
function setupAttendeeSearch() {
  const input = document.getElementById("ev-attendee-input");
  const suggest = document.getElementById("ev-attendee-suggest");
  if (!input) return;

  input.addEventListener("input", () => {
    const keyword = input.value.trim();
    suggest.innerHTML = "";
    if (!keyword) return;

    const filtered = members
      .filter(m => m.nickname.includes(keyword) && !selectedAttendees.find(a => a.id === m.id))
      .slice(0, 8);

    filtered.forEach(m => {
      const div = document.createElement("div");
      div.textContent = m.nickname;
      div.onclick = () => {
        selectedAttendees.push({ id: m.id, nickname: m.nickname });
        input.value = "";
        suggest.innerHTML = "";
        renderAttendeeChips();
      };
      suggest.appendChild(div);
    });
  });

  document.addEventListener("click", e => {
    if (!input.contains(e.target) && !suggest.contains(e.target)) {
      suggest.innerHTML = "";
    }
  });
}

function renderAttendeeChips() {
  const wrap = document.getElementById("ev-attendee-chips");
  if (!wrap) return;
  wrap.innerHTML = selectedAttendees.map(a => `
    <span class="chip">
      ${escapeHtml(a.nickname)}
      <button type="button" class="chip-remove" onclick="removeAttendee(${a.id})">×</button>
    </span>
  `).join("");
}

window.removeAttendee = (id) => {
  selectedAttendees = selectedAttendees.filter(a => a.id !== id);
  renderAttendeeChips();
};

/* =========================
   벙 등록
========================= */
async function addEvent() {
  const title = document.getElementById("ev-title")?.value.trim();
  const datetime = document.getElementById("ev-datetime")?.value;
  const location = document.getElementById("ev-location")?.value.trim();

  if (!title) { showToast("벙제를 입력해주세요."); return; }

  showLoading();
  try {
    const res = await fetch("/.netlify/functions/addEvent", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({
        title,
        host_member_id: selectedHost?.id || null,
        event_datetime: datetime || null,
        location: location || null,
        attendee_ids: selectedAttendees.map(a => a.id)
      })
    });
    if (!res.ok) throw new Error("등록에 실패했습니다.");
    showToast("벙이 등록되었습니다 ✅");

    // 폼 초기화
    document.getElementById("ev-title").value = "";
    document.getElementById("ev-datetime").value = "";
    document.getElementById("ev-location").value = "";
    selectedHost = null;
    selectedAttendees = [];
    renderHostSelected();
    renderAttendeeChips();

    await loadEvents();
  } catch (e) {
    showToast(e.message || "오류가 발생했습니다.");
  } finally {
    hideLoading();
  }
}

/* =========================
   벙 삭제
========================= */
window.deleteEvent = async (id) => {
  if (!confirm("이 벙을 삭제할까요?\n참석자 기록도 함께 삭제됩니다.")) return;

  showLoading();
  try {
    const res = await fetch("/.netlify/functions/deleteEvent", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ id })
    });
    if (!res.ok) throw new Error("삭제에 실패했습니다.");
    await loadEvents();
  } catch (e) {
    showToast(e.message || "오류가 발생했습니다.");
  } finally {
    hideLoading();
  }
};

/* =========================
   유틸
========================= */
function formatDatetime(val) {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "-";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
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
