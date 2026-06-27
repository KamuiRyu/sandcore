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

| Campo           | Tipo                | Observação                                            |
| --------------- | ------------------- | ----------------------------------------------------- |
| `status`        | select              | `pending`, `approved`, `rejected` — padrão: `pending` |
| `role`          | select              | `ninja`, `manager`, `admin` — padrão: `ninja`         |
| `ninja_rank`    | text                | `genin`, `chunin`, etc. (atribuído pelo admin)        |
| `level`         | number              | Nível numérico do ninja (atribuído pelo admin)        |
| `title_points`  | number              | Pontos acumulados para título — nunca decresce        |
| `current_title` | relation → `titles` | Calculado e atualizado ao aprovar missão              |
| `approved_by`   | relation → `users`  | Admin que aprovou                                     |
| `approved_at`   | date                | Data da aprovação                                     |
| `organization`  | select (nullable)   | `policia`, `hospital`, `assistente` — preenchido só quando `role = "manager"` |

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
const user = pb.authStore.model;
if (user.status !== "approved") {
  pb.authStore.clear(); // descarta o token localmente
  if (user.status === "pending") navigate("AwaitingApproval");
  if (user.status === "rejected") navigate("Rejected");
  return;
}
// Redireciona por role
if (user.role === "admin") navigate("AdminPanel");
else if (user.role === "manager") navigate("ManagerPanel");
else navigate("NinjaHome");
```

### 0.2 — Novas collections

#### `village_settings` (1 único registro global)

| Campo                    | Tipo   |
| ------------------------ | ------ | --------------------------------------- |
| `max_daily_missions`     | number |
| `daily_points_per_ninja` | number |
| `points_cost`            | json   | `{"D":1,"C":3,"B":5,"A":10,"S":20}`     |
| `min_rank_required`      | json   | `{"D":"","C":"genin","B":"chunin",...}` |
| `min_level_required`     | json   | `{"D":0,"C":5,"B":15,"A":30,"S":50}`    |
| `min_donation_amount`    | number |
| `donation_period`        | select | `weekly`, `monthly`                     |
| `bank_balance`           | number | Saldo do banco da vila                  |

#### `titles`

| Campo         | Tipo              |
| ------------- | ----------------- | -------------- |
| `name`        | text (required)   |
| `min_points`  | number (required) |
| `description` | text              |
| `order`       | number            | Para ordenação |

#### `mission_templates` (criadas e gerenciadas pelos admins)

Missões são **templates permanentes**. Uma vez criada, a missão entra no pool e pode ser atribuída diariamente a ninjas. O admin não precisa recriar a missão a cada dia.

| Campo            | Tipo                         | Observação                        |
| ---------------- | ---------------------------- | --------------------------------- |
| `title`          | text (required)              |                                   |
| `description`    | text                         |                                   |
| `rank`           | select: `D`,`C`,`B`,`A`,`S` |                                   |
| `min_ninja_rank` | text                         | rank mínimo exigido               |
| `min_level`      | number                       | nível mínimo exigido              |
| `reward_yens`    | number                       |                                   |
| `reward_items`   | text                         | Descrição dos itens (texto livre) |
| `reward_points`  | number                       | Pontos de título concedidos       |
| `is_active`      | bool                         | Padrão: `true`; false = arquivada |
| `created_by`     | relation → `users`           |                                   |

**Índices recomendados:**

```sql
CREATE INDEX idx_mission_templates_rank ON mission_templates (rank);
CREATE INDEX idx_mission_templates_active ON mission_templates (is_active);
```

#### `mission_assignments` (instâncias diárias atribuídas a ninjas)

Quando o admin atribui uma missão do pool a um ninja, cria-se um registro em `mission_assignments`. Isso permite que a mesma `mission_template` seja atribuída a vários ninjas em dias diferentes.

| Campo         | Tipo                                                    | Observação                          |
| ------------- | ------------------------------------------------------- | ----------------------------------- |
| `template`    | relation → `mission_templates` (required)               | Qual missão foi atribuída           |
| `assigned_to` | relation → `users` (required)                           | Ninja que recebeu                   |
| `status`      | select: `in_progress`,`pending_review`,`completed`      |                                     |
| `evidence`    | file                                                    | Print enviado pelo ninja (opcional) |
| `admin_notes` | text                                                    | Feedback em caso de rejeição        |
| `reviewed_by` | relation → `users`                                      |                                     |
| `day`         | date                                                    | Data da atribuição (YYYY-MM-DD)     |
| `assigned_at` | date                                                    |                                     |
| `submitted_at`| date                                                    |                                     |
| `completed_at`| date                                                    |                                     |

**Índices recomendados:**

```sql
CREATE INDEX idx_assignments_assigned_to ON mission_assignments (assigned_to);
CREATE INDEX idx_assignments_status ON mission_assignments (status);
CREATE INDEX idx_assignments_day ON mission_assignments (day);
```

#### `organization_roles`

| Campo             | Tipo                                      |
| ----------------- | ----------------------------------------- |
| `organization`    | select: `policia`,`hospital`,`assistente` |
| `role_name`       | text                                      |
| `yens_per_minute` | number                                    |
| `is_manager`      | bool                                      |
| `order`           | number                                    |

#### `organization_members` (atualizado semanalmente pelo gestor)

| Campo           | Tipo                                      |
| --------------- | ----------------------------------------- | ----------------------- |
| `user`          | relation → `users`                        |
| `organization`  | select: `policia`,`hospital`,`assistente` |
| `role`          | relation → `organization_roles`           |
| `week_start`    | date                                      | Segunda-feira da semana |
| `registered_by` | relation → `users`                        |

**Índice:**

```sql
CREATE UNIQUE INDEX idx_org_members_user_week
ON organization_members (user, organization, week_start);
```

#### `tax_records`

| Campo         | Tipo               |
| ------------- | ------------------ | ----------------------------- |
| `user`        | relation → `users` |
| `amount`      | number             |
| `period`      | text               | Ex: `"2026-W25"` (ano-semana) |
| `verified_by` | relation → `users` |

#### `donation_records`

| Campo           | Tipo               |
| --------------- | ------------------ | ------------------------- |
| `user`          | relation → `users` |
| `amount`        | number             |
| `registered_by` | relation → `users` |
| `period`        | text               | Ex: `"2026-06"` (ano-mês) |

#### `bank_transactions`

| Campo         | Tipo                                                   |
| ------------- | ------------------------------------------------------ |
| `type`               | select: `reward_payout`,`tax_income`,`donation_income` |
| `amount`             | number                                                 |
| `user`               | relation → `users`                                     |
| `mission_assignment` | relation → `mission_assignments` (nullable)            |
| `description`        | text                                                   |

### 0.3 — Regras de acesso PocketBase

```
village_settings  — listRule/viewRule: @request.auth.id != ""
                  — updateRule: admin only (via superuser ou campo is_admin em users)

