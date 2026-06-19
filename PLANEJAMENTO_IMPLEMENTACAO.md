# Planejamento de Implementação — Sistema de Vila
> Stack: PocketBase (backend) + React Native / Expo (frontend)

---

## Schema Atual (relevante)

```
users          — auth: name, avatar, push_token
builds         — builds do usuário com rank_id, lineage_id, element_id
map_*          — pinos, rotas, grupos, respawns, stats (já implementados)
```

Tudo abaixo é **novo** e não existe no schema atual.

---

## Fase 0 — Foundation: Schema & Regras PocketBase

> Pré-requisito de todas as outras fases. Nenhuma feature funciona sem isso.

### 0.1 — Estender a collection `users`

Adicionar os campos:

| Campo | Tipo | Observação |
|---|---|---|
| `status` | select | `pending`, `approved`, `rejected` — padrão: `pending` |
| `role` | select | `ninja`, `manager`, `admin` — padrão: `ninja` |
| `ninja_rank` | text | `genin`, `chunin`, etc. (atribuído pelo admin) |
| `level` | number | Nível numérico do ninja (atribuído pelo admin) |
| `title_points` | number | Pontos acumulados para título — nunca decresce |
| `current_title` | relation → `titles` | Calculado e atualizado ao aprovar missão |
| `yen_balance` | number | Saldo em Yens |
| `approved_by` | relation → `users` | Admin que aprovou |
| `approved_at` | date | Data da aprovação |

**Roles disponíveis:**
- `ninja` — membro padrão da vila
- `manager` — gestor de organização (Capitão / Médico Chefe / Kage); o campo `organization` indica qual org ele gerencia
- `admin` — acesso total ao painel de gestão

O `role` é usado diretamente nas regras de acesso do PocketBase via `@request.auth.role`:
```
missions.createRule:              @request.auth.role = "admin"
organization_members.updateRule:  @request.auth.role = "admin" || @request.auth.role = "manager"
village_settings.updateRule:      @request.auth.role = "admin"
tax_records.listRule:             @request.auth.role = "admin" || @request.auth.role = "manager"
```

**Bloqueio de status no cliente (Electron/app):**

O `authRule` da collection `users` no PocketBase **não deve bloquear por `status`**, pois o site público usa a mesma collection e precisa permitir login para qualquer usuário. O controle de aprovação é feito inteiramente no lado do app após o login:

```js
// Após pb.collection('users').authWithPassword(...)
const user = pb.authStore.model
if (user.status !== 'approved') {
  pb.authStore.clear() // descarta o token localmente
  if (user.status === 'pending') navigate('AwaitingApproval')
  if (user.status === 'rejected') navigate('Rejected')
  return
}
// Redireciona por role
if (user.role === 'admin') navigate('AdminPanel')
else if (user.role === 'manager') navigate('ManagerPanel')
else navigate('NinjaHome')
```

### 0.2 — Novas collections

#### `village_settings` (1 único registro global)
| Campo | Tipo |
|---|---|
| `max_daily_missions` | number |
| `daily_points_per_ninja` | number |
| `points_cost` | json | `{"D":1,"C":3,"B":5,"A":10,"S":20}` |
| `min_rank_required` | json | `{"D":"","C":"genin","B":"chunin",...}` |
| `min_level_required` | json | `{"D":0,"C":5,"B":15,"A":30,"S":50}` |
| `min_donation_amount` | number |
| `donation_period` | select | `weekly`, `monthly` |
| `bank_balance` | number | Saldo do banco da vila |

#### `titles`
| Campo | Tipo |
|---|---|
| `name` | text (required) |
| `min_points` | number (required) |
| `description` | text |
| `order` | number | Para ordenação |

#### `missions`
| Campo | Tipo |
|---|---|
| `title` | text (required) |
| `description` | text |
| `rank` | select: `D`,`C`,`B`,`A`,`S` |
| `min_ninja_rank` | text | rank mínimo exigido |
| `min_level` | number | nível mínimo exigido |
| `status` | select: `available`,`in_progress`,`pending_review`,`completed` |
| `assigned_to` | relation → `users` (nullable) |
| `reward_yens` | number |
| `reward_items` | text | Descrição dos itens (texto livre) |
| `reward_points` | number | Pontos de título concedidos |
| `evidence` | file | Print enviado pelo ninja (opcional) |
| `admin_notes` | text | Feedback em caso de rejeição |
| `created_by` | relation → `users` |
| `reviewed_by` | relation → `users` |
| `assigned_at` | date |
| `submitted_at` | date |
| `completed_at` | date |

