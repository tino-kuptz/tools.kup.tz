export default {
  strict: true,
  routes: scannedRoutes => [
    ...scannedRoutes,
    {
      path: '/',
      name: 'index',
      redirect: '/tools',
    },
  ],
}
