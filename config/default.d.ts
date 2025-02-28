declare module '*.js' {
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

  const config: Config;
  export default config;
} 