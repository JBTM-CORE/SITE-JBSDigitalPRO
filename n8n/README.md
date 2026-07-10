# n8n — Integração Site -> Odoo CRM

Workflow pronto para importar no n8n:

- Arquivo: `n8n/workflows/site-to-odoo-crm.json`
- Endpoint webhook (POST): `/site/jbsdigitalpro/leads`

## O que o fluxo faz

1. Recebe lead via Webhook.
2. Valida campos obrigatórios: `nome`, `whatsapp`, `email`, `servico`.
3. Normaliza telefone, e-mail e mensagem.
4. Autentica no Odoo 17 (JSON-RPC).
5. Busca contato por e-mail e cria/atualiza `res.partner`.
6. Cria oportunidade em `crm.lead`.
7. Define origem como `Site JBS DigitalPRO` (campo `x_origem_texto`, ajuste para seu campo de origem).
8. Aplica tags por serviço (`webdesign`, `marketing`, `ia`, `chatbot`, `odoo`, `n8n`) se existirem no Odoo.
9. Envia notificação interna via webhook.
10. Retorna sucesso para o site.

## Variáveis de ambiente esperadas no n8n

- `ODOO_BASE_URL` (ex.: `https://seu-odoo.com`)
- `ODOO_DB`
- `ODOO_USERNAME`
- `ODOO_PASSWORD`
- `INTERNAL_NOTIFY_WEBHOOK`

## Payload esperado do site

```json
{
  "nome": "Nome do Lead",
  "whatsapp": "(11) 99999-9999",
  "email": "lead@exemplo.com",
  "servico": "webdesign",
  "mensagem": "Quero orçamento"
}
```

## Observações

- Se você usar o modelo padrão do Odoo para origem (campo relacional `source_id`), substitua a lógica atual por busca/criação em `utm.source` e atribua o `id` em `crm.lead.source_id`.
- Garanta que as tags de CRM existam com os nomes exatos para aplicação automática.
