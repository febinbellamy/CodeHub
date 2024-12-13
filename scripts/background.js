console.log("scripts/background.js");

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    chrome.tabs.create({
      url: "welcome.html",
    });
    chrome.storage.local.set({
      isUserAuthenticated: false,
      isRepoConnected: false,
    });
  }
});
