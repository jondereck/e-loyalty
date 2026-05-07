
document.querySelectorAll('[data-toast]').forEach(btn=>{
  btn.addEventListener('click',()=>{ alert(btn.dataset.toast || 'Action completed'); });
});