**Índices recomendados:**
```sql
CREATE INDEX idx_missions_status ON missions (status);
CREATE INDEX idx_missions_assigned_to ON missions (assigned_to);
CREATE INDEX idx_missions_rank ON missions (rank);
```

#### `organization_roles`
| Campo | Tipo |
|---|---|
| `organization` | select: `policia`,`hospital`,`assistente` |
| `role_name` | text |
| `yens_per_minute` | number |
| `is_manager` | bool |
| `order` | number |

#### `organization_members` (atualizado semanalmente pelo gestor)
| Campo | Tipo |
|---|---|
| `user` | relation → `users` |
| `organization` | select: `policia`,`hospital`,`assistente` |
| `role` | relation → `organization_roles` |
| `week_start` | date | Segunda-feira da semana |
| `registered_by` | relation → `users` |

**Índice:**
```sql
CREATE UNIQUE INDEX idx_org_members_user_week 
ON organization_members (user, organization, week_start);
```

#### `tax_records`
| Campo | Tipo |
|---|---|
| `user` | relation → `users` |
| `amount` | number |
| `period` | text | Ex: `"2026-W25"` (ano-semana) |
| `verified_by` | relation → `users` |

#### `donation_records`
| Campo | Tipo |
|---|---|
| `user` | relation → `users` |
| `amount` | number |
| `registered_by` | relation → `users` |
| `period` | text | Ex: `"2026-06"` (ano-mês) |

#### `bank_transactions`
| Campo | Tipo |
|---|---|
| `type` | select: `reward_payout`,`tax_income`,`donation_income` |
| `amount` | number |
| `user` | relation → `users` |
| `mission` | relation → `missions` (nullable) |
| `description` | text |

### 0.3 — Regras de acesso PocketBase

```
village_settings  — listRule/viewRule: @request.auth.id != ""
                  — updateRule: admin only (via superuser ou campo is_admin em users)

titles            — listRule: @request.auth.id != ""
                  — create/update/delete: admin only

missions          — listRule: status != "completed" && @request.auth.id != ""
                  — viewRule: @request.auth.id != ""
                  — create/update: admin only (exceto campo evidence/submitted_at pelo ninja)

organization_roles — listRule: @request.auth.id != ""
organization_members — listRule: @request.auth.id != ""
                     — create/update: gestor da organização

tax_records/donation_records — listRule: admin only ou owner
bank_transactions  — listRule: admin only
```

> **Nota sobre "admin":** Adicionar campo `is_admin` (bool) na collection `users` ou usar a collection `_superusers` do PocketBase para admins da vila.

---

## Fase 1 — Auth & Aprovação de Membros

**Objetivo:** Nenhum ninja acessa o sistema sem aprovação.

### Backend
- Configurar `authRule` na collection `users`: `status = "approved"`
- Hook `onRecordCreate` em `users`: setar `status = "pending"` automaticamente

### Frontend — Telas
- **Registro** — formulário normal; após criar conta, exibe tela "Aguardando aprovação"
- **Tela de espera** — exibida no login se `status = "pending"`; polling ou push notification quando aprovado
- **Tela de recusado** — exibida se `status = "rejected"` com mensagem opcional

### Frontend — Painel Admin
- **Lista de membros pendentes** — cards com nome, email, data de cadastro; botões Aprovar / Recusar
- **Lista de membros aprovados** — com filtros, busca, opção de revogar acesso
- Ao aprovar: setar `status = "approved"`, `approved_by`, `approved_at`

---

## Fase 2 — Configurações do Sistema (Admin)

**Objetivo:** Admin consegue configurar todas as regras antes de qualquer outra coisa.

### Frontend — Telas Admin
- **Configurações Gerais**
  - Quantidade máxima de missões diárias por ninja
  - Pool de pontos diários por ninja
  - Custo de pontos por rank (D/C/B/A/S)
  - Requisito mínimo de rank e nível por rank de missão
  - Valor mínimo de doação e período (semanal/mensal)

