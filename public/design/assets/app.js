
const page = document.body.dataset.page || "";
document.querySelectorAll("[data-nav]").forEach(a=>{
  if(a.dataset.nav===page) a.classList.add("active");
});
document.querySelectorAll("[data-toast]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const t=document.createElement("div");
    t.textContent=btn.dataset.toast;
    t.style.cssText="position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1d1d1f;color:#fff;padding:12px 18px;border-radius:999px;box-shadow:0 12px 32px rgba(0,0,0,.2);z-index:1000;font-weight:700";
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),2200);
  })
});
