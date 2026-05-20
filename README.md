# SITE-JBSDigitalPRO

## Camada intermediária segura para envio de leads ao Odoo

Foi implementada a **opção 4 (Cloudflare Worker)** para impedir a exposição de credenciais do Odoo no frontend.

### O que este gateway resolve

- Valida campos obrigatórios (`name`, `email`, `phone`, `message`);
- Bloqueia spam básico (honeypot + time trap);
- Registra origem do lead (origin, referer, IP e user-agent);
- Cria registro em `crm.lead` no Odoo via JSON-RPC;
- Mantém senha/token do Odoo somente no ambiente do Worker (nunca no HTML/JS público).

## Arquivos adicionados

- `cloudflare-worker.js`: endpoint intermediário e integração com Odoo.
- `wrangler.toml`: configuração de deploy Cloudflare Worker.

## Variáveis secretas (NUNCA no frontend)

Configure no Cloudflare (Wrangler):

```bash
wrangler secret put ODOO_URL
wrangler secret put ODOO_DB
wrangler secret put ODOO_LOGIN
wrangler secret put ODOO_PASSWORD
```

## Exemplo de chamada do frontend

```js
await fetch('https://SEU-WORKER.workers.dev', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Maria Souza',
    email: 'maria@email.com',
    phone: '+55 11 99999-9999',
    message: 'Quero uma proposta.',
    source: 'landing-page-janeiro',
    website: '', // honeypot (deve ficar vazio)
    form_loaded_at: Date.now() - 3500,
  }),
});
```

## Publicação

```bash
wrangler deploy
```

## Observações

- O endpoint aceita apenas `POST` com `application/json`.
- A autenticação no Odoo é feita no backend do Worker, sem expor credenciais.
- Recomenda-se também ativar Cloudflare Turnstile para anti-spam avançado.
