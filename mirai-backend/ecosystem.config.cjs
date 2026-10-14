// PM2 process file for the MIRAI API on the server.
//   npm ci && npm run build && pm2 start ecosystem.config.cjs && pm2 save
// Settings come from mirai-backend/.env (copied to the server by hand, never committed).
module.exports = {
  apps: [
    {
      name: 'mirai-api',
      script: 'dist/server.js',
      cwd: __dirname,
      // One process: the notification scheduler and in-memory caches must not run twice
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
      },
      time: true,
    },
  ],
};
