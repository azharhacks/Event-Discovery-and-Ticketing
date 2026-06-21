export const getToken = () => localStorage.getItem('mt_token');
export const getUser  = () => JSON.parse(localStorage.getItem('mt_user') || 'null');
export const setAuth  = (token, user) => {
  localStorage.setItem('mt_token', token);
  localStorage.setItem('mt_user', JSON.stringify(user));
};
export const clearAuth = () => {
  localStorage.removeItem('mt_token');
  localStorage.removeItem('mt_user');
};
export const isLoggedIn = () => !!getToken();
