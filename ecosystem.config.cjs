module.exports = {
  apps: [
    {
      name: 'api',
      cwd: 'apps/api-nest',
      script: 'bash',
      args: '-lc "pnpm exec ts-node-dev --respawn --transpile-only src/main.ts"',
      env: {
        NODE_ENV: 'development',
        PORT: '3001',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/bank?schema=public'
      },
      autorestart: true,
      time: true,
      max_restarts: 10,
      restart_delay: 2000
    },
    {
      name: 'web',
      cwd: 'apps/web-next',
      script: 'bash',
      args: '-lc "pnpm exec next dev -p 3000"',
      env: {
        NODE_ENV: 'development',
        BACKEND_TARGET: 'nest',
        NEST_API_URL: 'http://localhost:3001',
        PORT: '3000'
      },
      autorestart: true,
      time: true
    }
  ]
}
