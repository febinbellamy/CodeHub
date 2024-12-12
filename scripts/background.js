console.log("scripts/background.js");

// As soon as this extension is installed, open the welcome.html page in a new tab.
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    chrome.tabs.create({
      url: "welcome.html",
    });
  }
});

chrome.runtime.onMessage.addListener((request) => {
  console.log(request.codewarsData);
});