- **Gestão de Títulos**
  - CRUD de títulos (nome, pontos mínimos, descrição)
  - Ordenação automática por `min_points`

- **Gestão de Cargos por Organização**
  - CRUD de cargos para Polícia, Hospital e Assistentes
  - Campo `yens_per_minute` por cargo
  - Flag `is_manager` para marcar o gestor de cada org

---

## Fase 3 — Quadro de Missões (Leitura)

**Objetivo:** Todos os membros aprovados visualizam as missões disponíveis.

### Frontend — Telas
- **Quadro de Missões** — listagem pública de missões com status `available` e `in_progress`
  - Agrupado ou filtrado por rank (D, C, B, A, S)
  - Card de missão: título, rank, requisitos (rank mínimo + nível mínimo), ninja atribuído, status, recompensas
  - Missões `completed` aparecem apenas no histórico (aba separada)

### Lógica de filtragem
```
// Busca missões não concluídas
GET /api/collections/missions/records
  ?filter=(status != "completed")
  &sort=rank,status
  &expand=assigned_to
```

---

## Fase 4 — Gestão de Missões (Admin)

**Objetivo:** Admin cria, atribui e avalia missões.

### Frontend — Telas Admin
- **Criar Missão** — formulário: título, descrição, rank, requisitos, recompensas (yens + itens + pontos)
- **Atribuir Missão**
  - Lista de ninjas elegíveis filtrada por:
    - `ninja_rank` >= `min_ninja_rank` da missão
    - `level` >= `min_level` da missão
    - Ninja não bloqueado por inadimplência (sem impostos/doação pendentes)
    - Ninja dentro do limite de pontos diários
  - Ao atribuir: `status → in_progress`, `assigned_to`, `assigned_at`
- **Avaliar Missões Pendentes** (`status = "pending_review"`)
  - Ver detalhes + evidência (print)
  - **Aprovar:** `status → completed`, creditar yens + pontos + registrar bank_transaction + atualizar título
  - **Rejeitar:** `status → in_progress`, preencher `admin_notes`
- **Histórico de Missões** — missões com `status = "completed"`, somente leitura

### Lógica de verificação de elegibilidade de pontos
```
// Ao tentar atribuir missão de rank B (custo = 5 pts) para um ninja:
missoes_hoje = missions onde assigned_to = ninja_id 
               && assigned_at >= hoje_00:00
               && status != "available"

custo_hoje = soma de points_cost[rank] para cada missao_hoje
custo_desta = points_cost[rank_da_missao]
daily_limit = village_settings.daily_points_per_ninja

elegivel = (custo_hoje + custo_desta) <= daily_limit
```

### Hook PocketBase — ao aprovar missão
```javascript
// pb hook: onRecordUpdate missions — quando status muda para "completed"
// 1. Creditar yens ao ninja: user.yen_balance += mission.reward_yens
// 2. Creditar pontos: user.title_points += mission.reward_points
// 3. Recalcular título: buscar titulo com maior min_points <= user.title_points
// 4. Atualizar user.current_title
// 5. Descontar do banco: village_settings.bank_balance -= mission.reward_yens
// 6. Criar registro em bank_transactions
```

---

## Fase 5 — Minhas Missões (Ninja)

**Objetivo:** Ninja acompanha e conclui suas missões.

### Frontend — Telas
- **Aba "Minhas Missões"**
  - Seção **Ativas** (`assigned_to = me && status = "in_progress"`)
  - Seção **Concluídas** (`assigned_to = me && status = "completed"`)

- **Fluxo de Conclusão**
  - Botão "Concluir Missão" na missão ativa
  - Modal com: campo de upload de evidência (PNG/JPG/WEBP — opcional) + botão confirmar
  - Ao confirmar: `status → pending_review`, `submitted_at = now()`, salva `evidence`

---

## Fase 6 — Títulos & Carteirinha Ninja

**Objetivo:** Ninja tem um ID virtual com histórico e progresso.

### Backend
- Ao aprovar missão (hook já criado na Fase 4), atualizar `current_title` automaticamente
- Garantir que `title_points` nunca decresça

