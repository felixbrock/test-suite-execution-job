import axios, { AxiosRequestConfig } from 'axios';
import { appConfig } from './config';

export interface OrganizationDto {
  name: string;
}

export const executionTypes = ['automatic', 'frequency'] as const;
export type ExecutionType = typeof executionTypes[number];

export const parseExecutionType = (executionType: unknown): ExecutionType => {
  const identifiedElement = executionTypes.find(
    (element) => element === executionType
  );
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
};

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
  targetOrgId: string,
  executionType: ExecutionType
): Promise<TriggerResponse> => {
  const jwt = await getJwt();

  const config: AxiosRequestConfig = {
    headers: { Authorization: `Bearer ${jwt}` },
  };

  const triggerTestExecutionResponse = await axios.post(
    requestPath,
    { targetOrgId, executionType },
    config
  );

  return { status: triggerTestExecutionResponse.status };
};

const triggerExecution = async (props: {
  testSuiteId: string;
  testSuiteType: TestSuiteType;
  targetOrgId: string;
  executionType: ExecutionType;
}): Promise<void> => {
  console.log(
    `Triggering execution of test suite ${props.testSuiteId} with org id ${props.targetOrgId}`
  );

  let response: TriggerResponse;

  switch (parseTestSuiteType(props.testSuiteType)) {
    case 'test': {
      response = await triggerTest(
        `${appConfig.baseurl.observability}/api/v1/test-suite/${props.testSuiteId}/execute`,
        props.targetOrgId,
        props.executionType
      );

      break;
    }
    case 'custom-test': {
      response = await triggerTest(
        `${appConfig.baseurl.observability}/api/v1/custom-test-suite/${props.testSuiteId}/execute`,
        props.targetOrgId,
        props.executionType
      );

      break;
    }

    case 'nominal-test': {
      response = await triggerTest(
        `${appConfig.baseurl.observability}/api/v1/qual-test-suite/${props.testSuiteId}/execute`,
        props.targetOrgId,
        props.executionType
      );

      break;
    }

    default:
      throw new Error('Unknown test type provided');
  }

  if (response.status !== 201)
    throw new Error(
      `Failed ot execute custom tests (testSuiteId ${props.testSuiteId})`
    );
};

const handle = async (recordBody: {
  testSuiteId: string;
  testSuiteType: string;
  targetOrgId: string;
  executionType: string;
}): Promise<void> => {
  const { executionType, targetOrgId, testSuiteId, testSuiteType } = recordBody;

  if (testSuiteId && testSuiteType && targetOrgId && executionType)
    await triggerExecution({
      testSuiteId,
      testSuiteType: parseTestSuiteType(testSuiteType),
      targetOrgId,
      executionType: parseExecutionType(executionType),
    });
  else
    throw new Error(
      `Props misalignment - No matching use case found that matches combination of provided props\nReceived Event: testSuiteId: ${testSuiteId} targetOrgId: ${targetOrgId}`
    );
};

export const handler = async (
  event: {
    Records: { body: string }[];
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: any,
  callback: any
): Promise<void> => {
  try {
    const batchSize = event.Records.length;

    console.log(`Executing batch of ${batchSize}`);

    await Promise.all(
      event.Records.map(async (el) => {
        const isBody = (
          obj: unknown
        ): obj is {
          testSuiteId: string;
          testSuiteType: string;
          targetOrgId: string;
          executionType: string;
        } =>
          !!obj &&
          typeof obj === 'object' &&
          'testSuiteId' in obj &&
          'testSuiteType' in obj &&
          'targetOrgId' in obj &&
          'executionType' in obj;
        const body: unknown = JSON.parse(el.body);

        if (!isBody(body))
          throw new Error('Provided record does not hold expected body format');

        /* Block  tests executed for a specific org */

        if (body.targetOrgId === '6372d0a453a0669ff7ced7d9') {
          console.log('skipping ph. organization tests');

          return;
        }

        await handle(body);
      })
    );

    callback(null, event);
  } catch (error: unknown) {
    if (error instanceof Error) console.error(error.stack);
    else if (error) console.trace(error);
    else console.trace('Uknown error occurred');
  }
};
