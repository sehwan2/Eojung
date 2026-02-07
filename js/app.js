import { renderMembers } from "./members.js";
import { renderExtensions } from "./extension.js";
import { renderAbsences } from "./absence.js";

const pages = {
  members: renderMembers,
  extension: renderExtensions,
  absence: renderAbsences
};

const app = document.querySelector(".app");
const sidebar = document.getElementById("sidebar");
const hamburger = document.getElementById("hamburger");
const overlay = document.getElementById("sidebar-overlay");

function openMenu() {
  app.classList.add("menu-open");
  document.body.classList.add("menu-open");
  hamburger.setAttribute("aria-label", "메뉴 닫기");
  overlay.setAttribute("aria-hidden", "false");
}

function closeMenu() {
  app.classList.remove("menu-open");
  document.body.classList.remove("menu-open");
  hamburger.setAttribute("aria-label", "메뉴 열기");
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
    menuItems.forEach(l => l.classList.remove("active"));
    li.classList.add("active");
    pages[li.dataset.page]();
    closeMenu();
  });
});

// 초기 진입 시 '멤버 리스트' 활성 표시
menuItems[0].classList.add("active");

export function showLoading() {
  document.getElementById("loading-mask").classList.remove("hidden");
}

export function hideLoading() {
  document.getElementById("loading-mask").classList.add("hidden");
}


// 초기 페이지
renderMembers();
