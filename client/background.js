// Default server URL (can be overridden in options)
const DEFAULT_SERVER_URL = "http://localhost:3000";

// Create context menu item on extension install/startup
function createContextMenu() {
	chrome.contextMenus.removeAll(() => {
		chrome.contextMenus.create({
			id: "ai-fill-form",
			title: "Fill Form with AI",
			contexts: ["page", "editable"],
		});
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
				console.error("Extension error:", chrome.runtime.lastError);
				return;
			}
			if (!response?.success) {
				console.warn("AI fill failed:", response?.error);
			}
		});
	}
});

async function getServerConfig() {
	const { serverUrl, serverApiKey } = await chrome.storage.local.get([
		"serverUrl",
		"serverApiKey",
	]);
	return {
		serverUrl: serverUrl || DEFAULT_SERVER_URL,
		serverApiKey: serverApiKey || null,
	};
}

async function callBackendServer(fields) {
	const { serverUrl, serverApiKey } = await getServerConfig();

	if (!serverApiKey) {
		throw new Error(
			"Missing server API key. Configure it in the extension settings.",
		);
	}

	const endpoint = `${serverUrl}/api/generate-fill`;

	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-API-Key": serverApiKey,
		},
		body: JSON.stringify({
			fields: fields,
		}),
	});

	if (!response.ok) {
		let detail = "";
		try {
			const errorBody = await response.text();
			const errorData = JSON.parse(errorBody);
			detail = errorData.error || errorBody.slice(0, 400);
		} catch {
			detail = `status ${response.status}`;
		}
		throw new Error(`Server request failed: ${detail}`);
	}

	const data = await response.json();

	if (!data.success) {
		throw new Error(data.error || "Server returned unsuccessful response");
	}

	return data.data;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message?.type === "generate-fill-data") {
		(async () => {
			try {
				const result = await callBackendServer(message.fields || []);
				sendResponse({ success: true, data: result });
			} catch (error) {
				console.error("AI fill error:", error);
				sendResponse({ success: false, error: error.message });
			}
		})();
		return true; // keep the message channel open for async response
	}
	return undefined;
});
