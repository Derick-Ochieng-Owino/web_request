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

// EmailJS setup
(function() {
  emailjs.init("IUOE1N2EHEPCmMkfq"); // Replace with your EmailJS public key
})();

document.getElementById('form-time').value = new Date().toLocaleString();

// Handle form submission
document.getElementById('websiteRequestForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const status = document.getElementById('form-status');
  status.classList.remove('hidden');
  status.textContent = 'Sending your request...';

  emailjs.sendForm('service_hqcccyb', 'template_1n1eq8c', this)
    .then(() => {
      status.textContent = 'Your request has been sent successfully!';
      this.reset();
    })
    .catch(error => {
      console.error('EmailJS error:', error);
      status.textContent = 'Failed to send. Please try again.';
      status.classList.add('text-red-600');
    });
});
