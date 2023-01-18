import express from 'express';
import { appConfig } from './config';
import { handler } from './lambda';

const app = express();

app.get('/', (req, res) => {
  console.log(req.method, res.status);

  handler(
    {
      Records: [
        {
          body: JSON.stringify({
            testSuiteId: '4987287a-00ef-41f8-b882-12514379a81f',
            targetOrgId: '631789bf27518f97cf1c82b7',
            testSuiteType: 'test',
            executionType: 'frequency',
          }),
        },
      ],
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
