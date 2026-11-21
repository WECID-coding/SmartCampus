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

      const submitBtn = document.getElementById('submitRegisterBtn');
      const origBtnText = submitBtn ? submitBtn.innerHTML : 'Complete Registration →';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳ Creating Account & Sending Email...</span>';
      }

      try {
        const data = await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password })
        });
        setSession(data);

        // Display confirmation state with Gmail direct link
        const registerCard = document.getElementById('registerCard');
        const successCard = document.getElementById('registerSuccessCard');
        const greetingEl = document.getElementById('successGreeting');
        const emailBadge = document.getElementById('registeredEmailBadge');

        if (registerCard && successCard) {
          registerCard.hidden = true;
          successCard.hidden = false;
          if (greetingEl) greetingEl.textContent = `Welcome to Findora, ${name}!`;
          if (emailBadge) emailBadge.textContent = `✉️ ${email}`;
        }

        if (typeof showToast === 'function') {
          showToast('Account Created! ✉️', `Welcome confirmation email sent to ${email}.`);
        }
      } catch (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origBtnText;
        }
        if (errorEl) {
          errorEl.textContent = err.message || 'Registration failed. Please try again.';
          errorEl.hidden = false;
        }
      }
    });
  }
});
