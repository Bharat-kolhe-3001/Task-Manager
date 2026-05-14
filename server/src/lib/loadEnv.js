import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
// This file: server/src/lib → server/.env
const serverEnvPath = path.resolve(here, '..', '..', '.env');
dotenv.config({ path: serverEnvPath });
// Optional: repo-root .env when starting via `node server/src/index.js` (fills vars missing from server/.env)
dotenv.config({ path: path.resolve(here, '..', '..', '..', '.env') });
