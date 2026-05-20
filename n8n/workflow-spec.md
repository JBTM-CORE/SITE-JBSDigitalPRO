# n8n + Odoo 17 CRM - Especificação de Fluxo

## 1) Entrada de dados (Webhook)
- Receber payload JSON com pelo menos:
  - `form_type`: `contato`, `orcamento`, `diagnostico_gratuito`
  - `source`: `site`, `landing_page`, `whatsapp_cta`, `diagnostico_gratuito`
  - campos específicos de cada formulário.

## 2) Classificação do lead no n8n
- Adicionar um node `Switch` por `form_type`.
- Regras:
  - `contato` -> pipeline "Inbound", estágio inicial "Novo contato"
  - `orcamento` -> pipeline "Vendas", estágio inicial "Qualificação"
  - `diagnostico_gratuito` -> pipeline "Consultivo", estágio inicial "Aguardando diagnóstico"

## 3) Mapeamento para Odoo 17 CRM
Criar lead via API do Odoo (`crm.lead`) com os campos:
- `name`: assunto automático (`[Contato] Nome`, `[Orçamento] Nome`, `[Diagnóstico] Nome`)
- `contact_name`: nome do lead
- `email_from`: e-mail
- `phone`: telefone (quando houver)
- `description`: resumo do formulário
- `x_form_type`: tipo do formulário (campo customizado)
- `source_id`: origem (`site`, `landing_page`, `whatsapp_cta`, `diagnostico_gratuito`)
- `stage_id`: estágio inicial conforme regra do item 2.

## 4) Governança mínima
- Validar `form_type` e `source`; se inválidos, enviar para fila de exceção.
- Registrar `created_at` e `received_at`.
- Evitar duplicidade por `email + phone + form_type` nas últimas 24h.
