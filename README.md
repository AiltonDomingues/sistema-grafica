# PrintFlow - Sistema de Gestão para Gráfica

Sistema completo de gestão para gráficas de personalização de camisas, com controle de pedidos, clientes, produtos, catálogo, arquivos e relatórios.

## 🚀 Tecnologias

- **Frontend**: TanStack Start (React + TypeScript)
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Storage + Auth)
- **Build**: Vite
- **Package Manager**: npm

## 📋 Funcionalidades

- ✅ Dashboard com visão geral
- ✅ Gestão de pedidos com múltiplos status
- ✅ Cadastro de clientes e times
- ✅ Catálogo de produtos com imagens
- ✅ Upload e gestão de arquivos por pedido
- ✅ Relatórios e análises
- ✅ Sistema de usuários e permissões
- ✅ Controle de acesso por perfil (Administrador, Atendente, Designer, Produção)

## 🔧 Deploy na Vercel

### 1. Acesse o Vercel

Vá para [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.

### 2. Importe o Repositório

1. Clique em **"Add New Project"**
2. Selecione o repositório **`sistema-grafica`**
3. Configure as seguintes opções:

**Framework Preset**: Vite

**Root Directory**: `frontend`

**Build Command**:
```bash
npm run build
```

**Output Directory**:
```bash
.output/public
```

**Install Command**:
```bash
npm install
```

### 3. Variáveis de Ambiente

Na seção "Environment Variables", adicione as seguintes variáveis:

#### Obrigatórias (Runtime):
```
VITE_SUPABASE_URL=https://bflpfkyhiieomvilwkjd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbHBma3loaWllb212aWx3a2pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDc1ODYsImV4cCI6MjA5NjA4MzU4Nn0.80eMNTi-g-WdMXqXRCbicf01P78Qe2Jfc0rxb8Dj-LI
```

#### Obrigatórias (Build Time):
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbHBma3loaWllb212aWx3a2pkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDUwNzU4NiwiZXhwIjoyMDk2MDgzNTg2fQ.zTkxil2dfQJW1KhRcFmVFzvAbNxQzjVxtEV_QZjVwQI
```

⚠️ **IMPORTANTE**: Marque `SUPABASE_SERVICE_ROLE_KEY` para todos os ambientes (Production, Preview, Development).

### 4. Deploy

Clique em **"Deploy"** e aguarde a conclusão do build.

## 🛠️ Desenvolvimento Local

### Instalação

```bash
cd frontend
npm install
```

### Configuração

Crie o arquivo `frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://bflpfkyhiieomvilwkjd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbHBma3loaWllb212aWx3a2pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDc1ODYsImV4cCI6MjA5NjA4MzU4Nn0.80eMNTi-g-WdMXqXRCbicf01P78Qe2Jfc0rxb8Dj-LI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbHBma3loaWllb212aWx3a2pkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDUwNzU4NiwiZXhwIjoyMDk2MDgzNTg2fQ.zTkxil2dfQJW1KhRcFmVFzvAbNxQzjVxtEV_QZjVwQI
```

### Executar

```bash
npm run dev
```

Acesse: `http://localhost:8080`

## 📊 Estrutura do Projeto

```
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── routes/         # Páginas (file-based routing)
│   │   ├── lib/
│   │   │   ├── api/       # Funções de API
│   │   │   └── supabase.ts
│   │   └── styles.css
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   └── tables schema supabase.md  # Schema do banco
└── README.md
```

## 🔐 Supabase Setup

O projeto usa Supabase para:
- **Auth**: Autenticação de usuários
- **Database**: PostgreSQL com RLS
- **Storage**: Dois buckets:
  - `order-files` (privado) - arquivos de pedidos
  - `product-images` (público) - imagens de produtos

## 👥 Perfis de Acesso

- **Administrador**: Acesso total
- **Atendente**: Pedidos, clientes, catálogo
- **Designer**: Pedidos, catálogo, arquivos
- **Produção**: Pedidos, catálogo, arquivos

## 📝 Licença

Proprietário

---

Desenvolvido para gestão completa de gráficas de personalização.
