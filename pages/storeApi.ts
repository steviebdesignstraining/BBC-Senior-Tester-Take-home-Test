// pages/storeApi.ts
import { APIRequestContext } from '@playwright/test';
import { apiClient } from '../utils/apiClient';

export class StoreApi {
  constructor(private request: APIRequestContext) {}

  createOrder(payload: object) {
    return apiClient(this.request, 'POST', '/store/order', payload);
  }

  getOrder(id: string) {
    return apiClient(this.request, 'GET', `/store/order/${id}`);
  }

  deleteOrder(id: string) {
    return apiClient(this.request, 'DELETE', `/store/order/${id}`);
  }

  getInventory() {
    return apiClient(this.request, 'GET', '/store/inventory');
  }
}