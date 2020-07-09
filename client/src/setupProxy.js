const { createProxyMiddleware } = require('http-proxy-middleware');

const socketProxy = createProxyMiddleware('/socket', {
  target: 'http://localhost:8000/',
  changeOrigin: true,
  ws: true,
  logLevel: 'debug',
});

module.exports = (app) => {
  app.use(socketProxy);
};
