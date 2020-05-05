import { FetcherState } from './useFetcher';
import { FOAF } from './ns';

export interface Profile {
  webId: string,
  name?: string,
  image?: string,
  friends: string[],
}

export function buildProfile(webId: string, response: FetcherState): Profile {
  const p: Profile = { webId, friends: [] };

  if (!response.loading && !response.error) {
    const user = response.store.sym(webId);
    const name = response.store.any(user, FOAF('name'));
    if (name && name.value) {
      p.name = name.value;
    }

    const image = response.store.any(user, FOAF('img'));
    if (image && image.value) {
      p.image = image.value;
    }

    const friends = response.store.each(user, FOAF('knows'));
    p.friends = friends.map(friend => friend.value);
  }

  return p;
}
