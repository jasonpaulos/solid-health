import { register, RegistrationResponse } from 'react-native-app-auth';
import { AppStorage, storage } from './storage';
import { redirectUrl, clientName } from './oauth';

export type Registration = RegistrationResponse & { registeredAt: string };

export class RegistrationService {

  storage: AppStorage;
  sites: Map<string, Registration>;

  constructor(storage: AppStorage) {
    this.storage = storage;
    this.sites = new Map();
  }

  keyForIndex(): string {
    return 'registeredSites';
  }

  keyForSite(site: string): string {
    return 'registeredSite:' + site;
  }

  async load() {
    let registeredSites;
    try {
      registeredSites = await this.storage.getItem(this.keyForIndex());
    } catch (err) {
      console.warn('Could not load registered sites', err);
      return;
    }

    if (registeredSites == null)
      return;

    await Promise.all(registeredSites.map(async (site: string) => {
      let registration: Registration | null;
      try {
        registration = await this.storage.getItem(this.keyForSite(site));
      } catch (err) {
        console.warn(`Could not load registration for site "${site}"`, err);
        return;
      }

      if (registration != null)
        this.sites.set(site, registration);
    }));
  }

  async registerSite(url: string): Promise<Registration> {
    if (this.sites.has(url))
      throw new Error(`Site already registered: "${url}"`);
    
    const res = await register({
      issuer: url,
      redirectUrls: [redirectUrl],
      additionalParameters: {
        client_name: clientName,
      },
    });

    const registration = {
      registeredAt: new Date().toISOString(),
      ...res,
    };

    this.sites.set(url, registration);
    await storage.setItem(this.keyForSite(url), registration);
    await storage.setItem(this.keyForIndex(), Array.from(this.sites.keys()));

    return registration;
  }

  async gatherRegistration(url: string): Promise<Registration> {
    const registration = this.sites.get(url);
    if (registration)
      return registration;
    
    return this.registerSite(url);
  }

}

export const registration = new RegistrationService(storage);
