/**
 * CodeSense AI — Settings page.
 */

import { api } from '../app/api.js';
import { auth } from '../app/auth.js';
import { navigate } from '../app/router.js';
import { show as toastShow, error as toastError } from '../components/toast.js';

const userEmail = document.getElementById('settings-email');
const userStatus = document.getElementById('settings-status');
const btnLogout = document.getElementById('settings-logout');
const errorEl = document.getElementById('settings-error');

function init() {
  if (!userEmail) return;

  api.me().then((res) => {
    const u = res.user || {};
    userEmail.textContent = u.email || '';
    if (userStatus) userStatus.textContent = u.status || 'active';
  }).catch((err) => {
    if (err.status === 401) navigate('/login');
    else toastError('Unable to load account.');
  });

  if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await api.logout();
      } catch (err) {
        // ignore server errors; clear local state anyway.
      }
      auth.setUser(null);
      toastShow('Signed out.', 'success', 3000);
      navigate('/');
    });
  }
}


export { init };
