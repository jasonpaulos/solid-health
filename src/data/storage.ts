import AsyncStorage from '@react-native-community/async-storage';

export type StringifyFn = (value: any) => string;
export type ParseFn = (str: string) => any;

export class AppStorage {

  prefix: string;
  stringify: StringifyFn;
  parse: ParseFn;

  constructor(
    prefix: string,
    stringify: StringifyFn = JSON.stringify.bind(JSON),
    parse: ParseFn = JSON.parse.bind(JSON),
  ) {
    this.prefix = prefix;
    this.stringify = stringify;
    this.parse = parse;
  }

  async setItem(key: string, value: any) {
    const storageKey = this.prefix + key;
    const storageValue = this.stringify(value);
    await AsyncStorage.setItem(storageKey, storageValue);
  }

  async getItem(key: string) {
    const storageKey = this.prefix + key;
    const storageValue = await AsyncStorage.getItem(storageKey);
    if (storageValue)
      return this.parse(storageValue)
    return null;
  }

}

export const storage = new AppStorage('solidhealth:');
