// pages/userApi.ts
import { APIRequestContext } from '@playwright/test';
import { apiClient } from '../utils/apiClient';
import { step } from '../utils/stepDecorator';

export class UserApi {
  constructor(private request: APIRequestContext) {}

  @step('Create new user')
  createUser(payload: object) {
    return apiClient(this.request, 'POST', '/user', payload);
  }

  @step('Get user by username')
  getUser(username: string) {
    return apiClient(this.request, 'GET', `/user/${username}`);
  }

  @step('Update user details')
  updateUser(username: string, payload: object) {
    return apiClient(this.request, 'PUT', `/user/${username}`, payload);
  }

  @step('Delete user by username')
  deleteUser(username: string) {
    return apiClient(this.request, 'DELETE', `/user/${username}`);
  }

  @step('Login user')
  loginUser(username: string, password: string) {
    return apiClient(this.request, 'GET', `/user/login?username=${username}&password=${password}`);
  }

  @step('Logout user')
  logoutUser() {
    return apiClient(this.request, 'GET', '/user/logout');
  }
}