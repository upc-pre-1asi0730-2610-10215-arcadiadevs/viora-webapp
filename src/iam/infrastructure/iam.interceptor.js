import useIamStore from '../application/iam.store.js';
import { registerRequestInterceptor } from '../../shared/infrastructure/interceptor-registry.js';

export const iamInterceptor = (config) => {
  const store = useIamStore();
  if (store.isSignedIn) {
    config.headers.Authorization = `Bearer ${store.currentToken}`;
  }
  return config;
};

registerRequestInterceptor(iamInterceptor);
