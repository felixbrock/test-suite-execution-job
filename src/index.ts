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
            testSuiteId: 'f0f0d0d3-5cb0-4ab6-a9c1-0cb7ef7d92a3',
            testSuiteType: 'test',
            targetOrgId: '631789bf27518f97cf1c82b7',
            // targetOrgId: 'someCustId',
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
