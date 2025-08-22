# 🕐 Banco de Horas

Sistema completo de controle de ponto e banco de horas desenvolvido com **Next.js**, **TypeScript**, **Prisma** e **PostgreSQL**.

## 📋 Funcionalidades

### ⏰ **Controle de Ponto**
- Registro de entrada e saída com cálculo automático de horas
- Diferenciação entre trabalho normal e folgas/licenças
- Interface intuitiva para registrar períodos trabalhados

### 📊 **Dashboard Inteligente**
- Estatísticas detalhadas por mês
- Visualização de horas trabalhadas vs metas mensais
- Indicadores visuais com cores e percentuais
- Resumo de horas extras acumuladas

### 🎯 **Metas Mensais**
- Definição de metas de horas por mês
- Acompanhamento automático do progresso
- Cálculo de horas extras baseado nas metas

### 💰 **Banco de Horas**
- **Acúmulo automático**: Horas extras são automaticamente creditadas
- **Conversão flexível**: Transforme horas em dinheiro ou reserve para folgas
- **Controle de saldo**: Visualização clara do saldo disponível
- **Histórico completo**: Registro de todas as conversões realizadas

### 👥 **Multi-usuário**
- Suporte a múltiplos usuários com slugs únicos
- Dados isolados por usuário
- Interface de gerenciamento de usuários

## 🚀 Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Banco de dados**: PostgreSQL com Prisma ORM
- **Estilização**: Tailwind CSS 4
- **Deploy**: Docker + Coolify ready

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL (local ou remoto)

### 1. Clone o repositório
```bash
git clone <repository-url>
cd banco-de-horas
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite as variáveis de ambiente
DATABASE_URL="postgresql://username:password@localhost:5432/banco_de_horas"
NODE_ENV="development"
```

### 4. Configure o banco de dados
```bash
# Execute as migrações
npm run db:migrate

# Ou use push para desenvolvimento
npm run db:push
```

### 5. Execute o projeto
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── [userSlug]/        # Páginas dinâmicas por usuário
│   └── api/               # API Routes
├── components/            # Componentes React
│   ├── AccumulatedHoursSection.tsx
│   ├── HourConversionForm.tsx
│   ├── MonthlyGoalForm.tsx
│   ├── StatsDashboard.tsx
│   ├── TimeRecordForm.tsx
│   ├── TimeRecordsList.tsx
│   └── UsersManager.tsx
├── lib/                   # Utilitários e configurações
│   ├── calculations.ts    # Cálculos do servidor
│   ├── client-calculations.ts # Cálculos do cliente
│   ├── client-storage.ts  # Storage do cliente
│   ├── prisma.ts         # Configuração do Prisma
│   └── storage.ts        # Storage do servidor
└── types/                # Definições de tipos TypeScript
    └── index.ts
```

## 🐳 Deploy com Docker

### Build da imagem
```bash
npm run docker:build
```

### Executar container
```bash
npm run docker:run
```

### Usar com docker-compose
```bash
npm run docker:up
```

## ☁️ Deploy no Coolify

O projeto está configurado para deploy automático no Coolify:

1. **Configure o PostgreSQL** no Coolify
2. **Defina as variáveis de ambiente**:
   ```
   DATABASE_URL=postgresql://user:pass@host:port/db
   NODE_ENV=production
   ```
3. **Conecte o repositório** Git ao Coolify
4. **Deploy automático** usando o Dockerfile incluído

## 📜 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build para produção |
| `npm start` | Inicia servidor de produção |
| `npm run lint` | Executa linting |
| `npm run db:push` | Sincroniza schema com BD (dev) |
| `npm run db:migrate` | Executa migrações |
| `npm run db:migrate:deploy` | Migrações para produção |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run docker:build` | Build da imagem Docker |
| `npm run docker:run` | Executa container |

## 🗄️ Modelos de Dados

### User
- Gerenciamento de usuários com slug único
- Relacionamento com registros, metas e conversões

### TimeRecord
- Registros de tempo com tipo (trabalho/folga)
- Cálculo automático de horas totais
- Indexação por usuário e data

### MonthlyGoal
- Metas mensais de horas por usuário
- Formato YYYY-MM para identificação única

### HourConversion
- Conversões de horas para dinheiro ou folgas
- Histórico completo de transações
- Tipos: 'money' ou 'time_off'

## 📈 Algoritmos Principais

### Cálculo de Horas Extras
```typescript
// Soma horas trabalhadas - horas de folga por mês
// Se resultado > meta mensal = horas extras
// Acumula extras de todos os meses
// Subtrai horas já convertidas/utilizadas
```

### Sistema de Conversão
```typescript
// Validação: horas solicitadas <= saldo disponível
// Registro da conversão com timestamp
// Atualização automática do saldo
// Suporte a conversão parcial
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença privada. Todos os direitos reservados.

## 🆘 Suporte

Para suporte e dúvidas, abra uma issue no repositório ou entre em contato.

---

**Desenvolvido com ❤️ usando Next.js e TypeScript**