### Frontend — Telas
- **Carteirinha Ninja**
  - Header: avatar, nome, título atual
  - Contadores por rank: nº de missões D/C/B/A/S concluídas
  - Barra de progresso: `title_points` atuais / `min_points` do próximo título
    - Se título máximo: exibir "Título máximo atingido"
  - Histórico de missões aprovadas (ordem cronológica inversa):
    - Nome e rank, data, recompensas recebidas, admin avaliador

- **Visualização Pública** — versão da carteirinha sem dados sensíveis, acessível por outros membros

### Queries
```
// Contadores de missões por rank
GET /api/collections/missions/records
  ?filter=(assigned_to="USER_ID" && status="completed")
  // Agrupar por rank no frontend ou usar view no PB

// Próximo título
GET /api/collections/titles/records
  ?filter=(min_points > USER_TITLE_POINTS)
  &sort=min_points
  &perPage=1
```

---

## Fase 7 — Sistema Bancário & Impostos

**Objetivo:** Controle financeiro da vila e restrição de inadimplentes.

### Frontend — Telas Admin (aba Banco)
- **Visão Geral** — saldo atual, total de impostos e doações no período
- **Ninjas Adimplentes** — pagaram imposto E doação mínima no período
- **Ninjas Inadimplentes** — com indicação do tipo de pendência
- **Histórico de Transações** — bank_transactions ordenadas por data

### Frontend — Telas Gestor (Policia/Hospital/Assistentes)
- **Gestão de Membros da Organização**
  - Listar membros atuais da semana
  - Adicionar/remover membros
  - Atualizar cargo de cada membro
  - Restrito ao manager da organização (`organization_roles.is_manager = true`)

- **Registrar Imposto Pago** — gestor registra pagamento de imposto de um membro
- **Registrar Doação** — admin registra doação recebida

### Lógica de verificação de inadimplência (usada na Fase 4)
```javascript
// Verificar se ninja está bloqueado para missões
function isBlocked(userId, period) {
  // 1. Verificar se ninja é de organização obrigada (policia/hospital/assistente)
  const orgMember = getOrgMember(userId, currentWeek)
  
  if (orgMember) {
    // Verificar imposto pago no período
    const taxPaid = getTaxRecord(userId, period)
    if (!taxPaid) return { blocked: true, reason: "imposto_pendente" }
  }
  
  // 2. Verificar doação mínima (todos os membros)
  const donation = getDonation(userId, period)
  const minDonation = getSettings().min_donation_amount
  if (!donation || donation.amount < minDonation) {
    return { blocked: true, reason: "doacao_pendente" }
  }
  
  return { blocked: false }
}
```

---

## Fase 8 — Polimento & Notificações

**Objetivo:** Push notifications e UX final.

### Notificações (usando `push_token` já existente em `users`)
- Ninja aprovado pela gestão
- Missão atribuída ao ninja
- Missão rejeitada (com motivo)
- Missão aprovada + recompensas creditadas
- Título novo conquistado

### PocketBase Hooks para notificações
```javascript
// Hook existente no projeto (push_token já está em users)
// Reutilizar o mecanismo de notificação já implementado no app
```

### Outros polimentos
- Validação de unicidade: um ninja só pode ter 1 missão ativa por vez (opcional, configurável)
- Rate limit no upload de evidência
- Tela de perfil público do ninja (carteirinha pública)
- Filtros no quadro de missões (por rank, status, disponível para mim)

---

## Resumo de Collections Novas

| Collection | Depende de |
|---|---|
| `village_settings` | — |
| `titles` | — |
| `organization_roles` | — |
| `missions` | `users`, `village_settings` |
| `organization_members` | `users`, `organization_roles` |
| `tax_records` | `users`, `organization_members` |
| `donation_records` | `users` |
| `bank_transactions` | `users`, `missions` |

## Ordem de Implementação

```
Fase 0 (Schema)
  └── Fase 1 (Auth/Aprovação)
        └── Fase 2 (Configurações)
              ├── Fase 3 (Quadro - leitura)
              └── Fase 4 (Gestão de Missões)
                    ├── Fase 5 (Minhas Missões)
                    └── Fase 6 (Carteirinha)
                          └── Fase 7 (Banco & Impostos)
                                └── Fase 8 (Polimento)
```
