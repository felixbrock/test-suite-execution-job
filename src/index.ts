// import express from 'express';
// import { appConfig } from './config';
// import { handler } from './lambda';

// const app = express();

// app.get('/', (req, res) => {
//   console.log(req.method, res.status);

//   handler(
//     {
//       frequency: 1
//     },
//     undefined,
//     () => {}
//   );
// });

// app.listen(appConfig.express.port, () => {
//   console.log(
//     `App running under pid ${process.pid} and listening on port: ${appConfig.express.port} in ${appConfig.express.mode} mode`
//   );
// });

console.log('local startup');