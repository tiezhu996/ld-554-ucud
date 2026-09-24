import axios, { type AxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';
import { getToken } from './auth';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** 跳过全局错误提示，由调用页面自行展示（如保存页需要明确提示失败原因） */
    skipGlobalError?: boolean;
  }
}

export const request = axios.create({
  baseURL: '/api',
  timeout: 12000
});

request.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const config: AxiosRequestConfig | undefined = error.config;
    if (status === 401) {
      ElMessage.error('登录已过期，请重新登录');
      router.push('/login');
    } else if (status === 403) {
      if (!config?.skipGlobalError) ElMessage.error('无权限执行该操作');
    } else if (status >= 500) {
      if (!config?.skipGlobalError) ElMessage.error('服务器错误，请稍后重试');
    } else if (!config?.skipGlobalError) {
      ElMessage.error(error.response?.data?.message ?? '请求失败');
    }
    return Promise.reject(error);
  }
);
