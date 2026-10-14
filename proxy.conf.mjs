// Dev-server proxy: /api/* -> mock API. API_PORT lets you run a second copy side by side.
const apiPort = process.env.API_PORT ?? 3000;

export default {
  '/api': {
    target: `http://localhost:${apiPort}`,
    secure: false,
    pathRewrite: { '^/api': '' },
  },
};
