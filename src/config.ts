import dotenv from 'dotenv';

import path from 'path';

const dotenvConfig =
  process.env.NODE_ENV === 'development'
    ? { path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`) }
    : {};
dotenv.config(dotenvConfig);

export interface AuthSchedulerEnvConfig {
  clientSecret: string;
  clientId: string;
  tokenUrl: string;
}

const getAuthSchedulerEnvConfig = (): AuthSchedulerEnvConfig => {
  const clientSecret = process.env.SYSTEM_INTERNAL_AUTH_CLIENT_SECRET;
  const clientId = process.env.SYSTEM_INTERNAL_AUTH_CLIENT_ID;
  const tokenUrl = process.env.SYSTEM_INTERNAL_AUTH_TOKEN_URL;

  if (!clientSecret || !clientId || !tokenUrl)
    throw new Error('missing auth scheduler env values');

  return { clientSecret, clientId, tokenUrl };
};

export const appConfig = {
  express: {
    mode: process.env.NODE_ENV || 'development',
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 7213,
    apiRoot: process.env.API_ROOT || 'api',
  },
  cloud: {
    authSchedulerEnvConfig: getAuthSchedulerEnvConfig(),
    region: 'eu-central-1',
  },
};
