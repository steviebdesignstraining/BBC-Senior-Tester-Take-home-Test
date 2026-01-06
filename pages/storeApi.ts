// pages/storeApi.ts
import { APIRequestContext } from '@playwright/test';
import { apiClient } from '../utils/apiClient';
import { step } from '../utils/stepDecorator';

export class StoreApi {
  constructor(private request: APIRequestContext) {}

  @step('Create new order')
  createOrder(payload: object) {
    return apiClient(this.request, 'POST', '/store/order', payload);
  }

  @step('Get order by ID')
  getOrder(id: string) {
    return apiClient(this.request, 'GET', `/store/order/${id}`);
  }

  @step('Delete order by ID')
  deleteOrder(id: string) {
    return apiClient(this.request, 'DELETE', `/store/order/${id}`);
  }

  @step('Get store inventory')
  getInventory() {
    return apiClient(this.request, 'GET', '/store/inventory');
  }
}