import { PLUGIN_VERSION } from './version';

// Template for local credentials.
// Copy this file to `environment.local.ts` (which is gitignored) and fill in `bauth`,
// then run: `npm run start:local` (ng serve --configuration local).
// The tracked environment.ts must always keep bauth: '' so secrets never reach git history.
export const environment = {
  production: false,
  version: PLUGIN_VERSION.version,
  alias: 'ai',
  apiUrl: 'https://stage-api.mef.dev',
  bauth: 'user:password'
};
