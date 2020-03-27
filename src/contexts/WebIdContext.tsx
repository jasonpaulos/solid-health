import React, {
  FunctionComponent,
  useState,
  useEffect,
} from 'react';

export const WebIdContext = React.createContext<string | null>(null);

export interface WebIdProviderProps {
  auth: any
};

export const WebIdProvider: FunctionComponent<WebIdProviderProps> = ({
  auth,
  children
}) => {
  const [webId, setWebId] = useState<string | null>(null);

  useEffect(() => {
    const onSessionChange = (session: any) => {
      const newWebId = session ? session.webId : null;
      if (newWebId != webId) {
        setWebId(newWebId);
      }
    };

    auth.trackSession(onSessionChange);

    return () => auth.stopTrackSession(onSessionChange);
  }, [auth, webId]);

  return (
    <WebIdContext.Provider value={webId}>
      {children}
    </WebIdContext.Provider>
  );
};
