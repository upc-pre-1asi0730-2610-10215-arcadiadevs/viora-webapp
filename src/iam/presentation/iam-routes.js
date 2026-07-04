const signInForm = () => import('./views/sign-in-form.vue');
const signUpForm = () => import('./views/sign-up-form.vue');
const verifyPage = () => import('./views/verify-page.vue');

const iamRoutes = [
  { path: 'sign-in', name: 'iam-sign-in', component: signInForm, meta: { title: 'Sign-In' } },
  { path: 'sign-up', name: 'iam-sign-up', component: signUpForm, meta: { title: 'Sign-Up' } },
  { path: 'verify', name: 'iam-verify', component: verifyPage, meta: { title: 'Verify Email' } }
];

export default iamRoutes;