titles            — listRule: @request.auth.id != ""
                  — create/update/delete: admin only

mission_templates — listRule: @request.auth.id != ""
                  — viewRule: @request.auth.id != ""
                  — create/update/delete: @request.auth.role = "admin"

mission_assignments — listRule: @request.auth.id != ""
                    — viewRule: @request.auth.id != ""
                    — createRule: @request.auth.role = "admin"
                    — updateRule: @request.auth.role = "admin" || assigned_to = @request.auth.id
                      (ninja só pode atualizar evidence/status para pending_review)

organization_roles — listRule: @request.auth.id != ""
organization_members — listRule: @request.auth.id != ""
                     — create/update: @request.auth.role = "admin" || (@request.auth.role = "manager" && @request.auth.organization = organization)

tax_records/donation_records — listRule: admin only ou owner
bank_transactions  — listRule: admin only
```

> **Nota sobre "admin":** O campo `role` na collection `users` (ver Fase 0.1) é usado nas regras via `@request.auth.role`. Não é necessário campo `is_admin` separado.

---

## Fase 1 — Auth & Aprovação de Membros

**Objetivo:** Nenhum ninja acessa o sistema sem aprovação.

### Backend

- **Não** usar `authRule` da collection `users` para bloquear por status (o site público usa a mesma collection)
- Hook `onRecordCreate` em `users`: setar `status = "pending"` automaticamente
- Bloqueio de status feito no cliente após login (ver Fase 0.1)

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

- **Quadro de Missões** — lista todos os `mission_templates` ativos (`is_active = true`)
  - Agrupado ou filtrado por rank (D, C, B, A, S)
  - Card de missão: título, rank, requisitos (rank mínimo + nível mínimo), recompensas
  - Badge "Atribuída hoje" se já existe um `mission_assignment` para o dia atual com aquele template
  - Missões arquivadas (`is_active = false`) aparecem apenas no painel admin

### Lógica de filtragem

```
// Busca templates ativos
GET /api/collections/mission_templates/records
  ?filter=(is_active=true)
  &sort=rank

// Para saber quais foram atribuídas hoje:
GET /api/collections/mission_assignments/records
  ?filter=(day="2026-06-20")
  &expand=template,assigned_to
