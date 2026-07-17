import ENV from '../config/environment';

const SIGN_IN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${ENV.IDENTITY_PLATFORM_API_KEY}`;

export const loginStaff = async (username, password) => {
  const email = `${username}@banquito.internal`;

  const response = await fetch(SIGN_IN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error?.message || 'Error de autenticación');
    error.response = { status: response.status, data };
    throw error;
  }

  return { data };
};
