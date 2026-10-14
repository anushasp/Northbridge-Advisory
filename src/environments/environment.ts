/**
 * Production build (Amplify). There's no backend server in production, so
 * API calls are answered in the browser by the mock API interceptor.
 */
export const environment = {
  useInBrowserApi: true,
};
