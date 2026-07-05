import useIamStore from '../application/iam.store.js';

export const authenticationGuard = (to, from) => {
  const store = useIamStore();
  const isAnonymous = !store.isSignedIn;
  const routeIsPublic = to.meta.public === true;
  const routeIsGuestOnly = to.meta.guest === true;

  if (!isAnonymous && routeIsGuestOnly) return store.signedInHomeRoute;
  if (isAnonymous && !routeIsPublic) return { name: 'iam-sign-in' };

  return true;
};
