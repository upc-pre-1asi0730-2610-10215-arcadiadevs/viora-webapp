const preserveLocation = (name) => (to) => ({
    name,
    query: to.query,
    hash: to.hash,
});

const iamRoutes = [
  { path: 'sign-in', redirect: preserveLocation('iam-sign-in') },
  { path: 'sign-up', redirect: preserveLocation('iam-sign-up') },
  { path: 'verify', redirect: preserveLocation('iam-verify') },
  { path: '', name: 'iam-index', redirect: { name: 'iam-sign-in' } }
];

export default iamRoutes;
