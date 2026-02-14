import { readFileSync } from 'fs';
import { join } from 'path';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Variáveis de ambiente do Firebase não encontradas');
  process.exit(1);
}

const indexesPath = join(process.cwd(), 'firestore.indexes.json');
const indexesContent = JSON.parse(readFileSync(indexesPath, 'utf-8'));

async function getAccessToken() {
  const { GoogleAuth } = await import('google-auth-library');

  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();

  if (!tokenResponse.token) {
    throw new Error('Falha ao obter token de acesso');
  }

  return tokenResponse.token;
}

async function createIndex(index: any, token: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/default/collectionGroups/${index.collectionGroup}/indexes`;

  const body = {
    fields: index.fields,
    queryScope: index.queryScope,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    if (error.includes('ALREADY_EXISTS')) {
      return { success: true, exists: true };
    }
    throw new Error(`Erro ao criar índice: ${error}`);
  }

  return { success: true, exists: false };
}

async function deployIndexes() {
  console.log('🔐 Autenticando com service account...');
  const token = await getAccessToken();

  console.log(`\n📊 Criando ${indexesContent.indexes.length} índices no Firestore...\n`);

  for (const index of indexesContent.indexes) {
    const fields = index.fields.map((f: any) => `${f.fieldPath} (${f.order})`).join(', ');
    try {
      const result = await createIndex(index, token);
      if (result.exists) {
        console.log(`⏭️  ${index.collectionGroup}: [${fields}] - já existe`);
      } else {
        console.log(`✅ ${index.collectionGroup}: [${fields}] - criado`);
      }
    } catch (error: any) {
      console.error(`❌ ${index.collectionGroup}: [${fields}] - erro: ${error.message}`);
    }
  }

  console.log('\n✨ Deploy de índices concluído!');
}

deployIndexes().catch((error) => {
  console.error('❌ Erro ao fazer deploy dos índices:', error.message);
  process.exit(1);
});
