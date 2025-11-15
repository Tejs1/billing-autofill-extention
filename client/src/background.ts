import type {
  FormField,
  GenerateFillResponse,
  MessageRequest,
  MessageResponse,
} from "./types.js";
import {
  classifyError,
  DEFAULT_SERVER_URL,
  fetchWithTimeout,
  getServerConfig,
  logError,
  showNotification,
} from "./utils.js";

// Create context menu item on extension install/startup
function createContextMenu(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create(
      {
        id: "ai-fill-form",
        title: "Fill Form with AI",
        contexts: ["page", "editable"],
      },
      () => {
        // Suppress duplicate ID errors (can happen during rapid reloads)
        if (chrome.runtime.lastError) {
          console.log(
            "[AI Form Fill] Context menu creation:",
            chrome.runtime.lastError.message,
          );
        }
      },
    );
  });
}

chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

// Also create on startup in case it was removed
chrome.runtime.onStartup.addListener(() => {
  createContextMenu();
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "ai-fill-form" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "trigger-ai-fill" }, (response) => {
      if (chrome.runtime.lastError) {
        const errorMsg = chrome.runtime.lastError.message || "Unknown error";
        logError("Context menu", errorMsg);

        // Provide user-friendly message for common errors
        if (errorMsg.includes("Receiving end does not exist")) {
          showNotification(
            "Extension Not Ready",
            "Please reload the page and try again.",
          );
        } else {
          showNotification("AI Fill Error", errorMsg);
        }
        return;
      }
      if (!response?.success) {
        logError("AI fill", response?.error || "Unknown error");
        showNotification(
          "AI Fill Failed",
          response?.error || "Failed to fill form. Please try again.",
        );
      }
    });
  }
});

/**
 * Call backend server to generate fill data
 */
async function callBackendServer(
  fields: FormField[],
): Promise<Record<string, any>> {
  const { serverUrl, serverApiKey } = await getServerConfig();

  if (!serverApiKey) {
    throw new Error(
      "Missing server API key. Configure it in the extension settings.",
    );
  }

  // Use v1 API endpoint
  const endpoint = `${serverUrl}/api/v1/generate-fill`;

  let statusCode: number | undefined;

  try {
    const response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": serverApiKey,
      },
      body: JSON.stringify({
        fields: fields,
      }),
    });

    statusCode = response.status;

    if (!response.ok) {
      let detail = "";
      try {
        const errorBody = await response.text();
        const errorData = JSON.parse(errorBody);
        detail = errorData.error || errorBody.slice(0, 400);
      } catch {
        detail = `HTTP ${response.status}`;
      }
      throw new Error(`Server request failed: ${detail}`);
    }

    const data: GenerateFillResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Server returned unsuccessful response");
    }

    return data.data || {};
  } catch (error) {
    // Classify and enhance error
    const extError = classifyError(error as Error, statusCode);

    // Show user-friendly notification
    showNotification("AI Fill Error", extError.message);

    // Re-throw with classified error
    throw new Error(extError.message);
  }
}

/**
 * Handle messages from content scripts
 */
chrome.runtime.onMessage.addListener(
  (
    message: MessageRequest,
    _sender,
    sendResponse: (response: MessageResponse) => void,
  ) => {
    if (message?.type === "generate-fill-data") {
      (async () => {
        try {
          const result = await callBackendServer(message.fields || []);
          sendResponse({ success: true, data: result });
        } catch (error) {
          logError("Generate fill", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          sendResponse({ success: false, error: errorMessage });
        }
      })();
      return true; // keep the message channel open for async response
    }

    // Check server health
    if (message?.type === "check-health") {
      (async () => {
        try {
          const { serverUrl } = await getServerConfig();
          const response = await fetchWithTimeout(
            `${serverUrl}/health`,
            {
              method: "GET",
            },
            5000,
          );

          if (response.ok) {
            sendResponse({ success: true });
          } else {
            sendResponse({
              success: false,
              error: `Server returned ${response.status}`,
            });
          }
        } catch (error) {
          logError("Health check", error);
          sendResponse({
            success: false,
            error:
              error instanceof Error ? error.message : "Health check failed",
          });
        }
      })();
      return true;
    }

    return undefined;
  },
);

// Log startup
console.log("[AI Form Fill] Background service worker started");
