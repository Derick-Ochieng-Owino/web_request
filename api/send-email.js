// send-mail.js

document.getElementById('websiteRequestForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const submitBtn = document.getElementById('submitButton');
  const originalText = submitBtn.innerHTML;

  // ✅ Validate file sizes before sending
  const maxSize = {
    logo: 5 * 1024 * 1024,      // 5MB
    assets: 10 * 1024 * 1024,   // 10MB
    pictures: 5 * 1024 * 1024   // 5MB
  };

  let hasLargeFile = false;
  const fileInputs = ['logo', 'assets', 'pictures'];

  fileInputs.forEach(inputName => {
    const files = document.querySelector(`input[name="${inputName}"]`).files;
    Array.from(files).forEach(file => {
      if (file.size > maxSize[inputName]) {
        showStatus(`File too large: ${file.name} (max ${maxSize[inputName] / (1024 * 1024)}MB)`, 'error');
        hasLargeFile = true;
      }
    });
  });

  if (hasLargeFile) return;

  // ✅ Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading-spinner"></span> Sending...';

  try {
    const formData = new FormData(this);

    const response = await fetch('/api/send-email', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    showStatus('✅ Your request has been submitted successfully! I\'ll get back to you within 24 hours.', 'success');

    // Reset form after success
    setTimeout(() => {
      this.reset();
      document.querySelectorAll('.file-preview').forEach(preview => {
        preview.classList.add('hidden');
        preview.innerHTML = '';
      });
      document.querySelectorAll('[id$="FileName"]').forEach(el => {
        el.textContent = el.id.includes('logo') ? 'No file chosen' : 'No files chosen';
      });
    }, 2000);

  } catch (error) {
    console.error(error);
    showStatus('❌ Failed to submit your request. Please try again or contact me directly.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
});

// ✅ Reuse existing showStatus function
function showStatus(message, type) {
  const statusEl = document.getElementById('form-status');
  statusEl.textContent = message;
  statusEl.classList.remove('hidden', 'text-red-600', 'text-green-600');

  if (type === 'success') {
    statusEl.classList.add('text-green-600');
  } else {
    statusEl.classList.add('text-red-600');
  }

  if (type === 'success') {
    setTimeout(() => statusEl.classList.add('hidden'), 5000);
  }
}
