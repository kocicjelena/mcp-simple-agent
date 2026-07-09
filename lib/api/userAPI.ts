import axiosInstance from './axiosInstance';

export const loginUser = async (credentials: { email: string; password: string }) => {
  const { data } = await axiosInstance.post('/auth/login', credentials);
  return data;
};

export const logoutUser = async () => {
  await axiosInstance.post('/auth/logout');
  if (typeof window !== 'undefined') localStorage.removeItem('token');
};

export const getCurrentUser = async () => {
  const { data } = await axiosInstance.get('/auth/me');
  return data;
};
