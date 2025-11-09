const form = document.getElementById("optionsForm");
const serverUrlInput = document.getElementById("serverUrl");
const serverApiKeyInput = document.getElementById("serverApiKey");
const statusEl = document.getElementById("status");

function setStatus(message, tone = "") {
	statusEl.textContent = message;
	statusEl.className = `status ${tone}`;
}

async function loadSettings() {
	try {
		const { serverUrl, serverApiKey } = await chrome.storage.local.get([
			"serverUrl",
			"serverApiKey",
		]);
		if (serverUrl) {
			serverUrlInput.value = serverUrl;
		}
		if (serverApiKey) {
			serverApiKeyInput.value = serverApiKey;
		}
	} catch (error) {
		console.error("Failed to load settings", error);
		setStatus("Failed to load saved settings.", "error");
	}
}

async function testConnection(serverUrl, serverApiKey) {
	try {
		const response = await fetch(`${serverUrl}/health`, {
			method: "GET",
			headers: {
				"X-API-Key": serverApiKey,
			},
		});
		return response.ok;
	} catch {
		return false;
	}
}

form.addEventListener("submit", async (event) => {
	event.preventDefault();
	const serverUrl = serverUrlInput.value.trim();
	const serverApiKey = serverApiKeyInput.value.trim();

	if (!serverUrl) {
		setStatus("Enter a server URL before saving.", "error");
		return;
	}

	if (!serverApiKey) {
		setStatus("Enter a server API key before saving.", "error");
		return;
	}

	// Validate URL format
	try {
		new URL(serverUrl);
	} catch {
		setStatus("Invalid server URL format.", "error");
		return;
	}

	setStatus("Saving and testing connection…");

	// Test connection
	const isConnected = await testConnection(serverUrl, serverApiKey);

	try {
		await chrome.storage.local.set({ serverUrl, serverApiKey });

		if (isConnected) {
			setStatus(
				"Settings saved successfully! Server connection verified. ✓",
				"success",
			);
		} else {
			setStatus(
				"Settings saved, but couldn't connect to server. Please verify the server is running.",
				"error",
			);
		}
	} catch (error) {
		console.error("Failed to save settings", error);
		setStatus("Failed to save settings. Check console for details.", "error");
	}
});

document.addEventListener("DOMContentLoaded", loadSettings);
