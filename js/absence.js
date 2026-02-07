import { showLoading, hideLoading } from "./app.js";
export async function renderAbsences() {
  showLoading();
  document.getElementById("page-title").innerText = "벙 불참자 관리";

  document.getElementById("page-content").innerHTML = `
    <div class="card">
      <table>
        <thead>
          <tr class="input-row">
            <th></th>
            <th style="position:relative">
              <input id="abs-nickname" placeholder="닉네임" autocomplete="off" />
              <div id="abs-suggest" class="suggest-box"></div>
            </th>
            <th><input id="abs-birth" disabled /></th>
            <th><input id="abs-gender" disabled /></th>
            <th><input id="abs-region" disabled /></th>
            <th><input id="abs-datetime" type="date" /></th>
            <th><input id="abs-host" placeholder="벙주" /></th>
            <th>
              <select id="abs-notice">
                <option value="">선택</option>
                <option value="2일전">2일전</option>
                <option value="1일전">1일전</option>
                <option value="당일">당일</option>
              </select>
            </th>
            <th>
              <button id="abs-add-btn">등록</button>
            </th>
          </tr>
          <tr>
            <th>No</th>
            <th>닉네임</th>
            <th>나이</th>
            <th>성별</th>
            <th>지역</th>
            <th>벙 날짜</th>
            <th>벙주</th>
            <th>취소통보</th>
            <th>삭제</th>
          </tr>
        </thead>
        <tbody id="absence-body"></tbody>
      </table>
    </div>
  `;

  /* ===============================
     데이터 로딩
  ============================== */
  let members = [];
  let absences = [];
  try {
    const [membersRes, absencesRes] = await Promise.all([
      fetch("/.netlify/functions/getMembers"),
      fetch("/.netlify/functions/getAbsences")
    ]);
    if (!membersRes.ok || !absencesRes.ok) throw new Error("데이터를 불러오지 못했습니다.");
    members = await membersRes.json();
    absences = await absencesRes.json();
  } catch (e) {
    alert(e.message || "오류가 발생했습니다.");
  } finally {
    hideLoading();
  }

  let selectedMember = null;

  /* ===============================
     typeahead (extension.js 스타일)
  ============================== */
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
          document.getElementById("abs-birth").value = m.birth_year;
          document.getElementById("abs-gender").value = m.gender;
          document.getElementById("abs-region").value = m.region;
          suggestBox.innerHTML = "";
        };
        suggestBox.appendChild(div);
      });
  });

  document.addEventListener("click", (e) => {
    if (!nicknameInput.contains(e.target)) {
      suggestBox.innerHTML = "";
    }
  });

  /* ===============================
     리스트 렌더
  ============================== */
  const body = document.getElementById("absence-body");
  body.innerHTML = absences.map((a, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(a.nickname)}</td>
      <td>${escapeHtml(a.birth_year)}</td>
      <td>${escapeHtml(a.gender)}</td>
      <td>${escapeHtml(a.region)}</td>
      <td>${formatDate(a.event_datetime)}</td>
      <td>${escapeHtml(a.host || "")}</td>
      <td>${escapeHtml(a.notice_time || "")}</td>
      <td>
        <button onclick="deleteAbsence(${a.id})" aria-label="삭제">🗑</button>
      </td>
    </tr>
  `).join("");

  /* ===============================
     삭제
  ============================== */
  window.deleteAbsence = async (id) => {
    showLoading();
    try {
      const res = await fetch("/.netlify/functions/deleteAbsence", {
        method: "POST",
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error("삭제에 실패했습니다.");
      await renderAbsences();
    } catch (e) {
      alert(e.message || "오류가 발생했습니다.");
    } finally {
      hideLoading();
    }
  };

  /* ===============================
     추가 (extension.js 방식 유지)
  ============================== */
  document.getElementById("abs-add-btn").onclick = async () => {
    if (!selectedMember) {
      alert("닉네임을 선택하세요");
      return;
    }
    showLoading();
    try {
      const res = await fetch("/.netlify/functions/addAbsence", {
        method: "POST",
        body: JSON.stringify({
          member_id: selectedMember.id,
          event_datetime: document.getElementById("abs-datetime").value,
          host: document.getElementById("abs-host").value,
          notice_time: document.getElementById("abs-notice").value
        })
      });
      if (!res.ok) throw new Error("등록에 실패했습니다.");
      await renderAbsences();
    } catch (e) {
      alert(e.message || "오류가 발생했습니다.");
    } finally {
      hideLoading();
    }
  };
}

/* ===============================
   util – 날짜만 표시 (시간 제외)
================================ */
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

