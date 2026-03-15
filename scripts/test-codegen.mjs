import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const out = 'mobile-designer/generated/GeneratedScreen.tsx';

execFileSync(
  process.execPath,
  ['scripts/generate-expo-screen.mjs', '--input', 'specs/example-design.json', '--output', out, '--component', 'GeneratedScreen'],
  { stdio: 'inherit' }
);

const outPath = path.resolve(process.cwd(), out);
if (!fs.existsSync(outPath)) {
  throw new Error('Codegen output file was not created.');
}

const text = fs.readFileSync(outPath, 'utf8');
if (!text.includes('export default function GeneratedScreen')) {
  throw new Error('Generated screen file is missing expected component export.');
}

process.stdout.write('Codegen test passed.\n');
