import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const serverRoot = path.resolve(path.dirname(currentFile), '..');
const projectRoot = path.resolve(serverRoot, '..');

// npm workspace scripts run with cwd=server/, while this project keeps .env at repo root.
// Load repo-root .env first, then allow server/.env to override for local server-only settings.
dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config({ path: path.join(serverRoot, '.env'), override: true });
