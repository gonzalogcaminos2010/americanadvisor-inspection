import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Backend echoes request body before JSON response (e.g. "{req}{res}").
    // Parse past the echoed first JSON object to extract the actual response.
    const parseData = (data: unknown) => {
      if (typeof data !== 'string') return data;
      const str = data.trim();
      try { return JSON.parse(str); } catch { /* not simple JSON */ }
      let depth = 0;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === '{') depth++;
        else if (str[i] === '}') {
          depth--;
          if (depth === 0 && i + 1 < str.length) {
            try { return JSON.parse(str.slice(i + 1)); } catch { /* continue */ }
          }
        }
      }
      return data;
    };

    this.client.interceptors.response.use(
      (response) => { response.data = parseData(response.data); return response; },
      (error) => {
        if (error.response) { error.response.data = parseData(error.response.data); }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const api = new ApiClient();
