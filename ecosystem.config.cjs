// ecosystem.config.cjs — mode dev robuste sans CLI Nest
module.exports = {
  apps: [
    {
      name: 'api',
      cwd: 'apps/api-nest',
      // Démarrage direct du main en TS (évite ELIFECYCLE lié au CLI Nest)
      script: 'bash',
      args: '-lc "pnpm exec ts-node-dev --respawn --transpile-only src/main.ts"',
      env: {
        NODE_ENV: 'development',
        PORT: '3001',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/bank?schema=public',
        PATH: process.env.PATH
      },
      autorestart: true,
      time: true
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
        PORT: '3000',
        PATH: process.env.PATH
      },
      autorestart: true,
      time: true
    }
  ]
}
