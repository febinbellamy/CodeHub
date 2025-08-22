import { updateUI } from "./helperFunctions.js";

const authButton = document.querySelector("#authenticate-btn");
const authRequestSection = document.querySelector("#authenticate-request");
const getStartedButton = document.querySelector("#get-started-btn");
const linkRepoRequestSection = document.querySelector("#link-repo-request");
const repoConnectedSection = document.querySelector("#repo-connected");
const aTagForRepoUrl = document.querySelector("#repo-url");
const aTagforUnlinkRepo = document.querySelector("#unlink-repo");
const starCodeHubButton = document.querySelector("#star-repo-button");
const settingsIcon = document.querySelector("#settings-icon");
const settingsModal = document.querySelector("#settings-modal");
const saveSettingsBtn = document.querySelector("#save-settings-btn");
const closeModal = document.querySelector(".close");

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("folderStructure", (result) => {
    const saved = result.folderStructure || "level-problem-language";
    const radio = document.querySelector(
      `input[name="folder-structure"][value="${saved}"]`
    );
    if (radio) {
      radio.checked = true;
    }
  });
});

authButton.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "authenticateUser" });
});

aTagforUnlinkRepo.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "unlinkRepo" });
});

starCodeHubButton.addEventListener("click", () => {
  window.open("http://www.github.com/febinbellamy/codehub", "_blank").focus();
});

settingsIcon.addEventListener("click", () => {
  settingsModal.style.display = "block";
});

saveSettingsBtn.addEventListener("click", () => {
  const selected = document.querySelector(
    'input[name="folder-structure"]:checked'
  ).value;
  chrome.storage.local.set({ folderStructure: selected }, () => {
    settingsModal.style.display = "none";
  });
});

closeModal.addEventListener("click", () => {
  settingsModal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === settingsModal) {
    settingsModal.style.display = "none";
  }
});

getStartedButton.addEventListener("click", () => {
  const selectedOption = document.querySelector("#repo-options").value;
  const userInput = document.querySelector("#user-input").value;
  if (selectedOption === "existing-repo") {
    chrome.runtime.sendMessage({
      action: "connectExistingRepo",
      userInput: userInput,
    });
  } else if (selectedOption === "new-repo") {
    chrome.runtime.sendMessage({ action: "createRepo", userInput: userInput });
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

const displayErrorMessage = (msg) => {
  let errorMessage;

  const userInput = document.querySelector("#user-input").value;
  if (msg.issue === "repoNotFound") {
    errorMessage = `Error: the ${userInput} repository was not found. Please enter a valid repository name.`;
  } else if (msg.issue === "repoAndDirectoryNotFound") {
    errorMessage = `Error: the ${userInput} repo and directory path was not found. Please enter a valid input.`;
  } else if (msg.issue === "createAnAlreadyExisitingRepo") {
    errorMessage = `Error: the ${userInput} repository already exists. \n Please choose the "Select an existing repository" option.`;
  } else if (msg.issue === "repoNameIsTooLongOrTooShort") {
    errorMessage = `Error: please enter a valid repository name that is between 1 and 100 characters long.`;
  } else if (msg.issue === "invalidRepoOrDirectoryName") {
    errorMessage = `Error: please enter a valid repository or directory name.`;
  } else if (msg.issue === "repoAndDirectoryAlreadyExists") {
    errorMessage = `Error: the ${userInput} repo and directory path already exists. \n Please choose the "Select an existing repository" option.`;
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
    updateUI(
      authRequestSection,
      linkRepoRequestSection,
      repoConnectedSection,
      aTagForRepoUrl
    );
  } else if (message.action === "displayErrorMessage") {
    displayErrorMessage(message);
  }
});

updateUI(
  authRequestSection,
  linkRepoRequestSection,
  repoConnectedSection,
  aTagForRepoUrl
);
