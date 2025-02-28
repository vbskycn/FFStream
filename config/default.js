module.exports = {
  app: {
    name: 'FFStream',
    version: '1.0.0',
    port: process.env.PORT || 3000
  },
  stream: {
    pushServer: 'rtmp://your-rtmp-server/live/'
  },
  database: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/ffstream'
  }
}; 