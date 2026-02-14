import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env.local');
const firebasercPath = join(process.cwd(), '.firebaserc');

const envContent = readFileSync(envPath, 'utf-8');
const projectIdMatch = envContent.match(/FIREBASE_PROJECT_ID=(.+)/);

if (!projectIdMatch) {
  console.error('FIREBASE_PROJECT_ID não encontrado no .env.local');
  process.exit(1);
}

const projectId = projectIdMatch[1].trim();

const firebasercContent = {
  projects: {
    default: projectId,
  },
};

writeFileSync(firebasercPath, JSON.stringify(firebasercContent, null, 2));

console.log(`✅ .firebaserc configurado com o projeto: ${projectId}`);
console.log('\nPróximos passos:');
console.log('1. Execute: bun run setup:firebase');
console.log('2. Execute: firebase deploy --only firestore:indexes');
