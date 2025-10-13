document.getElementById('year').textContent = new Date().getFullYear();

// Prevent right-click / inspect shortcuts unless temporarily enabled
document.addEventListener('contextmenu', e => {
  if (!window.inspectEnabled) e.preventDefault();
});
document.addEventListener('keydown', e => {
  if (window.inspectEnabled) return;
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.key.toLowerCase() === 'u') ||
    (e.ctrlKey && e.shiftKey && ['i','j','c'].includes(e.key.toLowerCase()))
  ) {
    e.preventDefault();
    e.stopPropagation();
  }
});
function toggleInspection() {
  window.inspectEnabled = !window.inspectEnabled;
  alert(window.inspectEnabled ? "Inspection temporarily enabled" : "🔒 Inspection disabled again");
}

document.getElementById('csrfToken').value =
  Math.random().toString(36).substring(2,15) +
  Math.random().toString(36).substring(2,15);

// Textarea character counters
const textareas = document.querySelectorAll('textarea[maxlength]');
textareas.forEach(textarea => {
  const counterId = textarea.name + 'Count';
  const counter = document.getElementById(counterId);

  if (counter) {
    counter.textContent = `${textarea.value.length}/${textarea.maxLength} characters`;
    textarea.addEventListener('input', function() {
      const length = this.value.length;
      counter.textContent = `${length}/${this.maxLength} characters`;
      counter.classList.toggle('warning', length > this.maxLength * 0.9);
    });
  }
});

// File input previews
const fileInputsConfig = [
  { inputId: 'logoUpload', fileNameId: 'logoFileName', previewId: 'logoPreview', multiple: false },
  { inputId: 'assetsUpload', fileNameId: 'assetsFileName', previewId: 'assetsPreview', multiple: true },
  { inputId: 'picturesUpload', fileNameId: 'picturesFileName', previewId: 'picturesPreview', multiple: true }
];

fileInputsConfig.forEach(config => {
  const input = document.getElementById(config.inputId);
  const fileName = document.getElementById(config.fileNameId);
  const preview = document.getElementById(config.previewId);

  if (!input || !fileName || !preview) return;

  input.addEventListener('change', function(e) {
    const files = e.target.files;

    if (files.length === 0) fileName.textContent = 'No file chosen';
    else if (files.length === 1) fileName.textContent = files[0].name;
    else fileName.textContent = `${files.length} files selected`;

    preview.innerHTML = '';
    if (files.length > 0) {
      preview.classList.remove('hidden');
      Array.from(files).forEach(file => {
        console.log(`Selected file: ${file.name}, size: ${file.size/1024/1024} MB`);
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = e => {
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
          fileEl.textContent = file.name.length > 15 ? file.name.substring(0,15)+'...' : file.name;
          preview.appendChild(fileEl);
        }
      });
    } else {
      preview.classList.add('hidden');
    }
  });
});

// Auto-save form draft
function autoSaveForm() {
  const formData = new FormData(document.getElementById('websiteRequestForm'));
  const data = {};
  for (let [key,value] of formData.entries()) {
    if (!['logo','assets','pictures'].includes(key)) {
      if (key==='features') { data[key] = data[key]||[]; data[key].push(value); }
      else data[key] = value;
    }
  }
  localStorage.setItem('websiteRequestDraft', JSON.stringify(data));
}

// Load draft
function loadDraft() {
  const draft = localStorage.getItem('websiteRequestDraft');
  if (!draft) return;
  try {
    const data = JSON.parse(draft);
    Object.keys(data).forEach(key => {
      const elements = document.querySelectorAll(`[name="${key}"]`);
      if (elements.length === 0) return;
      if (key==='features') {
        elements.forEach(el => { if(data[key].includes(el.value)) el.checked=true; });
      } else {
        elements[0].value = data[key];
        if(elements[0].tagName==='TEXTAREA') elements[0].dispatchEvent(new Event('input',{bubbles:true}));
      }
    });
  } catch(e){ console.error('Error loading draft:', e); }
}

// Compress image helper
async function compressImage(file, maxSizeMB=1) {
  if (!file.type.startsWith('image/')) return file; // not an image
  const img = document.createElement('img');
  const canvas = document.createElement('canvas');
  const reader = new FileReader();

  return new Promise((resolve,reject)=>{
    reader.onload = e => {
      img.src = e.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        const ratio = Math.sqrt((file.size / 1024 / 1024) / maxSizeMB);
        if (ratio > 1) {
          width = width / ratio;
          height = height / ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img,0,0,width,height);
        canvas.toBlob(blob=>{
          console.log(`Compressed ${file.name}: ${blob.size/1024/1024} MB`);
          resolve(new File([blob], file.name, {type:file.type}));
        }, file.type, 0.7); // quality 70%
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Form submit
document.getElementById('websiteRequestForm').addEventListener('submit', async function(e){
  e.preventDefault();
  const submitBtn = document.getElementById('submitButton');
  const originalText = submitBtn.innerHTML;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading-spinner"></span> Sending...';

  try {
    const formData = new FormData(this);

    // Compress images before sending
    const imageFields = ['logo','assets','pictures'];
    for (const field of imageFields) {
      const files = Array.from(formData.getAll(field));
      if (files.length === 0) continue;
      formData.delete(field);
      for (const file of files) {
        if (file.size === 0) continue;
        const compressedFile = await compressImage(file, 1); // compress to ~1MB
        formData.append(field, compressedFile);
      }
    }

    // Send form
    const response = await fetch('https://web-request-beryl.vercel.app/api/send-mail',{ method:'POST', body:formData });
    if(!response.ok) throw new Error(`Server responded with ${response.status}`);
    showStatus('Your request has been submitted successfully! I\'ll get back to you within 24 hours.','success');

    setTimeout(()=>{
      this.reset();
      document.querySelectorAll('.file-preview').forEach(p=>{ p.classList.add('hidden'); p.innerHTML=''; });
      document.querySelectorAll('[id$="FileName"]').forEach(el=>{ el.textContent=el.id.includes('logo')?'No file chosen':'No files chosen'; });
    },2000);

  } catch(error){
    console.error('Form submission error:', error);
    showStatus('Failed to submit your request. Please try again or contact me directly.','error');
  } finally {
    submitBtn.disabled=false;
    submitBtn.innerHTML=originalText;
  }
});

// Show status message
function showStatus(msg,type){
  const statusEl=document.getElementById('form-status');
  statusEl.textContent=msg;
  statusEl.classList.remove('hidden','text-red-600','text-green-600');
  statusEl.classList.add(type==='success'?'text-green-600':'text-red-600');
  if(type==='success') setTimeout(()=>statusEl.classList.add('hidden'),5000);
}

document.getElementById('websiteRequestForm').addEventListener('input', autoSaveForm);
window.addEventListener('DOMContentLoaded', loadDraft);
