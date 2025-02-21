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

const toggleVisibility = (section, visible) => {
  section.style.display = visible ? "block" : "none";
};

chrome.storage.local.get(
  [
    "isUserAuthenticated",
    "isRepoConnected",
    "githubUsername",
    "repo",
    "directory",
  ],
  (result) => {
    const {
      isUserAuthenticated,
      isRepoConnected,
      githubUsername,
      repo,
      directory,
    } = result;

    if (!isUserAuthenticated && !isRepoConnected) {
      toggleVisibility(linkRepoRequestSection, false);
      toggleVisibility(repoConnectedSection, false);
      toggleVisibility(authRequestSection, true);
    } else if (isUserAuthenticated && !isRepoConnected) {
      toggleVisibility(authRequestSection, false);
      toggleVisibility(repoConnectedSection, false);
      toggleVisibility(linkRepoRequestSection, true);
    } else if (isUserAuthenticated && isRepoConnected) {
      toggleVisibility(authRequestSection, false);
      toggleVisibility(linkRepoRequestSection, false);
      toggleVisibility(repoConnectedSection, true);
      aTagForRepoUrl.innerHTML = `${githubUsername}/${repo}${
        directory ? "/" + decodeURIComponent(directory) : ""
      }`;
      aTagForRepoUrl.href = `https://github.com/${githubUsername}/${repo}/${
        directory ? "tree/main/" + directory : ""
      }`;
      aTagForRepoUrl.target = "_blank";
    }
  }
);
