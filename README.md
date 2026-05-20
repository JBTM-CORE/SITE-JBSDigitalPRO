# SITE-JBSDigitalPRO

## Formulário comercial (site → n8n → Odoo 17)

### O que foi preparado no frontend
- Formulário de contato comercial em `index.html` sem uso de `mailto:`.
- Campos: `nome`, `empresa`, `email`, `whatsapp`, `servico_interesse`, `mensagem`.
- Campos ocultos:
  - `lead_source=site_jbsdigitalpro`
  - `form_type=contato` (pode ser alterado para `orcamento` ou `diagnostico` conforme contexto da página).
- Envio via JavaScript (`script.js`) para webhook do n8n com payload JSON.
- Nenhuma credencial do Odoo no frontend.

### Fluxo recomendado no n8n (backend)
1. **Webhook (POST)**
   - Endpoint: `/webhook/jbsdigitalpro-leads`
   - Recebe payload JSON do formulário.

2. **Validação e normalização**
   - Garantir campos obrigatórios.
   - Padronizar telefone e e-mail.

3. **Node Odoo (ou HTTP Request para Odoo API)**
   - Operação: criar registro em `crm.lead`.
   - Mapear campos sugeridos:
     - `name`: `${nome} - ${empresa}`
     - `partner_name`: `empresa`
     - `contact_name`: `nome`
     - `email_from`: `email`
     - `phone` / `mobile`: `whatsapp`
     - `description`: `mensagem`
     - `source_id` ou campo customizado para `lead_source`
     - tag/campo para `form_type`

4. **Segurança de credenciais**
   - Armazenar URL, banco, usuário e senha/token do Odoo **somente** nas credenciais seguras do n8n.
   - Nunca expor segredos em `index.html` ou `script.js`.

5. **Resposta ao frontend**
   - Retornar HTTP 200/201 em sucesso e 4xx/5xx em erro para feedback adequado no site.
