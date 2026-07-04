import useIamStore from '../application/iam.store.js';

export const authenticationGuard = (to, from) => {
  const store = useIamStore();
  const isAnonymous = !store.isSignedIn;
  const publicRoutes = ['/iam/sign-in', '/iam/sign-up', '/iam/verify'];
  const routeRequiresAuth = !publicRoutes.includes(to.path);
  if (isAnonymous && routeRequiresAuth) return { name: 'iam-sign-in' };
  return true;
};
