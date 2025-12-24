// utils/apiClient.ts
import { APIRequestContext } from '@playwright/test';
import { getEnvironmentConfig } from './envValidator';

export async function apiClient(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  body?: object
) {
  const envConfig = getEnvironmentConfig();
  
  const response = await request.fetch(`${envConfig.baseUrl}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(envConfig.authKey && { api_key: envConfig.authKey })
    },
    ...(body && { data: body })
  });

  return response;
}
