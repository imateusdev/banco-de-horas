# 🚀 Deploy no Coolify - Banco de Horas

## 📋 Pré-requisitos

1. **PostgreSQL Database** criado no Coolify
2. **Connection String** do PostgreSQL

## 🔧 Configuração no Coolify

### 1. Criar Aplicação
- Tipo: **Docker Application**
- Repository: Seu repositório Git
- Branch: `main`

### 2. Configurar Build
- **Dockerfile Path**: `./Dockerfile`
- **Build Context**: `.`

### 3. Variáveis de Ambiente
Adicionar as seguintes variáveis:

```env
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database?schema=public
```

### 4. Configurações de Rede
- **Port**: `3000`
- **Protocol**: `HTTP`

### 5. Health Check (Opcional)
- **Path**: `/api/health` (você pode criar depois)
- **Interval**: `30s`

## 🐘 PostgreSQL no Coolify

### 1. Criar Database
- Ir em **Databases** → **New Database**
- Escolher **PostgreSQL**
- Definir nome, usuário e senha

### 2. Obter Connection String
Após criar, copiar a connection string:
```
postgresql://username:password@host:port/database
```

### 3. Configurar na Aplicação
Adicionar na variável `DATABASE_URL` da aplicação Next.js

## 🔄 Deployment

### Processo Automático
1. Push para o repositório
2. Coolify detecta mudanças
3. Executa build do Docker
4. Roda migrations automaticamente
5. Inicia aplicação

### Logs
Acompanhar logs no painel do Coolify:
- Build logs
- Runtime logs
- Database logs

## 📊 Migrations

As migrations rodam **automaticamente** no startup:
1. `npx prisma migrate deploy`
2. `npx prisma generate`
3. Inicia aplicação

## 🛠 Comandos Úteis

### Desenvolvimento Local
```bash
# Rodar com Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Parar
docker-compose down
```

### Build Manual
```bash
# Build da imagem
docker build -t banco-de-horas .

# Rodar container
docker run -p 3000:3000 -e DATABASE_URL="postgresql://..." banco-de-horas
```

## 🔍 Troubleshooting

### Problemas Comuns

1. **Erro de Conexão com DB**
   - Verificar DATABASE_URL
   - Verificar se PostgreSQL está rodando
   - Verificar firewall/network

2. **Migrations Falhando**
   - Verificar permissões do usuário do banco
   - Verificar se schema existe
   - Ver logs detalhados

3. **Build Failing**
   - Verificar Dockerfile
   - Verificar dependencies
   - Ver build logs no Coolify

### Debug
```bash
# Conectar no container
docker exec -it container_id sh

# Ver logs específicos
docker logs container_id

# Testar conexão com banco
npx prisma db pull
```

## ✅ Checklist de Deploy

- [ ] PostgreSQL criado no Coolify
- [ ] DATABASE_URL configurada
- [ ] Dockerfile testado localmente
- [ ] Repository conectado no Coolify
- [ ] Build configurado corretamente
- [ ] Port 3000 exposta
- [ ] Environment variables configuradas
- [ ] Deploy executado
- [ ] Aplicação acessível
- [ ] Banco populado (migration)

## 🎯 URLs

- **App**: `https://seu-app.coolify.io`
- **Database**: Internal (via connection string)
- **Logs**: Painel do Coolify

## 🔐 Segurança

- DATABASE_URL não deve estar no código
- Usar secrets do Coolify para dados sensíveis
- Configurar headers de segurança (já incluídos no next.config.ts)

## 📈 Próximos Passos

1. Configurar domain customizado
2. Adicionar SSL/TLS
3. Configurar backups automáticos
4. Monitoramento e alertas
5. CDN para assets estáticos
