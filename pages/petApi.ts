// api/PetApi.ts
import { APIRequestContext } from '@playwright/test';
import { apiClient } from '../utils/apiClient';

export class PetApi {
  constructor(private request: APIRequestContext) {}

  createPet(payload: object) {
    return apiClient(this.request, 'POST', '/pet', payload);
  }

  getPet(id: string) {
    return apiClient(this.request, 'GET', `/pet/${id}`);
  }

  updatePet(payload: object) {
    return apiClient(this.request, 'PUT', '/pet', payload);
  }

  deletePet(id: string) {
    return apiClient(this.request, 'DELETE', `/pet/${id}`);
  }

  findPetsByStatus(status: string) {
    return apiClient(this.request, 'GET', `/pet/findByStatus?status=${status}`);
  }
}
