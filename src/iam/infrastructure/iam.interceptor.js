import { registerRequestInterceptor } from '../../shared/infrastructure/interceptor-registry.js';
import { getActiveToken } from '../../shared/infrastructure/active-session.js';

export const iamInterceptor = (config) => {
  const token = getActiveToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

registerRequestInterceptor(iamInterceptor);
