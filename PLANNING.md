# Planejamento: SLP Map Overlay (Electron)

Este documento detalha o plano de ação passo a passo para a construção do aplicativo desktop autônomo (Overlay/HUD) do mapa interativo para o jogo Shinobi Legends, utilizando Electron, React, e Vite. A regra de negócio será importada do código web antigo.

## Fase 1: Setup Base (Vite + React + Electron) [CONCLUÍDO]
*Objetivo: Ter um "Hello World" rodando com a integração perfeita entre o Vite (Frontend) e o Electron (Backend do App).*

- [x] **Limpeza e Inicialização:** Inicializar um novo projeto Vite + React + TypeScript na raiz de `slp-map` (mantendo a pasta `old/` intocada como fonte de consulta).
- [x] **Dependências do Electron:** Instalar `electron`, `vite-plugin-electron`, `vite-plugin-electron-renderer` e ferramentas de build (`electron-builder`).
- [x] **Configuração do Vite:** Ajustar o `vite.config.ts` para compilar o código do Electron junto com o React.
- [x] **Arquivos do Electron:** Criar a estrutura básica do Electron:
  - `electron/main.ts` (O processo principal que controla a janela).
  - `electron/preload.ts` (A ponte de segurança entre o Node.js e o React).

## Fase 2: Configuração da Janela Overlay e Atalhos Globais [EM PROGRESSO]
*Objetivo: Configurar as capacidades nativas de desktop (janela sempre visível, fundo transparente e atalhos de teclado).*

- [x] **Sistema de Configuração:** Implementado sistema de persistência de configurações (JSON) no processo principal.
- [x] **Janela Always-on-Top:** No `main.ts`, configurar o `BrowserWindow` com:
  - `alwaysOnTop: true` (Carregado das configurações).
  - `frame: false` (Sem a barra de título padrão do SO).
  - `transparent: true` (Fundo transparente para atuar como HUD sobre o jogo).
- [x] **Login Obrigatório:** Implementado gate de autenticação via PocketBase antes de acessar o app.
- [ ] **Global Shortcuts:** Registrar atalhos no teclado (ex: `Ctrl+Shift+M` ou F2) usando o módulo `globalShortcut` do Electron.
- [ ] **Comunicação (IPC):** Configurar o `preload.ts` para enviar eventos desses atalhos para o React (ex: `window.ipcRenderer.on('shortcut-pressed')`).
- [x] **Área de Arrastar (Drag Region):** Adicionado CSS no React (`-webkit-app-region: drag`) para permitir que o usuário arraste a janela pelo mapa.

## Fase 3: Migração das Regras de Negócio (Clean Architecture)
*Objetivo: Reaproveitar o código web existente (regras de negócio e conexão com PocketBase) mantendo os princípios de Clean Architecture. Todos os arquivos legados estão atualmente na pasta `old/`.*

- [ ] **Cópia do Core:** Copiar as pastas `core`, `infrastructure`, e `dependencies` do módulo de map (`slp-map/old/src/modules/map/`) para a nova estrutura raiz.
- [ ] **Dependências do Projeto:** Instalar os pacotes necessários que já eram usados no web (ex: `pocketbase`, `lucide-react`, `tailwindcss`, libs de mapa, etc).
- [ ] **Serviços Compartilhados:** Copiar utilitários essenciais (ex: `lib/pocketbase.ts` e arquivos de ambiente).
- [ ] **Validação:** Testar os hooks migrados isoladamente para garantir que o PocketBase e a lógica de negócios estão funcionando corretamente no ambiente Electron.
- [ ] **Limpeza Pós-Migração:** Após a validação de que todas as regras de negócio e dependências foram migradas e estão operando corretamente, deletar completamente a pasta `old/` para limpar o repositório.

## Fase 4: Nova Interface Visual (HUD)
*Objetivo: Construir a nova UI em React, otimizada especificamente para atuar como um overlay desktop.*

- [ ] **Design do Overlay:** Desenvolver o componente base do mapa para ocupar a tela transparente sem bordas.
- [ ] **Integração com Hooks:** Conectar os hooks migrados (da Fase 3) nos novos componentes visuais.
- [ ] **Listeners de Atalhos:** Criar um `useEffect` no React que escuta os atalhos enviados pelo Electron (Fase 2) e dispara as ações correspondentes (ex: abrir menu de adicionar pino).
- [ ] **Interatividade Diferenciada:** Adaptar cliques, scrolls e hovers para proporcionar uma boa experiência de uso enquanto o jogo roda em segundo plano.

## Fase 5: Build, Otimização e Distribuição
*Objetivo: Garantir que o aplicativo seja otimizado (baixo consumo) e possa ser empacotado para instalação pelo usuário final.*

- [ ] **Otimização de RAM:** Revisar processos em background e otimizar flags do Chromium no Electron para reduzir o uso de memória.
- [ ] **Ícones e Metadados:** Configurar ícones oficiais para a barra de tarefas e bandeja do sistema (system tray).
- [ ] **Configuração de Build:** Configurar o `electron-builder` no `package.json` para gerar os instaladores (Windows `.exe`, Linux `.AppImage`/`.deb`, etc).
- [ ] **Teste de Produção:** Gerar o executável e testar o app rodando de forma estritamente independente.
