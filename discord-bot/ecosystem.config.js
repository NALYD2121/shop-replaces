module.exports = {
  apps: [{
    name: 'shop-replace-bot',
    script: 'bot.js',
    watch: true,
    env: {
      NODE_ENV: 'production',
    },
    env_production: {
      NODE_ENV: 'production'
    },
    max_memory_restart: '200M',
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    time: true,
    restart_delay: 4000,
    autorestart: true
  }]
}; 