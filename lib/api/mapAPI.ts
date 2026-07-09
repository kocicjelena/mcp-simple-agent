import axiosInstance from './axiosInstance';

export const getMapData = async (params?: Record<string, unknown>) => {
  const { data } = await axiosInstance.get('/api/list', { params });
  return data;
};

export const postMapData = async (data: any) => {
 //const { data1 } = await axiosInstance.post('/api/create', data);
  return await axiosInstance.post('/api/create', data);
};
