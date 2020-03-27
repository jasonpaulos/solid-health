import { authorize } from 'react-native-app-auth';
import auth from '@jasonpaulos/solid-auth-client';
import jwtDecode from 'jwt-decode';
import { scopes, redirectUrl } from './oauth';
import { registration } from './registration';
import { storage } from './storage';

const authConfig = {
  scopes,
  redirectUrl,
};

const sessionKey = 'appSession';

export async function load(): Promise<void> {
  const session = await storage.getItem(sessionKey);
  if (session != null)
    await auth.setSession(session);
}

function getIssuer() {
  return 'https://solid.community';
}

export async function logIn(): Promise<string> {
  const issuer = getIssuer();
  const { clientId, clientSecret } = await registration.gatherRegistration(issuer);

  const resp = await authorize({
    issuer,
    clientId,
    clientSecret,
    ...authConfig,
  });

  const decoded = jwtDecode(resp.idToken);
  // TODO: verify issuer and webId are compatible

  const session = {
    credentialType: 'pop_token',
    idClaims: {},
    issuer,
    idp: issuer,
    webId: decoded.sub,
    accessToken: resp.accessToken,
    idToken: resp.idToken,
    clientId,
    //sessionKey: JSON.stringify(keys.private),
    authorization: {
      client_id: clientId,
      id_token: resp.idToken,
      access_token: resp.accessToken,
      refresh_token: resp.refreshToken,
    }
  };

  await Promise.all([
    auth.setSession(session),
    storage.setItem(sessionKey, session)
  ]);

  return session.webId;
}

export async function logOut(): Promise<void> {
  await Promise.all([
    auth.logout(),
    storage.removeItem(sessionKey)
  ]);
}
