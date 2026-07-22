(function () {
  "use strict";

  const config = window.CSS_WEBINAR_CONFIG || {};
  const overlay = document.getElementById("modalOverlay");
  const form = document.getElementById("registration-form");
  const status = document.querySelector("[data-form-status]");
  const submitButton = document.querySelector("[data-submit-button]");

  window.openModal = function () {
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    window.setTimeout(function () {
      const firstInput = overlay.querySelector("input:not([type='hidden'])");
      if (firstInput) firstInput.focus();
    }, 50);
  };

  window.closeModal = function () {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  };

  window.closeSuccessPopup = function () {
    const popup = document.getElementById("success-popup");
    if (popup) popup.style.display = "none";
  };

  function setStatus(message, type) {
    status.textContent = message;
    status.className = "form-status show " + type;
  }

  function currencyLabel(amount, currency) {
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: currency,
        maximumFractionDigits: 0
      }).format(amount);
    } catch (error) {
      return "$" + amount;
    }
  }

  document.querySelectorAll("[data-webinar-date]").forEach(function (node) {
    node.textContent = config.displayDate || "Date and time to be announced";
  });

  const webinarId = form.querySelector("[name='webinar_id']");
  if (webinarId && config.webinarId) webinarId.value = config.webinarId;

  const price = document.querySelector("[data-recording-price]");
  if (price) price.textContent = currencyLabel(config.recordingPrice || 30, config.recordingCurrency || "USD");

  const checkout = document.querySelector("[data-recording-checkout]");
  if (checkout && config.recordingCheckoutUrl) {
    checkout.href = config.recordingCheckoutUrl;
    checkout.textContent = "Buy the recording";
    checkout.removeAttribute("aria-disabled");
  } else if (checkout) {
    checkout.addEventListener("click", function (event) { event.preventDefault(); });
  }

  const params = new URLSearchParams(window.location.search);
  ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach(function (key) {
    const input = form.querySelector("[name='" + key + "']");
    if (input) input.value = params.get(key) || "";
  });

  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) window.closeModal();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") window.closeModal();
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    status.className = "form-status";

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!config.registrationEndpoint) {
      setStatus("Registration will open as soon as the webinar date is confirmed.", "info");
      return;
    }

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.landing_url = window.location.href;
    payload.marketing_consent = form.elements.marketing_consent.checked;

    submitButton.disabled = true;
    submitButton.textContent = "Registering…";

    try {
      const response = await fetch(config.registrationEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Registration request failed");

      form.reset();
      window.closeModal();
      document.getElementById("success-popup").style.display = "flex";
      if (typeof window.fbq === "function") window.fbq("track", "Lead");
    } catch (error) {
      setStatus("We couldn’t complete your registration. Please try again or contact Creative Sample Studio.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Confirm My Free Spot";
    }
  });
}());
