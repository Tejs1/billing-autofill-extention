const FILL_ATTR = "data-ai-fill-id";
const SUPPORTED_TYPES = new Set([
  "text",
  "email",
  "tel",
  "url",
  "search",
  "number",
  "textarea",
  "datetime-local",
  "date",
  "month",
  "time",
]);

const HIGHLIGHT_STYLE_ID = "ai-fill-highlight-style";
const HIGHLIGHT_CLASS = "ai-auto-filled";

function ensureHighlightStyle() {
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = HIGHLIGHT_STYLE_ID;
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.45);
      transition: box-shadow 0.3s ease;
    }
  `;
  document.head.append(style);
}

function getLabelText(field) {
  // Explicit label
  if (field.id) {
    const explicit = document.querySelector(`label[for="${CSS.escape(field.id)}"]`);
    if (explicit?.textContent) {
      return explicit.textContent.trim();
    }
  }

  // Wrapped label
  const parentLabel = field.closest("label");
  if (parentLabel?.textContent) {
    return parentLabel.textContent.trim();
  }

  // aria-labelledby
  const ariaLabelledBy = field.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const ids = ariaLabelledBy.split(/\s+/).filter(Boolean);
    const text = ids
      .map((id) => document.getElementById(id)?.textContent?.trim())
      .filter(Boolean)
      .join(" ")
      .trim();
    if (text) {
      return text;
    }
  }

  // aria-label attribute
  const ariaLabel = field.getAttribute("aria-label");
  if (ariaLabel) {
    return ariaLabel.trim();
  }

  return "";
}

function collectFields() {
  const result = [];
  const allFields = [
    ...document.querySelectorAll("input"),
    ...document.querySelectorAll("textarea"),
  ];

  let counter = 0;
  for (const field of allFields) {
    const type = field.type?.toLowerCase() || field.tagName.toLowerCase();
    if (!SUPPORTED_TYPES.has(type)) continue;
    if (field.disabled || field.readOnly) continue;
    if (field.getAttribute("data-ignore-ai-fill") === "true") continue;

    const label = getLabelText(field);
    const name = field.name || "";
    const placeholder = field.placeholder || "";
    const existingValue = field.value?.trim();

    const id = `${Date.now()}-${counter++}`;
    field.setAttribute(FILL_ATTR, id);

    result.push({
      id,
      name,
      label,
      placeholder,
      type,
      existingValue,
    });
  }

  return result;
}

function applyValue(field, value) {
  const previousValue = field.value;
  field.focus();
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  if (previousValue !== value) {
    field.dispatchEvent(new Event("blur", { bubbles: true }));
  }
}

function fillFields(fillMap) {
  ensureHighlightStyle();
  Object.entries(fillMap).forEach(([id, payload]) => {
    const field = document.querySelector(`[${FILL_ATTR}="${CSS.escape(id)}"]`);
    if (!field) return;
    const value = typeof payload === "object" && payload?.value ? payload.value : payload;
    if (!value) return;
    applyValue(field, value);
    field.classList.add(HIGHLIGHT_CLASS);
    setTimeout(() => field.classList.remove(HIGHLIGHT_CLASS), 1500);
    field.removeAttribute(FILL_ATTR);
  });
}

async function requestAiFill(fields) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "generate-fill-data",
        fields,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: chrome.runtime.lastError.message,
          });
          return;
        }
        resolve(response);
      },
    );
  });
}

async function handleFillRequest() {
  const fields = collectFields();
  if (!fields.length) {
    return { success: false, error: "No suitable inputs detected on this page." };
  }

  const response = await requestAiFill(fields);
  if (!response?.success) {
    fields.forEach(({ id }) => {
      const field = document.querySelector(`[${FILL_ATTR}="${CSS.escape(id)}"]`);
      field?.removeAttribute(FILL_ATTR);
    });
    console.warn("AI fill failed:", response?.error);
    return { success: false, error: response?.error || "Unknown error" };
  }

  fillFields(response.data || {});
  fields.forEach(({ id }) => {
    const field = document.querySelector(`[${FILL_ATTR}="${CSS.escape(id)}"]`);
    field?.removeAttribute(FILL_ATTR);
  });
  return { success: true, filled: Object.keys(response.data || {}).length };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "trigger-ai-fill") {
    handleFillRequest()
      .then((result) => sendResponse(result))
      .catch((error) => {
        console.error("AI fill error:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  return undefined;
});
