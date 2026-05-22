const leadButtons = document.querySelectorAll('.js-open-lead');
const leadForm = document.querySelector('[data-lead-form]');
const interestSelect = document.querySelector('[data-lead-intent]');
const formStatus = document.querySelector('[data-form-status]');

const webhookUrl = window.JBSDIGITALPRO_WEBHOOK_URL || '';

leadButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const intent = button.getAttribute('data-intent');
    if (intent && interestSelect) {
      interestSelect.value = intent;
    }

    window.setTimeout(() => {
      leadForm?.querySelector('input[name="nome"]')?.focus();
    }, 180);
  });
});

leadForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(leadForm);
  const payload = Object.fromEntries(formData.entries());
  payload.data_envio = new Date().toISOString();
  payload.pagina = window.location.href;

  formStatus.className = 'form-status';
  formStatus.textContent = 'Preparando sua solicitação...';

  if (!webhookUrl) {
    formStatus.classList.add('is-ready');
    formStatus.textContent = 'Formulário pronto. Falta conectar a URL do webhook n8n para envio automático.';
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Falha no envio');
    }

    leadForm.reset();
    formStatus.classList.add('is-ready');
    formStatus.textContent = 'Solicitação enviada. A JBS DigitalPRO vai falar com você em breve.';
  } catch (error) {
    formStatus.textContent = 'Não foi possível enviar agora. Tente novamente em alguns minutos.';
  }
});
