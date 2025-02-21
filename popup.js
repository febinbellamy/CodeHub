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
      repoConnectedSection.style.display = "none";
      linkRepoRequestSection.style.display = "none";
      authRequestSection.style.display = "block";
    } else if (isUserAuthenticated && !isRepoConnected) {
      authRequestSection.style.display = "none";
      repoConnectedSection.style.display = "none";
      linkRepoRequestSection.style.display = "block";
    } else if (isUserAuthenticated && isRepoConnected) {
      authRequestSection.style.display = "none";
      linkRepoRequestSection.style.display = "none";
      repoConnectedSection.style.display = "block";
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
