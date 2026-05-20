export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return jsonResponse({ ok: true }, 204);
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Método não permitido.' }, 405);
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return jsonResponse({ error: 'Content-Type deve ser application/json.' }, 415);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ error: 'JSON inválido.' }, 400);
    }

    const validationErrors = validatePayload(payload);
    if (validationErrors.length > 0) {
      return jsonResponse({ error: 'Dados inválidos.', details: validationErrors }, 400);
    }

    // Honeypot: campo deve sempre permanecer vazio.
    if (typeof payload.website === 'string' && payload.website.trim() !== '') {
      return jsonResponse({ error: 'Requisição bloqueada.' }, 400);
    }

    // Time trap: bloqueia envio muito rápido (< 2s).
    if (!isAcceptableElapsedTime(payload.form_loaded_at)) {
      return jsonResponse({ error: 'Requisição suspeita.' }, 400);
    }

    const origin = request.headers.get('origin') || 'origem-desconhecida';
    const referer = request.headers.get('referer') || 'referer-desconhecido';
    const ip = request.headers.get('CF-Connecting-IP') || 'ip-desconhecido';
    const userAgent = request.headers.get('user-agent') || 'ua-desconhecido';

    try {
      const leadId = await createOdooLead(env, {
        name: payload.name,
        contact_name: payload.name,
        partner_name: payload.company || payload.name,
        email_from: payload.email,
        phone: payload.phone,
        description: [
          `Mensagem: ${payload.message}`,
          `Origem: ${payload.source || 'site-jbsdigitalpro'}`,
          `Origin header: ${origin}`,
          `Referer: ${referer}`,
          `IP: ${ip}`,
          `User-Agent: ${userAgent}`
        ].join('\n'),
        // Campo padrão no CRM do Odoo; útil para segmentação de origem.
        source_id: false,
      });

      return jsonResponse({ ok: true, lead_id: leadId }, 201);
    } catch (error) {
      console.error('Erro ao criar lead no Odoo', error);
      return jsonResponse({ error: 'Falha ao registrar lead.' }, 502);
    }
  },
};

function validatePayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return ['Payload deve ser um objeto JSON.'];
  }

  if (!isNonEmptyString(payload.name)) {
    errors.push('Campo obrigatório: name.');
  }

  if (!isValidEmail(payload.email)) {
    errors.push('Campo obrigatório/ inválido: email.');
  }

  if (!isNonEmptyString(payload.message)) {
    errors.push('Campo obrigatório: message.');
  }

  if (!isNonEmptyString(payload.phone)) {
    errors.push('Campo obrigatório: phone.');
  }

  return errors;
}

function isAcceptableElapsedTime(formLoadedAt) {
  const loadedAt = Number(formLoadedAt);
  if (!Number.isFinite(loadedAt)) return false;

  const elapsedMs = Date.now() - loadedAt;
  return elapsedMs >= 2000 && elapsedMs <= 1000 * 60 * 60;
}

async function createOdooLead(env, leadValues) {
  const commonPayload = {
    jsonrpc: '2.0',
    method: 'call',
    id: Date.now(),
    params: {
      service: 'common',
      method: 'login',
      args: [env.ODOO_DB, env.ODOO_LOGIN, env.ODOO_PASSWORD],
    },
  };

  const commonResponse = await fetch(`${env.ODOO_URL}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(commonPayload),
  });

  const commonData = await commonResponse.json();
  if (!commonResponse.ok || !commonData.result) {
    throw new Error('Falha na autenticação Odoo.');
  }

  const uid = commonData.result;

  const objectPayload = {
    jsonrpc: '2.0',
    method: 'call',
    id: Date.now() + 1,
    params: {
      service: 'object',
      method: 'execute_kw',
      args: [
        env.ODOO_DB,
        uid,
        env.ODOO_PASSWORD,
        'crm.lead',
        'create',
        [leadValues],
      ],
    },
  };

  const objectResponse = await fetch(`${env.ODOO_URL}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(objectPayload),
  });

  const objectData = await objectResponse.json();
  if (!objectResponse.ok || !objectData.result) {
    throw new Error('Falha ao criar crm.lead no Odoo.');
  }

  return objectData.result;
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(email) {
  if (!isNonEmptyString(email)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
