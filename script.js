(function () {
  const form = document.getElementById('lead-form');
  if (!form) return;

  const feedback = document.getElementById('form-feedback');
  const sourcePageInput = document.getElementById('source_page');

  if (sourcePageInput) {
    sourcePageInput.value = window.location.pathname || '/';
  }

  const requiredFields = [
    { id: 'name', label: 'Nome completo' },
    { id: 'email', label: 'E-mail corporativo' },
    { id: 'company', label: 'Empresa' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'service_interest', label: 'Serviço de interesse' },
    { id: 'estimated_budget', label: 'Orçamento aproximado' },
    { id: 'message', label: 'Contexto do projeto' },
  ];

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function onlyDigits(value) {
    return value.replace(/\D/g, '');
  }

  function validateForm() {
    const errors = [];

    requiredFields.forEach(({ id, label }) => {
      const field = document.getElementById(id);
      if (!field || !String(field.value || '').trim()) {
        errors.push(`${label} é obrigatório.`);
      }
    });

    const email = document.getElementById('email');
    if (email && email.value && !EMAIL_REGEX.test(email.value.trim())) {
      errors.push('Informe um e-mail válido.');
    }

    const whatsapp = document.getElementById('whatsapp');
    if (whatsapp) {
      const digits = onlyDigits(whatsapp.value || '');
      if (digits.length < 10 || digits.length > 13) {
        errors.push('Informe um WhatsApp válido com DDD e número.');
      }
    }

    return errors;
  }

  function buildOdooPayload() {
    const formData = new FormData(form);

    return {
      name: `${formData.get('name')} - ${formData.get('company')}`,
      contact_name: formData.get('name'),
      email_from: formData.get('email'),
      partner_name: formData.get('company'),
      phone: formData.get('whatsapp'),
      description: formData.get('message'),
      x_service_interest: formData.get('service_interest'),
      x_estimated_budget: formData.get('estimated_budget'),
      source_page: formData.get('source_page'),
      lead_source: formData.get('lead_source'),
      website: window.location.origin,
      metadata: {
        captured_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
      },
    };
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (feedback) feedback.textContent = '';

    const errors = validateForm();
    if (errors.length > 0) {
      if (feedback) feedback.textContent = errors[0];
      return;
    }

    const payload = buildOdooPayload();

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Falha no envio do lead.');
      }

      form.reset();
      if (sourcePageInput) sourcePageInput.value = window.location.pathname || '/';
      if (feedback) feedback.textContent = 'Obrigado! Recebemos seus dados e entraremos em contato.';
    } catch (error) {
      if (feedback) feedback.textContent = 'Não foi possível enviar agora. Tente novamente em instantes.';
    }
  });
})();
