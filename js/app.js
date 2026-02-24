import { renderMembers } from "./members.js";
import { renderExtensions } from "./extension.js";
import { renderAbsences } from "./absence.js";
import { renderEvents } from "./events.js";

const pages = {
  members: renderMembers,
  events: renderEvents,
  extension: renderExtensions,
  absence: renderAbsences
};

const app = document.querySelector(".app");
const sidebar = document.getElementById("sidebar");
const hamburger = document.getElementById("hamburger");
const overlay = document.getElementById("sidebar-overlay");
const passwordGate = document.getElementById("password-gate");
const passwordGateForm = document.getElementById("password-gate-form");
const passwordGateInput = document.getElementById("password-gate-input");
const passwordGateFeedback = document.getElementById("password-gate-feedback");
const passwordGateChange = document.getElementById("password-gate-change");

function openMenu() {
  app.classList.add("menu-open");
  document.body.classList.add("menu-open");
  hamburger.setAttribute("aria-label", "메뉴");
  overlay.setAttribute("aria-hidden", "false");
}

function closeMenu() {
  app.classList.remove("menu-open");
  document.body.classList.remove("menu-open");
  hamburger.setAttribute("aria-label", "메뉴");
  overlay.setAttribute("aria-hidden", "true");
}

function toggleMenu() {
  if (app.classList.contains("menu-open")) closeMenu();
  else openMenu();
}

hamburger.addEventListener("click", toggleMenu);
overlay.addEventListener("click", closeMenu);

const menuItems = document.querySelectorAll(".sidebar li");
menuItems.forEach(li => {
  li.addEventListener("click", () => {
    if (!appUnlocked) return;
    menuItems.forEach(l => l.classList.remove("active"));
    li.classList.add("active");
    pages[li.dataset.page]();
    closeMenu();
  });
});

// 초기 진입
menuItems[0].classList.add("active");

export function showLoading() {
  document.getElementById("loading-mask").classList.remove("hidden");
}

export function hideLoading() {
  document.getElementById("loading-mask").classList.add("hidden");
}

const AUTH_STORAGE_KEY = "backoffice_password";
let appUnlocked = false;

export function getAuthHeaders() {
  const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return {};
  return { "x-api-password": stored };
}

async function verifyPasswordOnServer(password) {
  if (!password) return false;
  try {
    const res = await fetch("/.netlify/functions/authGate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (passwordGateFeedback) {
        passwordGateFeedback.textContent = data.message || "비밀번호가 올바르지 않습니다.";
      }
      return false;
    }
    return true;
  } catch {
    if (passwordGateFeedback) {
      passwordGateFeedback.textContent = "비밀번호가 올바르지 않습니다.";
    }
    return false;
  }
}

function storePassword(value) {
  sessionStorage.setItem(AUTH_STORAGE_KEY, value);
}

function clearStoredPassword() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

function showGate(message) {
  document.body.classList.add("auth-locked");
  if (passwordGateFeedback) {
    passwordGateFeedback.textContent = message || "";
  }
  if (passwordGate) {
    passwordGate.classList.add("is-visible");
  }
  if (passwordGateInput) {
    passwordGateInput.value = "";
    passwordGateInput.focus();
  }
}

function hideGate() {
  if (passwordGate) {
    passwordGate.classList.remove("is-visible");
  }
  document.body.classList.remove("auth-locked");
  if (passwordGateFeedback) {
    passwordGateFeedback.textContent = "";
  }
}

async function unlockApp(password) {
  if (appUnlocked) return;
  if (password) {
    storePassword(password);
  }
  hideGate();
  renderMembers();
  appUnlocked = true;
}

function handleChangePassword() {
  clearStoredPassword();
  showGate("비밀번호를 입력해주세요");
}

passwordGateForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = passwordGateInput?.value.trim();
  if (!password) {
    if (passwordGateFeedback) {
      passwordGateFeedback.textContent = "비밀번호를 입력해주세요";
    }
    return;
  }
  if (passwordGateFeedback) {
    passwordGateFeedback.textContent = "...";
  }
  const valid = await verifyPasswordOnServer(password);
  if (valid) {
    unlockApp(password);
  }
});

passwordGateChange?.addEventListener("click", () => handleChangePassword());

async function initializeAuthGate() {
  document.body.classList.add("auth-locked");
  const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (stored) {
    const valid = await verifyPasswordOnServer(stored);
    if (valid) {
      unlockApp(stored);
      return;
    }
    clearStoredPassword();
  }
  showGate();
}

initializeAuthGate();


