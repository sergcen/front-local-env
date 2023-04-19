import * as os from 'node:os';
import path from 'node:path';

export const APP_DIR = 'frontend-env-versions';
export const DEST_DIR = path.join(os.homedir(), APP_DIR);
