import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const standalone = join(root, '.next/standalone');
await mkdir(join(standalone, '.next'), { recursive: true });
await cp(join(root, '.next/static'), join(standalone, '.next/static'), { recursive: true });
await cp(join(root, 'public'), join(standalone, 'public'), { recursive: true });
