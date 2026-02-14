# ⏰ Banco de Horas

Sistema de controle e gestão de banco de horas com autenticação Google.

## 🚀 Funcionalidades

### Para Colaboradores
- Autenticação via Google
- Dashboard com estatísticas em tempo real
- Registro de horas trabalhadas e folgas
- Metas mensais personalizadas
- Conversão de horas extras em dinheiro ou folgas
- Histórico completo de registros

### Para Administradores
- Gerenciamento de usuários
- Visualização de dashboards de qualquer usuário
- Controle de permissões (admin/colaborador)

## 🛠️ Tecnologias

- Next.js 16.1.6 (App Router)
- TypeScript
- Firebase (Authentication + Firestore)
- Tailwind CSS
- Bun

## 🔧 Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd banco-de-horas

# Instale as dependências
bun install

# Configure as variáveis de ambiente
# Crie um arquivo .env.local com suas credenciais Firebase

# Execute o projeto
bun run dev
```

Acesse http://localhost:3000

## 💡 Como Usar

### Colaborador
1. Faça login com sua conta Google
2. Configure sua meta mensal de horas
3. Registre suas horas trabalhadas diariamente
4. Acompanhe seu progresso no dashboard
5. Converta horas extras quando necessário

### Administrador
1. Acesse "Gerenciar Usuários"
2. Adicione emails autorizados
3. Promova usuários a admin quando necessário
4. Visualize dashboards de qualquer usuário

## 🔐 Autenticação

- Primeiro usuário automaticamente vira admin
- Próximos usuários precisam ter email pré-autorizado
- Sistema de roles: admin e colaborador

---

Desenvolvido com ❤️ usando Claude Code
