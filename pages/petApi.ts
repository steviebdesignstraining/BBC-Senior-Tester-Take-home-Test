// api/PetApi.ts
import { APIRequestContext } from '@playwright/test';
import { apiClient } from '../utils/apiClient';
import { step } from '../utils/stepDecorator';

export class PetApi {
  constructor(private request: APIRequestContext) {}

  @step('Create new pet')
  createPet(payload: object) {
    return apiClient(this.request, 'POST', '/pet', payload);
  }

  @step('Get pet by ID')
  getPet(id: string) {
    return apiClient(this.request, 'GET', `/pet/${id}`);
  }

  @step('Update pet details')
  updatePet(payload: object) {
    return apiClient(this.request, 'PUT', '/pet', payload);
  }

  @step('Delete pet by ID')
  deletePet(id: string) {
    return apiClient(this.request, 'DELETE', `/pet/${id}`);
  }

  @step('Find pets by status')
  findPetsByStatus(status: string) {
    return apiClient(this.request, 'GET', `/pet/findByStatus?status=${status}`);
  }
}
