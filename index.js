import { URL } from 'whatwg-url';
import { Buffer } from 'buffer/';

global.URL = URL; // needed by solid-auth-client and @jasonpaulos/solid-auth-client
global.Buffer = Buffer; // needed by whatwg-url

import('./src');