```

---

## Fase 4 — Gestão de Missões (Admin)

**Objetivo:** Admin cria, atribui e avalia missões.

### Frontend — Telas Admin

- **Pool de Missões (Templates)**
  - CRUD de `mission_templates`: criar, editar, arquivar (`is_active = false`)
  - Formulário: título, descrição, rank, requisitos (rank mínimo + nível mínimo), recompensas (yens + itens + pontos)
  - Templates são **permanentes** — não precisam ser recriados a cada dia

- **Atribuir Missão do Pool**
  - Admin escolhe um template do pool e seleciona um ninja elegível
  - Filtros de elegibilidade:
    - `user.ninja_rank` >= `template.min_ninja_rank`
    - `user.level` >= `template.min_level`
    - Ninja não bloqueado por inadimplência
    - Ninja dentro do limite de pontos diários (ver lógica abaixo)
  - Ao atribuir: criar registro em `mission_assignments` com `status = "in_progress"`, `day = hoje`, `assigned_at = now()`

- **Avaliar Missões Pendentes** (assignments com `status = "pending_review"`)
  - Ver detalhes do template + evidência enviada pelo ninja
  - **Aprovar:** `status → completed`, creditar yens + pontos + registrar `bank_transaction` + atualizar título
  - **Rejeitar:** `status → in_progress`, preencher `admin_notes`

- **Histórico de Missões** — assignments com `status = "completed"`, somente leitura

### Lógica de verificação de elegibilidade de pontos

```javascript
// Ao tentar atribuir template de rank B (custo = 5 pts) para um ninja:
const assignments_hoje = await pb.collection('mission_assignments').getFullList({
  filter: `assigned_to="${ninja_id}" && day="${hoje}"`,
  expand: 'template'
});

const custo_hoje = assignments_hoje.reduce((sum, a) => {
  return sum + settings.points_cost[a.expand.template.rank];
}, 0);

const custo_desta = settings.points_cost[template.rank];
const daily_limit = settings.daily_points_per_ninja;

const elegivel = (custo_hoje + custo_desta) <= daily_limit;
```

### Hook PocketBase — ao aprovar assignment

```javascript
// pb hook: onRecordUpdate mission_assignments — quando status muda para "completed"
// 1. Buscar template relacionado para obter reward_yens, reward_points
// 2. Creditar pontos: user.title_points += template.reward_points
// 3. Recalcular título: buscar título com maior min_points <= user.title_points
// 4. Atualizar user.current_title
// 5. Descontar do banco: village_settings.bank_balance -= template.reward_yens
// 6. Criar registro em bank_transactions (mission_assignment = assignment.id)
```

---

## Fase 5 — Minhas Missões (Ninja)

**Objetivo:** Ninja acompanha e conclui suas missões.

### Frontend — Telas

- **Aba "Minhas Missões"**
  - Seção **Ativas** (assignments com `assigned_to = me && status = "in_progress"`)
  - Seção **Em Avaliação** (assignments com `status = "pending_review"`)
  - Seção **Concluídas** (assignments com `status = "completed"`)
  - Cada card exibe os dados do template via `expand=template`

- **Fluxo de Conclusão**
  - Botão "Concluir Missão" no assignment ativo
  - Modal com: campo de upload de evidência (PNG/JPG/WEBP — opcional) + botão confirmar
  - Ao confirmar: `status → pending_review`, `submitted_at = now()`, salva `evidence`

### Query

```
GET /api/collections/mission_assignments/records
  ?filter=(assigned_to="ME")
  &expand=template,reviewed_by
  &sort=-assigned_at
```

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
// Assignments concluídos do ninja (com dados do template para rank e recompensas)
GET /api/collections/mission_assignments/records
  ?filter=(assigned_to="USER_ID" && status="completed")
  &expand=template,reviewed_by
  &sort=-completed_at
  // Agrupar por template.rank no frontend para os contadores

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
  const orgMember = getOrgMember(userId, currentWeek);

  if (orgMember) {
    // Verificar imposto pago no período
    const taxPaid = getTaxRecord(userId, period);
    if (!taxPaid) return { blocked: true, reason: "imposto_pendente" };
  }

  // 2. Verificar doação mínima (todos os membros)
  const donation = getDonation(userId, period);
  const minDonation = getSettings().min_donation_amount;
  if (!donation || donation.amount < minDonation) {
    return { blocked: true, reason: "doacao_pendente" };
  }

  return { blocked: false };
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

| Collection             | Depende de                                    |
| ---------------------- | --------------------------------------------- |
| `village_settings`     | —                                             |
| `titles`               | —                                             |
| `organization_roles`   | —                                             |
| `mission_templates`    | `users` (created_by)                          |
| `mission_assignments`  | `users`, `mission_templates`                  |
| `organization_members` | `users`, `organization_roles`                 |
| `tax_records`          | `users`, `organization_members`               |
| `donation_records`     | `users`                                       |
| `bank_transactions`    | `users`, `mission_assignments`                |

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
