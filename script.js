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



// script.js

// ✅ Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// ✅ CSRF token generation (in production, generate server-side)
document.getElementById('csrfToken').value =
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

// ✅ Character counters for textareas
const textareas = document.querySelectorAll('textarea[maxlength]');
textareas.forEach(textarea => {
  const counterId = textarea.name + 'Count';
  const counter = document.getElementById(counterId);

  if (counter) {
    counter.textContent = `${textarea.value.length}/${textarea.maxLength} characters`;
    textarea.addEventListener('input', function () {
      const length = this.value.length;
      const maxLength = parseInt(this.maxLength);
      counter.textContent = `${length}/${maxLength} characters`;

      if (length > maxLength * 0.9) {
        counter.classList.add('warning');
      } else {
        counter.classList.remove('warning');
      }
    });
  }
});

// ✅ File upload handling with preview
const fileInputsConfig = [
  { inputId: 'logoUpload', fileNameId: 'logoFileName', previewId: 'logoPreview', multiple: false },
  { inputId: 'assetsUpload', fileNameId: 'assetsFileName', previewId: 'assetsPreview', multiple: true },
  { inputId: 'picturesUpload', fileNameId: 'picturesFileName', previewId: 'picturesPreview', multiple: true }
];

fileInputsConfig.forEach(config => {
  const input = document.getElementById(config.inputId);
  const fileName = document.getElementById(config.fileNameId);
  const preview = document.getElementById(config.previewId);

  if (input && fileName && preview) {
    input.addEventListener('change', function (e) {
      const files = e.target.files;

      // File name label
      if (files.length === 0) {
        fileName.textContent = 'No file chosen';
      } else if (files.length === 1) {
        fileName.textContent = files[0].name;
      } else {
        fileName.textContent = `${files.length} files selected`;
      }

      // Preview section
      preview.innerHTML = '';
      if (files.length > 0) {
        preview.classList.remove('hidden');
        Array.from(files).forEach(file => {
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
              const img = document.createElement('img');
              img.src = e.target.result;
              img.alt = file.name;
              img.className = 'max-w-20 h-auto rounded border';
              preview.appendChild(img);
            };
            reader.readAsDataURL(file);
          } else {
            const fileEl = document.createElement('div');
            fileEl.className = 'text-xs bg-gray-100 p-2 rounded border';
            fileEl.textContent = file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name;
            preview.appendChild(fileEl);
          }
        });
      } else {
        preview.classList.add('hidden');
      }
    });
  }
});

// ✅ Auto-save draft
function autoSaveForm() {
  const formData = new FormData(document.getElementById('websiteRequestForm'));
  const data = {};

  for (let [key, value] of formData.entries()) {
    if (key !== 'logo' && key !== 'assets' && key !== 'pictures') {
      if (key === 'features') {
        if (!data[key]) data[key] = [];
        data[key].push(value);
      } else {
        data[key] = value;
      }
    }
  }

  localStorage.setItem('websiteRequestDraft', JSON.stringify(data));
}

function loadDraft() {
  const draft = localStorage.getItem('websiteRequestDraft');
  if (draft) {
    try {
      const data = JSON.parse(draft);
      Object.keys(data).forEach(key => {
        const elements = document.querySelectorAll(`[name="${key}"]`);

        if (elements.length > 0) {
          if (key === 'features') {
            elements.forEach(el => {
              if (data[key].includes(el.value)) el.checked = true;
            });
          } else {
            elements[0].value = data[key];
            if (elements[0].tagName === 'TEXTAREA') {
              const event = new Event('input', { bubbles: true });
              elements[0].dispatchEvent(event);
            }
          }
        }
      });
    } catch (e) {
      console.error('Error loading draft:', e);
    }
  }
}

document.getElementById('websiteRequestForm').addEventListener('input', autoSaveForm);
window.addEventListener('DOMContentLoaded', loadDraft);
