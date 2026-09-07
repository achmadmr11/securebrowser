// DOM Elements
const welcomeView = document.getElementById('welcomeView');
const examView = document.getElementById('examView');
const appTitleEl = document.getElementById('appTitle');
const btnStartExam = document.getElementById('btnStartExam');
const logoWrapper = document.getElementById('logoWrapper');
const btnOpenAdmin = document.getElementById('btnOpenAdmin');
const btnOpenExit = document.getElementById('btnOpenExit');

// Exam Header & Webview
const examHeaderTitle = document.getElementById('examHeaderTitle');
const btnWebBack = document.getElementById('btnWebBack');
const btnWebReload = document.getElementById('btnWebReload');
const btnExitExam = document.getElementById('btnExitExam');
const cbtWebview = document.getElementById('cbtWebview');
const loadingOverlay = document.getElementById('loadingOverlay');

// Admin Modal Elements
const adminModal = document.getElementById('adminModal');
const adminPassInput = document.getElementById('adminPassInput');
const examUrlInput = document.getElementById('examUrlInput');
const appTitleInput = document.getElementById('appTitleInput');
const btnCancelAdmin = document.getElementById('btnCancelAdmin');
const btnSaveAdmin = document.getElementById('btnSaveAdmin');
const adminErrorMsg = document.getElementById('adminErrorMsg');

// Exit Modal Elements
const exitModal = document.getElementById('exitModal');
const exitPassInput = document.getElementById('exitPassInput');
const btnCancelExit = document.getElementById('btnCancelExit');
const btnConfirmExit = document.getElementById('btnConfirmExit');
const exitErrorMsg = document.getElementById('exitErrorMsg');

// Toast
const toastNotification = document.getElementById('toastNotification');

// State
let currentSettings = {
  examUrl: 'https://cbtportal.smapluspgri.sch.id/',
  appTitle: 'Secure Exam Browser'
};
let isExamActive = false;
let clickCount = 0;
let lastClickTime = 0;
let longPressTimer = null;

// Initialize
async function init() {
  try {
    if (window.examEduAPI) {
      currentSettings = await window.examEduAPI.getSettings();
      updateUIWithSettings();

      // Listen to IPC events from main process (e.g. keyboard shortcuts)
      window.examEduAPI.onTriggerExitDialog(() => {
        openExitModal();
      });

      window.examEduAPI.onTriggerAdminDialog(() => {
        openAdminModal();
      });

      window.examEduAPI.onBlurWarning(() => {
        showToast('⚠️ Peringatan: Dilarang beralih aplikasi atau membuka notifikasi!', 4000);
      });
    }
  } catch (err) {
    console.error('Failed to init settings:', err);
  }


  setupEventListeners();
  setupWebview();
}

function updateUIWithSettings() {
  if (appTitleEl) appTitleEl.textContent = currentSettings.appTitle;
  if (examHeaderTitle) examHeaderTitle.textContent = currentSettings.appTitle;
  if (document.title) document.title = currentSettings.appTitle;
}

function showToast(message, duration = 3000) {
  if (!toastNotification) return;
  toastNotification.textContent = message;
  toastNotification.classList.add('show');
  setTimeout(() => {
    toastNotification.classList.remove('show');
  }, duration);
}

// Webview setup
function setupWebview() {
  if (!cbtWebview) return;

  cbtWebview.addEventListener('did-start-loading', () => {
    loadingOverlay.classList.remove('hidden');
  });

  cbtWebview.addEventListener('did-stop-loading', () => {
    loadingOverlay.classList.add('hidden');
  });

  cbtWebview.addEventListener('did-fail-load', (e) => {
    loadingOverlay.classList.add('hidden');
    if (e.errorCode !== -3) { // Ignore aborted requests
      showToast('Gagal memuat halaman ujian. Periksa koneksi internet.', 4000);
    }
  });

  // Block popup windows inside webview
  cbtWebview.addEventListener('new-window', (e) => {
    e.preventDefault();
  });
}

