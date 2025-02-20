const authButton = document.querySelector("#authenticate-btn");
const authRequestSection = document.querySelector("#authenticate-request");
const getStartedButton = document.querySelector("#get-started-btn");
const linkRepoRequestSection = document.querySelector("#link-repo-request");
const repoConnectedSection = document.querySelector("#repo-connected");
const aTagForRepoUrl = document.querySelector("#repo-url");
const aTagforUnlinkRepo = document.querySelector("#unlink-repo");
const starCodeHubButton = document.querySelector("#star-repo-button");

authButton.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "authenticateUser" });
});

aTagforUnlinkRepo.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "unlinkRepo" });
});

starCodeHubButton.addEventListener("click", () => {
  window.open("http://www.github.com/febinbellamy/codehub", "_blank").focus();
});

getStartedButton.addEventListener("click", () => {
  const selectedOption = document.querySelector("#repo-options").value;
  const repoName = document.querySelector("#repo-name").value.trim();
  if (selectedOption === "existing-repo") {
    chrome.runtime.sendMessage({
      action: "connectExistingRepo",
      repoName: repoName,
    });
  } else if (selectedOption === "new-repo") {
    chrome.runtime.sendMessage({ action: "createRepo", repoName: repoName });
  }
});

document.addEventListener("keydown", (event) => {
  if (
    linkRepoRequestSection.style.display === "block" &&
    event.key === "Enter"
  ) {
    getStartedButton.click();
  }
});

const updateUI = () => {
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
          directory ? "/" + directory : ""
        }`;
        aTagForRepoUrl.href = `https://github.com/${githubUsername}/${repo}${
          directory ? "/tree/main/" + directory : ""
        }`;
      }
    }
  );
};

const displayErrorMessage = (msg) => {
  let errorMessage;

  const repoName = document.querySelector("#repo-name").value;
  if (msg.issue === "repoNotFound") {
    errorMessage = `Error: the ${repoName} repository was not found. Please enter a valid repository name.`;
  } else if (msg.issue === "createAnAlreadyExisitingRepo") {
    errorMessage = `Error: the ${repoName} repository already exists. Please choose the "Select an existing repository" option.`;
  } else if (msg.issue === "repoNameIsTooLongOrTooShort") {
    errorMessage = `Error: please enter a valid repository name that is between 1 and 100 characters long.`;
  } else {
    errorMessage = `Error: please enter a valid repository name.`;
  }

  if (linkRepoRequestSection.children[0].tagName === "P") {
    linkRepoRequestSection.children[0].innerText = errorMessage;
  } else {
    const pTag = document.createElement("p");
    pTag.innerText = errorMessage;
    pTag.style.color = "red";
    linkRepoRequestSection.prepend(pTag);
  }
};

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "updateUI") {
    updateUI();
  } else if (message.action === "displayErrorMessage") {
    displayErrorMessage(message);
  }
});

updateUI();
