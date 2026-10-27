/**
 * SmartCampus Login Controller
 * Handles user sign in, error feedback, and 1-click demo accounts.
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const emailInp = document.getElementById('email');
  const passInp = document.getElementById('password');
  const errorEl = document.getElementById('formError');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorEl) errorEl.hidden = true;
      const email = emailInp.value.trim();
      const password = passInp.value;

      try {
        const data = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        setSession(data);
        if (typeof showToast === 'function') {
          showToast('Welcome Back', `Signed in as ${data.user.name}`);
        }
        setTimeout(() => {
          location.href = data.user.role === 'admin' ? 'admin.html' : '../index.html';
        }, 500);
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = err.message;
          errorEl.hidden = false;
        }
      }
    });
  }

  // Quick Demo Buttons
  document.getElementById('demoStudentBtn')?.addEventListener('click', () => {
    if (emailInp) emailInp.value = 'priya.sharma@mitsgwl.ac.in';
    if (passInp) passInp.value = 'mits2026pass';
    form?.requestSubmit();
  });

  document.getElementById('demoFacultyBtn')?.addEventListener('click', () => {
    if (emailInp) emailInp.value = 'r.gupta@mitsgwalior.in';
    if (passInp) passInp.value = 'mits2026pass';
    form?.requestSubmit();
  });

  // Handle unauthorized admin redirection message
  const urlParams = new URLSearchParams(location.search);
  if (urlParams.get('error') === 'unauthorized' || sessionStorage.getItem('adminAccessDenied')) {
    sessionStorage.removeItem('adminAccessDenied');
    if (errorEl) {
      errorEl.textContent = '🔒 Access Denied: Administrator credentials required to access the Admin Panel.';
      errorEl.hidden = false;
    }
  }
});
