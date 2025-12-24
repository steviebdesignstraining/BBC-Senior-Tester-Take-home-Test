// pages/userApi.ts
import { APIRequestContext } from '@playwright/test';
import { apiClient } from '../utils/apiClient';

export class UserApi {
  constructor(private request: APIRequestContext) {}

  createUser(payload: object) {
    return apiClient(this.request, 'POST', '/user', payload);
  }

  getUser(username: string) {
    return apiClient(this.request, 'GET', `/user/${username}`);
  }

  updateUser(username: string, payload: object) {
    return apiClient(this.request, 'PUT', `/user/${username}`, payload);
  }

  deleteUser(username: string) {
    return apiClient(this.request, 'DELETE', `/user/${username}`);
  }

  loginUser(username: string, password: string) {
    return apiClient(this.request, 'GET', `/user/login?username=${username}&password=${password}`);
  }

  logoutUser() {
    return apiClient(this.request, 'GET', '/user/logout');
  }
}