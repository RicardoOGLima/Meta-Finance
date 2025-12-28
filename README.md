# 💰 Meta Finance App

O **Meta Finance** é o seu centro de controle financeiro definitivo, unindo o poder da web com a robustez e segurança de uma experiência desktop completa. Gerencie seus ativos, investimentos e orçamentos em um só lugar, com sincronização via Google Drive.

<p align="center">
  <img src="public/logo.png" width="150" alt="Meta Finance Logo">
</p>

## ✨ Funcionalidades Principais

- **📊 Dashboard Inteligente**: Visualize sua saúde financeira, patrimônio e fluxos de caixa em tempo real.
- **🚀 Gestão de Ativos**: Acompanhe seus investimentos, rendimentos e valorização de portfólio.
- **🎯 Metas de Economia**: Defina objetivos claros e acompanhe seu progresso para a liberdade financeira.
- **📁 Sincronização em Nuvem (Desktop)**: Seus dados ficam no **seu** Google Drive. Privacidade total e acesso em qualquer lugar.
- **📥 Download Versão Desktop**: Use o app nativo no Windows para uma experiência mais rápida e integrada.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React + Vite + Tailwind CSS
- **Desktop**: Tauri (v2)
- **Banco de Dados**: Supabase (Autenticação)
- **Persistência**: LocalStorage (Web) & File System com Escopo Persistente (Desktop)

## 🖥️ Começando (Versão Web)

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado.

### Instalação
1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure o `.env.local` com suas chaves do Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url
   VITE_SUPABASE_ANON_KEY=sua_chave_anon
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 📦 Build Desktop

Para gerar o instalador nativo no Windows:
1. Siga as instruções detalhadas no nosso arquivo privado `MAINTENANCE_GUIDE.md`.
2. O comando principal será:
   ```powershell
   npm run tauri build
   ```

---

## 👨‍💻 Contribuição e Créditos
Desenvolvido com carinho para o controle financeiro pessoal.

**Meta Finance App - Deixe seu dinheiro trabalhar para você.**
