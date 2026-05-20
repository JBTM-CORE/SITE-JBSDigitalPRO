const WEBHOOK_URL = "https://n8n.exemplo.com/webhook/jbsdigitalpro-leads";

const contactForm = document.getElementById("contact-form");
const feedback = document.getElementById("form-feedback");

function setFeedback(message, isError = false) {
  if (!feedback) return;
  feedback.textContent = message;
  feedback.style.color = isError ? "#b00020" : "#1b5e20";
}

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const payload = {
      nome: String(formData.get("nome") || "").trim(),
      empresa: String(formData.get("empresa") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      whatsapp: String(formData.get("whatsapp") || "").trim(),
      servico_interesse: String(formData.get("servico_interesse") || "").trim(),
      mensagem: String(formData.get("mensagem") || "").trim(),
      lead_source: String(formData.get("lead_source") || "site_jbsdigitalpro"),
      form_type: String(formData.get("form_type") || "contato"),
      submitted_at: new Date().toISOString(),
    };

    if (
      !payload.nome ||
      !payload.empresa ||
      !payload.email ||
      !payload.whatsapp ||
      !payload.servico_interesse ||
      !payload.mensagem
    ) {
      setFeedback("Preencha todos os campos obrigatórios.", true);
      return;
    }

    try {
      setFeedback("Enviando...");

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Falha no envio: ${response.status}`);
      }

      setFeedback("Mensagem enviada com sucesso. Em breve entraremos em contato!");
      contactForm.reset();
      const formType = contactForm.querySelector("#form_type");
      if (formType) formType.value = "contato";
    } catch (error) {
      console.error("Erro ao enviar formulário", error);
      setFeedback("Não foi possível enviar agora. Tente novamente em instantes.", true);
    }
  });
}
