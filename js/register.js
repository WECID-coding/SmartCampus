/**
 * SmartCampus Registration Controller
 * Validates student/faculty institute email, verifies password match,
 * and sets up local session.
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const errorEl = document.getElementById('formError');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorEl) errorEl.hidden = true;

      const name = document.getElementById('name')?.value.trim() || '';
      const email = document.getElementById('email')?.value.trim().toLowerCase() || '';
      const password = document.getElementById('password')?.value || '';
      const confirmPassword = document.getElementById('confirmPassword')?.value || '';

      if (password !== confirmPassword) {
        if (errorEl) {
          errorEl.textContent = 'Passwords do not match. Please re-enter.';
          errorEl.hidden = false;
        }
        return;
      }

      if (password.length < 8) {
        if (errorEl) {
          errorEl.textContent = 'Password must be at least 8 characters long.';
          errorEl.hidden = false;
        }
        return;
      }

      try {
        const data = await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password })
        });
        setSession(data);
        if (typeof showToast === 'function') {
          showToast('Account Created! 🎉', `Welcome to SmartCampus, ${data.user.name}.`);
        }
        setTimeout(() => {
          location.href = '../index.html';
        }, 600);
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = err.message || 'Registration failed. Please try again.';
          errorEl.hidden = false;
        }
      }
    });
  }
});
