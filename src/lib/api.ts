import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import apiClient from './axiosConfig'

export const api = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) => apiClient.get<T>(url, config),
  post: <T = unknown>(url: string, data?: any, config?: AxiosRequestConfig) => apiClient.post<T>(url, data, config),
  patch: <T = unknown>(url: string, data?: any, config?: AxiosRequestConfig) => apiClient.patch<T>(url, data, config),
  put: <T = unknown>(url: string, data?: any, config?: AxiosRequestConfig) => apiClient.put<T>(url, data, config),
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => apiClient.delete<T>(url, config),
}

export type ApiResponse<T> = AxiosResponse<T>
