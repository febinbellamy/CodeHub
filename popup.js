import { updateUI } from "./scripts/helperFunctions.js";

const authButton = document.querySelector("#authenticate-btn");
const authRequestSection = document.querySelector("#authenticate-request");
const linkRepoButton = document.querySelector("#link-repo-btn");
const linkRepoRequestSection = document.querySelector("#link-repo-request");
const repoConnectedSection = document.querySelector("#repo-connected");
const aTagForRepoUrl = document.querySelector("#repo-url");
const starCodeHubButton = document.querySelector("#star-repo-button");
const globeIcon = document.querySelector("#globe-icon");

authButton.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "authenticateUser" });
});

linkRepoButton.addEventListener("click", () => {
  chrome.tabs.create({ url: "welcome.html" });
});

globeIcon.addEventListener("click", () => {
  chrome.tabs.create({ url: "welcome.html" });
});

starCodeHubButton.addEventListener("click", () => {
  chrome.tabs.create({ url: "http://www.github.com/febinbellamy/codehub" });
});

updateUI(
  authRequestSection,
  linkRepoRequestSection,
  repoConnectedSection,
  aTagForRepoUrl
);
