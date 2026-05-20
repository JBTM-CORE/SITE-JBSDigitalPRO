# Estrutura padrão de leads do Site no Odoo 17 CRM

Este documento define o padrão para criação de oportunidades (`crm.lead`) no Odoo 17 a partir dos formulários do site, via fluxo n8n.

## 1) Mapeamento dos campos recebidos no n8n

No primeiro nó do fluxo (Webhook/HTTP Trigger), normalizar o payload para as chaves abaixo:

| Campo no site | Chave normalizada (n8n) | Campo Odoo (`crm.lead`) | Observações |
|---|---|---|---|
| nome | `lead_name` | `contact_name` | Nome da pessoa de contato |
| empresa | `company_name` | `partner_name` | Nome da empresa (quando houver) |
| email | `email_from` | `email_from` | Validar formato de e-mail |
| telefone / whatsapp | `phone` | `phone` | Manter apenas dígitos + DDI/DDDs quando possível |
| mensagem | `description` | `description` | Salvar conteúdo completo do formulário |
| serviço de interesse | `service_interest` | `x_service_interest`* | Campo customizado recomendado |
| origem do formulário | `lead_source` | `source_id` | Mapear para origem “Site JBS DigitalPRO” |
| pontuação/intenção | `intent_score` | `priority` / etapa | Usado para roteamento no funil |

> 
> *Se não existir campo customizado `x_service_interest`, criar em `crm.lead` (tipo seleção ou texto) para facilitar segmentação e automações futuras.

## 2) Criação do lead no modelo `crm.lead`

No n8n, usar nó de integração com Odoo (`Create`) com:

- **Model**: `crm.lead`
- **Operation**: `create`
- **Payload**: campos normalizados e enriquecidos (origem, tags, prioridade, nome padronizado)

Campos mínimos obrigatórios para consistência:

- `name`
- `contact_name`
- `email_from`
- `phone`
- `description`
- `source_id` (origem)

## 3) Padrão do nome da oportunidade

Padrão obrigatório do campo `name`:

```text
Site - [Serviço] - [Nome/Empresa]
```

Regra de fallback para `[Nome/Empresa]`:

1. `company_name` (se preenchido)
2. `lead_name`
3. `email_from`

Exemplos:

- `Site - Web Design - Acme Ltda`
- `Site - Odoo - Mariana Silva`
- `Site - n8n - contato@empresa.com`

## 4) Preenchimento dos dados principais

No create do `crm.lead`, preencher:

- **Telefone**: `phone`
- **E-mail**: `email_from`
- **Empresa**: `partner_name`
- **Mensagem**: `description`
- **Serviço de interesse**: `x_service_interest` (ou equivalente)

Boas práticas:

- Remover espaços extras e caracteres inválidos.
- Fazer `trim` em todos os campos de texto.
- Registrar valores ausentes como vazio (`""`) e nunca com `null` quando o conector exigir string.

## 5) Origem fixa: `Site JBS DigitalPRO`

Garantir que todos os leads vindos do site tenham a origem:

- `source_id -> crm.lead.source(name="Site JBS DigitalPRO")`

Implementação recomendada no n8n:

1. Buscar em `crm.lead.source` pelo nome exato.
2. Se não existir, criar a origem.
3. Usar o `id` encontrado/criado no `source_id` do lead.

## 6) Tags padrão por serviço

Adicionar tags (`tag_ids`) de acordo com `service_interest`:

- `webdesign`
- `marketing`
- `ia`
- `chatbot`
- `odoo`
- `n8n`

Regras:

- Sempre converter para minúsculas antes de mapear.
- Se vier mais de um serviço, adicionar múltiplas tags.
- Se tag não existir em `crm.tag`, criar automaticamente e reutilizar o `id`.

Exemplo de mapeamento:

- `"Web Design"` → `webdesign`
- `"IA"` → `ia`
- `"Automação n8n"` → `n8n`

## 7) Encaminhamento de alta intenção para etapa prioritária

Definir regra de priorização no fluxo n8n antes da criação/atualização final:

### Critérios sugeridos de alta intenção

Considerar alta intenção quando **qualquer** condição for verdadeira:

- `intent_score >= 80`
- Mensagem contém termos de compra imediata (ex.: “urgente”, “proposta”, “fechar”, “implantação agora”).
- Serviço de interesse em `odoo` ou `n8n` **e** empresa informada.

### Ação no Odoo

- Definir `priority` como alta (ex.: `3`).
- Direcionar para etapa prioritária no funil (`stage_id` de “Prioritário/Alta intenção”).
- Opcional: atribuir automaticamente para vendedor/time específico.

## Exemplo de payload final para `crm.lead`

```json
{
  "name": "Site - Odoo - Acme Ltda",
  "contact_name": "Marina Souza",
  "partner_name": "Acme Ltda",
  "email_from": "marina@acme.com",
  "phone": "+55 11 99999-0000",
  "description": "Precisamos implantar Odoo comercial e financeiro em 30 dias.",
  "x_service_interest": "odoo",
  "source_id": 12,
  "tag_ids": [4, 9],
  "priority": "3",
  "stage_id": 7
}
```

## Checklist de validação do fluxo

- [ ] Todos os campos do formulário são mapeados e normalizados.
- [ ] `name` segue exatamente o padrão `Site - [Serviço] - [Nome/Empresa]`.
- [ ] Origem sempre definida como `Site JBS DigitalPRO`.
- [ ] Tags aplicadas conforme serviço(s) de interesse.
- [ ] Leads de alta intenção seguem para etapa prioritária.
- [ ] Erros de integração com Odoo geram log e tentativa de reprocessamento.
