(() => {
  const TICKS_PER = {
    second: 10000000,
    minute: 600000000,
    hour: 36000000000,
    day: 864000000000,
    week: 6048000000000
  };

  const UNIT_LABELS = {
    second: "second",
    minute: "minute",
    hour: "hour",
    day: "day",
    week: "week"
  };

  const calculators = document.querySelectorAll("[data-ticks-calculator]");

  calculators.forEach((root) => {
    const timeValue = root.querySelector("[data-time-value]");
    const timeUnit = root.querySelector("[data-time-unit]");
    const ticksResult = root.querySelector("[data-ticks-result]");
    const calculation = root.querySelector("[data-calculation]");
    const expression = root.querySelector("[data-expression]");
    const reverseValue = root.querySelector("[data-reverse-value]");
    const message = root.querySelector("[data-message]");

    const reverseOutputs = {
      seconds: root.querySelector("[data-reverse-seconds]"),
      minutes: root.querySelector("[data-reverse-minutes]"),
      hours: root.querySelector("[data-reverse-hours]"),
      days: root.querySelector("[data-reverse-days]"),
      weeks: root.querySelector("[data-reverse-weeks]")
    };

    const formatter = new Intl.NumberFormat("en-GB", {
      maximumFractionDigits: 6
    });

    let rawTicks = "36000000000";
    let rawExpression = "addTicks(utcNow(), 36000000000)";

    function setMessage(text = "", type = "") {
      message.textContent = text;
      message.classList.remove("is-success", "is-error");

      if (type) {
        message.classList.add(`is-${type}`);
      }
    }

    function cleanDecimal(value) {
      return String(value).trim().replace(/,/g, "");
    }

    function formatIntegerString(value) {
      const clean = value.replace(/^(-?)(0+)(?=\d)/, "$1");
      const negative = clean.startsWith("-");
      const digits = negative ? clean.slice(1) : clean;

      if (!/^\d+$/.test(digits)) {
        return value;
      }

      const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return negative ? `-${grouped}` : grouped;
    }

    function calculateTicks() {
      setMessage();

      const valueText = cleanDecimal(timeValue.value);

      if (valueText === "") {
        ticksResult.textContent = "—";
        calculation.textContent = "Enter a duration to calculate.";
        expression.textContent = "—";
        rawTicks = "";
        rawExpression = "";
        return;
      }

      const value = Number(valueText);

      if (!Number.isFinite(value) || value < 0) {
        ticksResult.textContent = "—";
        calculation.textContent = "";
        expression.textContent = "—";
        rawTicks = "";
        rawExpression = "";
        setMessage("Enter a valid value of zero or greater.", "error");
        return;
      }

      const unit = timeUnit.value;
      const multiplier = TICKS_PER[unit];
      const result = value * multiplier;

      if (!Number.isSafeInteger(result)) {
        ticksResult.textContent = "—";
        calculation.textContent = "";
        expression.textContent = "—";
        rawTicks = "";
        rawExpression = "";
        setMessage("That value is too large for a reliable browser calculation.", "error");
        return;
      }

      rawTicks = Math.round(result).toString();
      rawExpression = `addTicks(utcNow(), ${rawTicks})`;

      ticksResult.textContent = formatIntegerString(rawTicks);

      const singular = value === 1;
      calculation.textContent =
        `${formatter.format(value)} ${UNIT_LABELS[unit]}${singular ? "" : "s"} × ` +
        `${formatIntegerString(String(multiplier))} ticks`;

      expression.textContent = rawExpression;
    }

    function calculateReverse() {
      setMessage();

      const cleaned = reverseValue.value.replace(/[,\s]/g, "");

      if (cleaned === "") {
        Object.values(reverseOutputs).forEach((output) => {
          output.textContent = "—";
        });
        return;
      }

      if (!/^-?\d+$/.test(cleaned)) {
        Object.values(reverseOutputs).forEach((output) => {
          output.textContent = "—";
        });
        setMessage("Enter a whole tick value. Commas and spaces are fine.", "error");
        return;
      }

      const value = Number(cleaned);

      if (!Number.isSafeInteger(value)) {
        Object.values(reverseOutputs).forEach((output) => {
          output.textContent = "—";
        });
        setMessage("That tick value is too large for a reliable browser calculation.", "error");
        return;
      }

      reverseOutputs.seconds.textContent = formatter.format(value / TICKS_PER.second);
      reverseOutputs.minutes.textContent = formatter.format(value / TICKS_PER.minute);
      reverseOutputs.hours.textContent = formatter.format(value / TICKS_PER.hour);
      reverseOutputs.days.textContent = formatter.format(value / TICKS_PER.day);
      reverseOutputs.weeks.textContent = formatter.format(value / TICKS_PER.week);
    }

    async function copyText(text, successMessage) {
      if (!text) {
        setMessage("There is no value to copy yet.", "error");
        return;
      }

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.setAttribute("readonly", "");
          textarea.style.position = "absolute";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          textarea.remove();
        }

        setMessage(successMessage, "success");
      } catch {
        setMessage("Copy failed. Select the value manually instead.", "error");
      }
    }

    root.querySelectorAll("[data-preset-value]").forEach((button) => {
      button.addEventListener("click", () => {
        timeValue.value = button.dataset.presetValue;
        timeUnit.value = button.dataset.presetUnit;
        calculateTicks();
      });
    });

    root.querySelectorAll("[data-copy]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.copy === "expression") {
          copyText(rawExpression, "Power Automate expression copied.");
        } else {
          copyText(rawTicks, "Tick value copied.");
        }
      });
    });

    root.querySelectorAll("[data-mode-button]").forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.dataset.modeButton;

        root.querySelectorAll("[data-mode-button]").forEach((tab) => {
          const selected = tab === button;
          tab.classList.toggle("is-active", selected);
          tab.setAttribute("aria-selected", String(selected));
        });

        root.querySelectorAll("[data-panel]").forEach((panel) => {
          panel.hidden = panel.dataset.panel !== mode;
        });

        setMessage();
      });
    });

    timeValue.addEventListener("input", calculateTicks);
    timeUnit.addEventListener("change", calculateTicks);
    reverseValue.addEventListener("input", calculateReverse);

    calculateTicks();
    calculateReverse();
  });
})();
