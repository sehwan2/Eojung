import { renderMembers } from "./members.js";
import { renderExtensions } from "./extension.js";
import { renderAbsences } from "./absence.js";

const pages = {
  members: renderMembers,
  extension: renderExtensions,
  absence: renderAbsences
};

document.querySelectorAll(".sidebar li").forEach(li => {
  li.addEventListener("click", () => {
    document.querySelectorAll(".sidebar li").forEach(l => l.classList.remove("active"));
    li.classList.add("active");
    pages[li.dataset.page]();
  });
});

export function showLoading() {
  document.getElementById("loading-mask").classList.remove("hidden");
}

export function hideLoading() {
  document.getElementById("loading-mask").classList.add("hidden");
}


// 초기 페이지
renderMembers();
