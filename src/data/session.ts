import { authorize } from 'react-native-app-auth';
import auth from '@jasonpaulos/solid-auth-client';
import jwtDecode from 'jwt-decode';
import { scopes, redirectUrl } from './oauth';
import { registration } from './registration';

const authConfig = {
  scopes,
  redirectUrl,
};

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

  auth.setSession(session);

  return session.webId;
}

export function logOut(): Promise<void> {
  return auth.logout();
}
