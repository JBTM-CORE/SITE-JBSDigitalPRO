# Plano de migração: protótipo para WordPress (Bricks)

## 1) Referência visual inicial
Manter os arquivos de referência visual em `prototype/`:
- `index.html`
- `styles.css`
- `script.js`

## 2) Estrutura equivalente no WordPress com Bricks
- Tema base: Bricks + child theme para customizações.
- Estruturas sugeridas no Bricks:
  - Header global
  - Footer global
  - Template padrão de páginas
  - Template para posts (Blog)

## 3) Componentes reutilizáveis (Bricks)
Criar como **Section Templates** (ou Components):
1. Hero
2. Serviços
3. Processo
4. CTA
5. Contato
6. Rodapé

Padronização sugerida:
- Prefixo: `cmp-` (ex.: `cmp-hero`)
- Classes utilitárias globais em `wordpress/css/custom.css`
- Conteúdos dinâmicos via campos (ACF opcional)

## 4) Estrutura de páginas
Criar páginas no WordPress com os slugs:
- Home (`/`)
- Sobre (`/sobre`)
- Serviços (`/servicos`)
- Chatbots (`/chatbots`)
- IA (`/ia`)
- Marketing (`/marketing`)
- Webdesign (`/webdesign`)
- Cases (`/cases`)
- Blog (`/blog`)
- Contato (`/contato`)

## 5) Formulário Bricks -> webhook n8n
Opções:
1. **Nativa Bricks**: usar ação custom `Webhook` (quando disponível) com URL do n8n.
2. **Customizada (recomendada para controle)**:
   - Endpoint REST no WordPress (snippet em `wordpress/snippets/n8n-webhook-handler.php`).
   - Form Bricks envia para endpoint local.
   - Endpoint sanitiza e retransmite para o webhook n8n.

Variáveis necessárias (`wp-config.php`):
- `N8N_WEBHOOK_URL`
- `N8N_WEBHOOK_TOKEN` (opcional)

## 6) Versionamento do projeto
Versionar no repositório:
- `prototype/` (referência visual)
- `wordpress/css/custom.css`
- `wordpress/snippets/`
- documentação de arquitetura e checklists

Fluxo sugerido:
1. Branch por feature (`feat/bricks-components`, `feat/n8n-form`)
2. PR com checklist de QA visual
3. Tag de versão por marco de entrega
