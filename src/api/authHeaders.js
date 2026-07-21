import ENV from '../config/environment';

export function getAuthHeaders() {
  const headers = {
    ...(ENV.APIGEE_API_KEY ? { 'x-api-key': ENV.APIGEE_API_KEY, apikey: ENV.APIGEE_API_KEY } : {}),
  };

  try {
    const stored = localStorage.getItem('banquito_auth');
    const session = stored ? JSON.parse(stored) : null;
    if (session?.idToken) {
      headers.Authorization = `Bearer ${session.idToken}`;
    }
  } catch {
    // Ignore invalid localStorage state; Apigee will reject unauthenticated calls.
  }

  return headers;
}
