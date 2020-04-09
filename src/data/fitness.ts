import GoogleFit, { Scopes } from 'react-native-google-fit';
import moment from 'moment';
import { AppStorage, storage } from './storage';

export interface DailySteps {
  date: string,
  value: number,
}

export interface DailyData {
  date: string,
  steps?: number,
  heartrate: { time: string, value: number }[],
}

export class FitnessService {

  storage: AppStorage;
  data: Map<string, DailyData[]>

  constructor(storage: AppStorage) {
    this.storage = storage;
    this.data = new Map();
  }

  getMonth(date: string): DailyData[] | undefined {
    const formatted = moment(date).startOf('month').format('YYYY-MM');
    return this.data.get(formatted);
  }

  keyForIndex(): string {
    return 'fitnessMonths';
  }

  keyForMonth(month: string): string {
    return 'fitnessMonth:' + month;
  }

  async authorize(): Promise<boolean> {
    await GoogleFit.checkIsAuthorized();
    if (GoogleFit.isAuthorized)
      return true;
    
    const options = {
      scopes: [
        Scopes.FITNESS_ACTIVITY_READ_WRITE,
        Scopes.FITNESS_BODY_READ_WRITE,
      ],
    }
    const result = await GoogleFit.authorize(options);
    return result.success;
  }

  async load(): Promise<void> {
    let months;
    try {
      months = await this.storage.getItem(this.keyForIndex());
    } catch (err) {
      console.warn('Could not load months', err);
      return;
    }

    if (months == null)
      return;
    
    await Promise.all(months.map(async (month: string) => {
      let data: DailyData[] | null;
      try {
        data = await this.storage.getItem(this.keyForMonth(month));
      } catch (err) {
        console.warn(`Could not load registration for month "${month}"`, err);
        return;
      }

      if (data != null) {
        this.data.set(month, data);
      }
    }));

    console.log(`Loaded data for months: ${Array.from(this.data.keys())}`);
  }

  async importSteps(startDate: string, endDate: string): Promise<DailySteps[]> {
    const result: { source: string, steps: DailySteps[] }[] = await GoogleFit.getDailyStepCountSamples({ startDate, endDate });
    const entry = result.find(({ source }) => source === 'com.google.android.gms:merge_step_deltas');
    if (entry)
      return entry.steps;
    return [];
  }

  importHeartrate(startDate: string, endDate: string): Promise<{ time: string, value: number }[]> {
    return new Promise<{ time: string, value: number }[]>((resolve, reject) => {
      GoogleFit.getHeartRateSamples(
        { startDate, endDate },
        (err, result) => {
          if (err === 'There is no any heart rate data for this period') {
            return resolve([]);
          }

          if (err) {
            return reject(err);
          }
          
          resolve(result.map(r => ({
            time: r.startDate,
            value: r.value,
          })));
        }
      );
    });
  }

  async importMonth(month: string): Promise<DailyData[]> {
    const m = moment(month).startOf('month');
    const monthString = m.format('YYYY-MM');

    if (this.data.has(monthString))
      throw new Error(`Month already imported: ${monthString}`);
    
    const startDate = m.format();
    const endDate = m.clone().endOf('month').format();

    const totalDays = m.daysInMonth();
    const entries: DailyData[] = [];
    for (let i = 0; i < totalDays; i++) {
      entries.push({
        date: m.clone().add(i, 'days').format('YYYY-MM-DD'),
        heartrate: []
      });
    }

    const [steps, heartRates] = await Promise.all([
      this.importSteps(startDate, endDate),
      this.importHeartrate(startDate, endDate),
    ]);

    for (const { date, value } of steps) {
      const dateObj = moment(date).startOf('day');
      const index = dateObj.diff(m, 'days');
      console.log(`${date} corresponds to index ${index}`);
      entries[index].steps = value;
    }

    for (const { time, value } of heartRates) {
      const dateObj = moment(time).startOf('day');
      const index = dateObj.diff(m, 'days');
      console.log(`${time} corresponds to index ${index}`);
      entries[index].heartrate.push({ time, value });
    }

    this.data.set(monthString, entries);
    await this.storage.setItem(this.keyForMonth(monthString), entries);
    await this.storage.setItem(this.keyForIndex(), Array.from(this.data.keys()));

    return entries;
  }

}

export const fitness = new FitnessService(storage);
