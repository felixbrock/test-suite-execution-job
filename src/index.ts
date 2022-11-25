import express from 'express';
import { appConfig } from './config';
import { handler } from './lambda';

const app = express();

app.get('/', (req, res) => {
  console.log(req.method, res.status);

  handler(
    {
      testSuiteId: 'ae5c70eb-789b-4584-b8a5-42b9c2220bd9',
      testSuiteType: 'test',
      // targetOrgId: '631789bf27518f97cf1c82b7',
      targetOrgId: 'someCustId',
      executionType: 'frequency'
    },
    undefined,
    () => {}
  );
});

app.listen(appConfig.express.port, () => {
  console.log(
    `App running under pid ${process.pid} and listening on port: ${appConfig.express.port} in ${appConfig.express.mode} mode`
  );
});
