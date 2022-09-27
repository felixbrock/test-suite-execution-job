import axios, { AxiosRequestConfig } from 'axios';
import { appConfig } from './config';

export interface AccountDto {
  userId: string;
  organizationId: string;
  // eslint-disable-next-line semi
}

export interface OrganizationDto {
  name: string;
}

const getJwt = async (): Promise<string> => {
  try {
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${appConfig.cloud.authSchedulerEnvConfig.clientId}:${appConfig.cloud.authSchedulerEnvConfig.clientSecret}`
        ).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      params: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: appConfig.cloud.authSchedulerEnvConfig.clientId,
      }),
    };

    const response = await axios.post(
      appConfig.cloud.authSchedulerEnvConfig.tokenUrl,
      undefined,
      config
    );
    const jsonResponse = response.data;
    if (response.status !== 200) throw new Error(jsonResponse.message);
    if (!jsonResponse.access_token)
      throw new Error('Did not receive an access token');
    return jsonResponse.access_token;
  } catch (error: unknown) {
    if (typeof error === 'string') return Promise.reject(error);
    if (error instanceof Error) return Promise.reject(error.message);
    return Promise.reject(new Error('Unknown error occured'));
  }
};

export const handler = async (
  event: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  callback: any
): Promise<void> => {
  try {

    const { frequency } = event;

    console.log(`Triggering test suite jobs with frequency ${frequency}h`);
    

    const jwt = await getJwt();
      
    const config: AxiosRequestConfig = {
      headers: { Authorization: `Bearer ${jwt}` },
    };

    const triggerTestExecutionResponse = await axios.post(
      `https://ax4h0t5r59.execute-api.eu-central-1.amazonaws.com/production/api/v1/test-suites/execute`,
      // `http://localhost:3012/api/v1/test-suite/execute`,
      {frequency},
      config
    );

    if (triggerTestExecutionResponse.status !== 201) throw new Error(`Failed ot execute tests (frequency ${frequency})`);
    
    const triggerCustomTestExecutionResponse = await axios.post(
      `https://ax4h0t5r59.execute-api.eu-central-1.amazonaws.com/production/api/v1/custom-test-suites/execute`,
      // `http://localhost:3012/api/v1/test-suite/execute`,
      {frequency},
      config
    );

    if (triggerCustomTestExecutionResponse.status !== 201) throw new Error(`Failed ot execute custom tests (frequency ${frequency})`);
    
    const triggerNominalTestExecutionResponse = await axios.post(
      `https://ax4h0t5r59.execute-api.eu-central-1.amazonaws.com/production/api/v1/nominal-test-suites/execute`,
      // `http://localhost:3012/api/v1/test-suite/execute`,
      {frequency},
      config
    );

    if (triggerNominalTestExecutionResponse.status !== 201) throw new Error(`Failed ot execute nominal tests (frequency ${frequency})`);  
       
    callback(null, event);
  } catch (error: any) {
    if(typeof error === 'string') console.error(error);
    else if (error instanceof Error) console.error(error.message);
    console.error('Uknown error occurred');
  }
};



