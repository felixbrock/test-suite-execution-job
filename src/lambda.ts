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

export const testSuiteTypes = ['test', 'custom-test', 'nominal-test'] as const;
export type TestSuiteType = typeof testSuiteTypes[number];

export const parseTestSuiteType = (testSuiteType: string): TestSuiteType => {
  const identifiedElement = testSuiteTypes.find(
    (element) => element.toLowerCase() === testSuiteType.toLowerCase()
  );
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
};

export interface TriggerResponse {
  status: number;
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

const triggerTest = async (
  requestPath: string,
  testSuiteId: string
): Promise<TriggerResponse> => {
  console.log(`Triggering test suite jobs for testSuite ${testSuiteId}`);

  const jwt = await getJwt();

  const config: AxiosRequestConfig = {
    headers: { Authorization: `Bearer ${jwt}` },
  };

  const triggerTestExecutionResponse = await axios.post(
    requestPath,
    { testSuiteId },
    config
  );

  return { status: triggerTestExecutionResponse.status };
};

export const handler = async (
  event: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  callback: any
): Promise<void> => {
  try {
    const { testSuiteId, testType } = event;

    if(testSuiteId) throw new Error('Received request with missing params');

    let response: TriggerResponse;
    switch (parseTestSuiteType(testType)) {
      case 'test': {
        response = await triggerTest(
          `https://ax4h0t5r59.execute-api.eu-central-1.amazonaws.com/production/api/v1/test-suites/execute`,
          testSuiteId
        );

        // response = await triggerTest(
        //    `http://localhost:3012/api/v1/test-suite/execute`,
        //   testSuiteId
        // );

        break;
      }
      case 'custom-test': {
        response = await triggerTest(
          `https://ax4h0t5r59.execute-api.eu-central-1.amazonaws.com/production/api/v1/custom-test-suites/execute`,
          testSuiteId
        );

        break;
      }

      case 'nominal-test': {
        response = await triggerTest(
          `https://ax4h0t5r59.execute-api.eu-central-1.amazonaws.com/production/api/v1/nominal-test-suites/execute`,
          testSuiteId
        );

        break;
      }

      default:
        throw new Error('Unknown test type provided');
    }

    if (response.status !== 201)
      throw new Error(
        `Failed ot execute custom tests (testSuiteId ${testSuiteId})`
      );

    callback(null, event);
  } catch (error: any) {
    if (typeof error === 'string') console.trace(error);
    else if (error instanceof Error) console.trace(error.message);
    console.trace('Uknown error occurred');
  }
};
