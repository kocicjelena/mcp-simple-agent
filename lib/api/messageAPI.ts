import axiosInstance from './axiosInstance';

export const getMessages = async (params?: Record<string, unknown>) => {
  const { data } = await axiosInstance.get('/messages', { params });
  return data;
};

export const postMessage = async (body: { message: string }) => {
  const { data } = await axiosInstance.post('/api/generate', body);
  return data;
};
