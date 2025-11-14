import type { FormField, MessageResponse } from "./types.js";

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

/**
 * Ensure highlight CSS is injected into the page
 */
function ensureHighlightStyle(): void {
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = HIGHLIGHT_STYLE_ID;
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.45);
      transition: box-shadow 0.3s ease;
    }
  `;

  // Use insertBefore to avoid potential conflicts with React
  const head = document.head || document.getElementsByTagName("head")[0];
  if (head) {
    head.insertBefore(style, head.firstChild);
  }
}

/**
 * Get label text for a field using multiple strategies
 */
function getLabelText(field: HTMLInputElement | HTMLTextAreaElement): string {
  // Explicit label
  if (field.id) {
    const explicit = document.querySelector<HTMLLabelElement>(
      `label[for="${CSS.escape(field.id)}"]`
    );
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

/**
 * Collect all fillable fields from the page
 */
function collectFields(): FormField[] {
  const result: FormField[] = [];
  const allFields = [
    ...document.querySelectorAll<HTMLInputElement>("input"),
    ...document.querySelectorAll<HTMLTextAreaElement>("textarea"),
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

/**
 * Apply a value to a field with proper event dispatching
 */
function applyValue(field: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const previousValue = field.value;
  field.focus();
  field.value = value;

  // Dispatch events for frameworks like React
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));

  if (previousValue !== value) {
    field.dispatchEvent(new Event("blur", { bubbles: true }));
  }
}

/**
 * Fill fields with values from the fill map
 */
function fillFields(fillMap: Record<string, any>): void {
  ensureHighlightStyle();

  Object.entries(fillMap).forEach(([id, payload]) => {
    const field = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[${FILL_ATTR}="${CSS.escape(id)}"]`
    );
    if (!field) return;

    const value =
      typeof payload === "object" && payload?.value ? payload.value : payload;
    if (!value) return;

    applyValue(field, value);
    field.classList.add(HIGHLIGHT_CLASS);

    // Remove highlight after animation
    setTimeout(() => field.classList.remove(HIGHLIGHT_CLASS), 1500);
    field.removeAttribute(FILL_ATTR);
  });
}

/**
 * Request AI fill data from background script
 */
async function requestAiFill(fields: FormField[]): Promise<MessageResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "generate-fill-data",
        fields,
      },
      (response: MessageResponse) => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: chrome.runtime.lastError.message,
          });
          return;
        }
        resolve(response);
      }
    );
  });
}

/**
 * Cleanup function to remove fill attributes from fields
 */
function cleanupFields(fields: FormField[]): void {
  fields.forEach(({ id }) => {
    const field = document.querySelector(`[${FILL_ATTR}="${CSS.escape(id)}"]`);
    field?.removeAttribute(FILL_ATTR);
  });
}

/**
 * Main handler for fill requests
 */
async function handleFillRequest(): Promise<{ success: boolean; error?: string; filled?: number }> {
  const fields = collectFields();

  if (!fields.length) {
    return {
      success: false,
      error: "No suitable input fields detected on this page.",
    };
  }

  try {
    const response = await requestAiFill(fields);

    if (!response?.success) {
      cleanupFields(fields);
      console.warn("[AI Form Fill] Fill failed:", response?.error);
      return {
        success: false,
        error: response?.error || "Failed to generate fill data",
      };
    }

    fillFields(response.data || {});
    cleanupFields(fields);

    return {
      success: true,
      filled: Object.keys(response.data || {}).length,
    };
  } catch (error) {
    cleanupFields(fields);
    console.error("[AI Form Fill] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "trigger-ai-fill") {
    handleFillRequest()
      .then((result) => sendResponse(result))
      .catch((error) => {
        console.error("[AI Form Fill] Error:", error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });
    return true; // Keep message channel open for async response
  }
  return undefined;
});

// Log content script loaded
console.log("[AI Form Fill] Content script loaded");
