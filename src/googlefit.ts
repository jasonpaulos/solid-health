import GoogleFit, { Scopes } from 'react-native-google-fit';
import moment from 'moment';

export async function isAuthorized(): Promise<boolean> {
  await GoogleFit.checkIsAuthorized();
  return GoogleFit.isAuthorized;
}

let authorizePromise: Promise<boolean> | null = null;

export async function authorize(): Promise<boolean> {
  if (authorizePromise == null) {
    const _authorize = async (): Promise<boolean> => {
      if (await isAuthorized()) {
        return true;
      }
    
      const options = {
        scopes: [
          Scopes.FITNESS_ACTIVITY_READ,
          Scopes.FITNESS_LOCATION_READ,
          Scopes.FITNESS_BODY_READ,
        ],
      };
    
      const authResult = await GoogleFit.authorize(options);
      if (authResult.success) {
        return true;
      }
    
      return false;
    };
    authorizePromise = _authorize();
  }

  // elaborate checks so that only one authorization attempt will run at a time
  const myAuthorizePromise = authorizePromise;
  const ret = await myAuthorizePromise;

  if (myAuthorizePromise === authorizePromise) {
    authorizePromise = null;
  }

  return ret;
}

export interface DataPoint {
  date: string,
  value: number,
}

export async function getDailySteps(startDate: string | Date, endDate: string | Date): Promise<DataPoint[]> {
  if (typeof startDate !== 'string')
    startDate = startDate.toISOString();
  
  if (typeof endDate !== 'string')
    endDate = endDate.toISOString();
  
  const success = await authorize();
  if (!success) {
    throw new Error('Could not authorize with Google Fit');
  }

  try {
    const result: { source: string, steps: DataPoint[] }[] =
      await GoogleFit.getDailyStepCountSamples({ startDate, endDate });
    
    const mergedSteps = result.find(
      ({ source }) => source === 'com.google.android.gms:merge_step_deltas'
    );

    if (mergedSteps) {
      return mergedSteps.steps;
    }
  } catch (err) {
    if (err === 'There is no any steps data for this period') {
      return [];
    }
    throw err;
  }

  return [];
}

export async function getDailyDistance(startDate: string | Date, endDate: string | Date): Promise<DataPoint[]> {
  if (typeof startDate !== 'string')
    startDate = startDate.toISOString();
  
  if (typeof endDate !== 'string')
    endDate = endDate.toISOString();
  
  const success = await authorize();
  if (!success) {
    throw new Error('Could not authorize with Google Fit');
  }

  return await new Promise((resolve, reject) => {
    GoogleFit.getDailyDistanceSamples(
      { startDate, endDate },
      (err, result) => {
        if ((err as any) === 'There is no any distance data for this period') {
          return resolve([]);
        }

        if (err) {
          return reject(err);
        }

        resolve(result.map(r => ({
          date: moment.utc(r.startDate).format('YYYY-MM-DD'),
          value: r.distance,
        })));
      }
    );
  });
}

export async function getHeartRate(startDate: string | Date, endDate: string | Date): Promise<DataPoint[]> {
  if (typeof startDate !== 'string')
    startDate = startDate.toISOString();

  if (typeof endDate !== 'string')
    endDate = endDate.toISOString();

  const success = await authorize();
  if (!success) {
    throw new Error('Could not authorize with Google Fit');
  }

  return await new Promise((resolve, reject) => {
    GoogleFit.getHeartRateSamples(
      { startDate, endDate },
      (err, result) => {
        if ((err as any) === 'There is no any heart rate data for this period') {
          return resolve([]);
        }

        if (err) {
          return reject(err);
        }
        
        resolve(result.map(r => ({
          date: r.startDate,
          value: r.value,
        })));
      }
    );
  });
}
