import path from 'path';
import { fileURLToPath } from 'url';


// __dirname for es6 modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PUBLIC_PATH = '/public';

export function getPublicFilePath(relativePath) {
  return path.join(__dirname, PUBLIC_PATH, relativePath);
}