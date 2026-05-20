# Integração n8n Webhook + Odoo 17 (crm.lead)

## 1) Webhook público no n8n
- Node: **Webhook**
- Método: `POST`
- Path sugerido: `jbs-digitalpro-contato`
- Response Mode: `Respond to Webhook`

## 2) Validação dos campos
Use um node **Code** (ou **IF** + expressões) para validar:
- `nome` (mínimo 2 caracteres)
- `email` (formato válido)
- `whatsapp` (não vazio)
- `empresa` (não vazio)
- `servicoInteresse` (não vazio)
- `mensagem` (mínimo 10 caracteres)

Exemplo de validação (Code Node):
```javascript
const body = $json;
const errors = [];

if (!body.nome || body.nome.trim().length < 2) errors.push('Nome inválido');
if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push('E-mail inválido');
if (!body.whatsapp || !body.whatsapp.trim()) errors.push('WhatsApp obrigatório');
if (!body.empresa || !body.empresa.trim()) errors.push('Empresa obrigatória');
if (!body.servicoInteresse || !body.servicoInteresse.trim()) errors.push('Serviço de interesse obrigatório');
if (!body.mensagem || body.mensagem.trim().length < 10) errors.push('Mensagem muito curta');

return [{ json: { ...body, errors, valido: errors.length === 0 } }];
```

## 3) Integração com Odoo 17
Opções:
- **Credencial Odoo no n8n** (preferencial, se disponível no ambiente).
- **HTTP Request** com endpoint JSON-RPC.
- **XML-RPC** via HTTP Request, se necessário.

> Nunca enviar usuário/senha/token do Odoo para o frontend. As credenciais ficam somente no n8n.

## 4) Criação de lead em `crm.lead`
Mapeamento recomendado:
- `name`: `{{ $json.nome }} - {{ $json.empresa }}`
- `contact_name`: `{{ $json.nome }}`
- `email_from`: `{{ $json.email }}`
- `phone` ou `mobile`: `{{ $json.whatsapp }}`
- `partner_name`: `{{ $json.empresa }}`
- `description`: incluir mensagem e metadados
- `source_id` (ou equivalente): **Site JBS DigitalPRO**

Para origem/página/serviço:
- Guardar em `description` (fallback universal), ou
- Criar campos customizados no Odoo (ex.: `x_origem`, `x_pagina_acessada`, `x_servico_interesse`).

## 5) Resposta para frontend
No node **Respond to Webhook**:
- Sucesso (HTTP 200):
```json
{ "sucesso": true, "mensagem": "Recebemos seus dados com sucesso." }
```
- Erro de validação (HTTP 400):
```json
{ "sucesso": false, "mensagem": "Dados inválidos.", "erros": ["..."] }
```
- Erro interno/Odoo (HTTP 500):
```json
{ "sucesso": false, "mensagem": "Erro ao registrar lead." }
```
