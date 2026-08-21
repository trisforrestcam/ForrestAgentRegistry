document.querySelectorAll('button.copy').forEach(btn => {
  btn.addEventListener('click', async () => {
    const text = document.getElementById(btn.dataset.target).textContent;
    await navigator.clipboard.writeText(text);
    const original = btn.textContent;
    btn.textContent = 'Đã copy';
    setTimeout(() => { btn.textContent = original; }, 1200);
  });
});
