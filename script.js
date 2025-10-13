// Initialize year in footer
document.getElementById('year').textContent = new Date().getFullYear();

//Prevent right-click and inspect shortcuts (unless temporary bypass enabled)
document.addEventListener('contextmenu', e => {
  if (!window.inspectEnabled) e.preventDefault();
});

document.addEventListener('keydown', e => {
  if (window.inspectEnabled) return;
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.key.toLowerCase() === 'u') ||
    (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
  ) {
    e.preventDefault();
    e.stopPropagation();
  }
});

function toggleInspection() {
  window.inspectEnabled = !window.inspectEnabled;
  alert(window.inspectEnabled ? "Inspection temporarily enabled" : "🔒 Inspection disabled again");
}



document.getElementById('websiteRequestForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  const statusEl = document.getElementById('form-status');
  statusEl.classList.remove('hidden');
  statusEl.textContent = 'Submitting... ';

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (res.ok) {
      statusEl.textContent = 'Thank you! Your request has been submitted.';
      form.reset();
    } else {
      statusEl.textContent = 'Submission failed: ' + data.message;
      statusEl.classList.add('text-red-600');
    }
  } catch (err) {
    statusEl.textContent = 'Network error';
    statusEl.classList.add('text-red-600');
  }
});