// Event Listeners
function setupEventListeners() {
  // Start Exam
  btnStartExam.addEventListener('click', () => {
    startExam();
  });

  // Web Navigation
  btnWebBack.addEventListener('click', () => {
    if (cbtWebview && cbtWebview.canGoBack()) {
      cbtWebview.goBack();
    } else {
      showToast('Sudah berada di halaman awal ujian.');
    }
  });

  btnWebReload.addEventListener('click', () => {
    if (cbtWebview) {
      cbtWebview.reload();
      showToast('Memuat ulang halaman...');
    }
  });

  btnExitExam.addEventListener('click', () => {
    openExitModal();
  });

  // Admin Modal Buttons
  btnOpenAdmin.addEventListener('click', () => openAdminModal());
  btnCancelAdmin.addEventListener('click', () => closeAdminModal());
  btnSaveAdmin.addEventListener('click', () => handleSaveAdmin());

  // Exit Modal Buttons
  btnOpenExit.addEventListener('click', () => openExitModal());
  btnCancelExit.addEventListener('click', () => closeExitModal());
  btnConfirmExit.addEventListener('click', () => handleConfirmExit());

  // Input Enter Key triggers
  adminPassInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSaveAdmin();
  });
  examUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSaveAdmin();
  });
  appTitleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSaveAdmin();
  });
  exitPassInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleConfirmExit();
  });

  // Logo Long-press / Hold trigger for Admin
  logoWrapper.addEventListener('mousedown', () => {
    longPressTimer = setTimeout(() => {
      openAdminModal();
    }, 1200);
  });

  logoWrapper.addEventListener('mouseup', () => {
    clearTimeout(longPressTimer);
  });

  logoWrapper.addEventListener('mouseleave', () => {
    clearTimeout(longPressTimer);
  });

  // Multi-tap exit gesture (6 taps like Android app)
  document.addEventListener('click', (e) => {
    // Ignore clicks inside modal
    if (adminModal.classList.contains('active') || exitModal.classList.contains('active')) {
      return;
    }

    const now = Date.now();
    if (now - lastClickTime < 500) {
      clickCount++;
    } else {
      clickCount = 1;
    }
    lastClickTime = now;

    if (clickCount >= 6) {
      clickCount = 0;
      openExitModal();
    }
  });
}

function startExam() {
  isExamActive = true;
  welcomeView.classList.remove('active');
  examView.classList.add('active');

  showToast('Memulai Sesi Ujian...');
  if (cbtWebview) {
    cbtWebview.src = currentSettings.examUrl;
  }
}

// Modal Handlers
function openAdminModal() {
  adminErrorMsg.textContent = '';
  adminPassInput.value = '';
  examUrlInput.value = currentSettings.examUrl;
  appTitleInput.value = currentSettings.appTitle;
  if (cbtWebview) cbtWebview.style.pointerEvents = 'none';
  adminModal.classList.add('active');
  setTimeout(() => adminPassInput.focus(), 60);
}

function closeAdminModal() {
  adminModal.classList.remove('active');
  if (cbtWebview) cbtWebview.style.pointerEvents = 'auto';
}

async function handleSaveAdmin() {
  adminErrorMsg.textContent = '';
  const enteredPass = adminPassInput.value.trim();
  const newUrl = examUrlInput.value.trim();
  const newTitle = appTitleInput.value.trim();

  if (!enteredPass) {
    adminErrorMsg.textContent = 'Masukkan password admin!';
    return;
  }

  if (window.examEduAPI) {
    const isCorrect = await window.examEduAPI.verifyAdminPassword(enteredPass);
    if (isCorrect) {
      if (newUrl) currentSettings.examUrl = newUrl;
      if (newTitle) currentSettings.appTitle = newTitle;

      await window.examEduAPI.updateSettings({
        examUrl: newUrl,
        appTitle: newTitle
      });

      updateUIWithSettings();
      closeAdminModal();
      showToast('Pengaturan admin berhasil disimpan!');
    } else {
      adminErrorMsg.textContent = 'Password admin salah!';
    }
  }
}

function openExitModal() {
  exitErrorMsg.textContent = '';
  exitPassInput.value = '';
  if (cbtWebview) cbtWebview.style.pointerEvents = 'none';
  exitModal.classList.add('active');
  setTimeout(() => exitPassInput.focus(), 60);
}

function closeExitModal() {
  exitModal.classList.remove('active');
  if (cbtWebview) cbtWebview.style.pointerEvents = 'auto';
}

async function handleConfirmExit() {
  exitErrorMsg.textContent = '';
  const enteredPass = exitPassInput.value.trim();

  if (!enteredPass) {
    exitErrorMsg.textContent = 'Masukkan password keluar!';
    return;
  }

  if (window.examEduAPI) {
    btnConfirmExit.disabled = true;
    btnConfirmExit.textContent = 'Keluar...';
    try {
      const result = await window.examEduAPI.quitApp(enteredPass);
      if (!result.success) {
        exitErrorMsg.textContent = result.message || 'Password salah!';
        btnConfirmExit.disabled = false;
        btnConfirmExit.textContent = 'Keluar Aplikasi';
      }
    } catch (err) {
      exitErrorMsg.textContent = 'Gagal memproses keluar aplikasi';
      btnConfirmExit.disabled = false;
      btnConfirmExit.textContent = 'Keluar Aplikasi';
    }
  }
}


// Start
document.addEventListener('DOMContentLoaded', init);
