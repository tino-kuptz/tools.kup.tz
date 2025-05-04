export default {
  routes: scannedRoutes => [
    ...scannedRoutes,
    {
      path: '/',
      name: 'index',
      redirect: '/tools',
    },
  ],
}
