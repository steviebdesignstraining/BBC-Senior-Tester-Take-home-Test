// utils/envWriter.ts
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');

export function writeEnv(key: string, value: string | number) {
  const envContent = fs.readFileSync(envPath, 'utf-8');

  const regex = new RegExp(`^${key}=.*`, 'm');

  const newLine = `${key}=${value}`;

  const updatedContent = envContent.match(regex)
    ? envContent.replace(regex, newLine)
    : `${envContent}\n${newLine}`;

  fs.writeFileSync(envPath, updatedContent);
}
