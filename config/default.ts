interface Config {
  app: {
    name: string;
    version: string;
    port: number;
  };
  stream: {
    pushServer: string;
    pullServer: string;
  };
  database: {
    url: string;
  };
}

const config: Config = {
  app: {
    name: 'FFStream',
    version: '1.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000
  },
  stream: {
    pushServer: 'rtmp://ali.push.yximgs.com/live/',
    pullServer: 'http://ali.hlspull.yximgs.com/live/'
  },
  database: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/ffstream'
  }
};

export default config; 