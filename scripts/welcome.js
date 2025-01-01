console.log("hello from welcome.js!");

const authButton = document.querySelector("#authenticate-btn");
const authRequestSection = document.querySelector("#authenticate-request");
const getStartedButton = document.querySelector("#get-started-btn");
const linkRepoRequestSection = document.querySelector("#link-repo-request");
const repoConnectedSection = document.querySelector("#repo-connected");
const aTagForRepoUrl = document.querySelector("#repo-url");

// chrome.storage.local.set(
//   { isUserAuthenticated: false, isRepoConnected: false },
//   () => {
//     console.log("Setting isUserAuthenticated to false");
//   }
// );

// chrome.storage.local.set(
//   { isUserAuthenticated: true, isRepoConnected: false },
//   () => {
//     console.log("Setting isRepoConnected to false");
//   }
// );

authButton.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "authenticateUser" });
});

getStartedButton.addEventListener("click", () => {
  const selectedOption = document.querySelector("#repo-options").value;
  const repoName = document.querySelector("#repo-name").value;
  if (selectedOption === "existing-repo") {
    chrome.runtime.sendMessage({
      action: "connectExistingRepo",
      repoName: repoName,
    });
  } else if (selectedOption === "new-repo") {
    chrome.runtime.sendMessage({ action: "createRepo", repoName: repoName });
  }
});

chrome.storage.local.get(
  ["isUserAuthenticated", "isRepoConnected", "githubUsername", "repo"],
  (result) => {
    const { isUserAuthenticated, isRepoConnected, githubUsername, repo } =
      result;

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
      aTagForRepoUrl.innerHTML = `${githubUsername}/${repo}`;
      aTagForRepoUrl.href = `https://github.com/${githubUsername}/${repo}`;
    }
  }
);
