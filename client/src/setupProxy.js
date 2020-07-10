const { createProxyMiddleware } = require('http-proxy-middleware');
let port = process.env.PORT || 8000;

const socketProxy = createProxyMiddleware('/socket', {
  target: `http://localhost:${port}/`,
  changeOrigin: true,
  ws: true,
  logLevel: 'debug',
});

module.exports = (app) => {
  app.use(socketProxy);
};
