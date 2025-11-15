import type { StatusTone } from "./types.js";

// Wrap in IIFE to avoid global scope conflicts
(() => {
	const fillButton = document.getElementById("fillButton") as HTMLButtonElement;
	const statusEl = document.getElementById("status") as HTMLDivElement;
	const openOptionsButton = document.getElementById(
		"openOptions",
	) as HTMLButtonElement;

	function setStatus(message: string, tone: StatusTone = ""): void {
		statusEl.textContent = message;
		statusEl.className = `status ${tone}`;
	}

	fillButton.addEventListener("click", () => {
		setStatus("Scanning page…", "");
		fillButton.disabled = true;

		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const activeTab = tabs?.[0];
			if (!activeTab?.id) {
				setStatus("Unable to find the active tab.", "error");
				fillButton.disabled = false;
				return;
			}

			chrome.tabs.sendMessage(
				activeTab.id,
				{ type: "trigger-ai-fill" },
				(response) => {
					fillButton.disabled = false;

					if (chrome.runtime.lastError) {
						console.error("Extension error:", chrome.runtime.lastError);
						setStatus(
							chrome.runtime.lastError.message || "Unknown error occurred",
							"error",
						);
						return;
					}

					if (!response?.success) {
						const error =
							response?.error ||
							"No response from content script. Try reloading the tab.";
						setStatus(error, "error");
						return;
					}

					const filledCount = response.filled || 0;
					if (filledCount === 0) {
						setStatus("Nothing to fill for this page.", "");
					} else {
						setStatus(
							`Filled ${filledCount} field${filledCount === 1 ? "" : "s"} with AI suggestions.`,
							"success",
						);
					}
				},
			);
		});
	});

	openOptionsButton.addEventListener("click", () => {
		if (chrome.runtime.openOptionsPage) {
			chrome.runtime.openOptionsPage();
		} else {
			window.open(chrome.runtime.getURL("options.html"));
		}
	});
})();
