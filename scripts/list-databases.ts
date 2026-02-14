import { GoogleAuth } from 'google-auth-library';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Variáveis de ambiente do Firebase não encontradas');
  process.exit(1);
}

async function getAccessToken() {
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

async function listDatabases() {
  console.log('🔐 Autenticando com service account...');
  const token = await getAccessToken();

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Erro ao listar databases:', error);
    process.exit(1);
  }

  const data = await response.json();

  console.log('\n📊 Databases encontrados:\n');
  if (data.databases && data.databases.length > 0) {
    data.databases.forEach((db: any) => {
      const dbName = db.name.split('/').pop();
      console.log(`  - ${dbName}`);
      console.log(`    Type: ${db.type}`);
      console.log(`    Location: ${db.locationId}`);
      console.log();
    });
  } else {
    console.log('  Nenhum database encontrado');
  }
}

listDatabases().catch((error) => {
  console.error('❌ Erro:', error.message);
  process.exit(1);
});
