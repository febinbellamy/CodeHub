import { authUrl, onTabUpdate } from "./authenticateGithub.js";
import {
  supportedFileExtensions,
  addOrUpdateSolution,
  addReadme,
} from "./codewarsToGithub.js";

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
  chrome.runtime.setUninstallURL(
    "https://docs.google.com/forms/d/e/1FAIpQLSec6gIK40FeNvv6fhjjVi42tU3yXD47y4fNlJlWVEmExhkf2g/viewform"
  );
});

chrome.webNavigation.onHistoryStateUpdated.addListener(({ url, tabId }) => {
  if (
    url.includes("https://www.codewars.com/kata/") &&
    url.includes("/train/")
  ) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["scripts/codewars.js"],
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "authenticateUser") {
    chrome.tabs.create({ url: authUrl, active: true });
    chrome.tabs.onUpdated.addListener(onTabUpdate);
  }
});

const checkIfRepoExists = async (repoName) => {
  const { accessToken } = await chrome.storage.local.get(["accessToken"]);
  const url = `https://api.github.com/user/repos`;
  const options = {
    method: "GET",
    headers: new Headers({
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
    }),
  };
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const json = await response.json();
    for (let i = 0; i < json.length; i++) {
      let currentRepoName = json[i]["name"].toLowerCase();
      if (currentRepoName === repoName.toLowerCase()) return true;
    }
    return false;
  } catch (e) {
    console.log("Error checking if repo exists:", e.message);
  }
};

const checkIfRepoAndDirectoryExists = async (repoName, directory) => {
  const { accessToken, githubUsername } = await chrome.storage.local.get([
    "accessToken",
    "githubUsername",
  ]);
  const url = `https://api.github.com/repos/${githubUsername}/${repoName}/contents/${directory}`;
  const options = {
    method: "GET",
    headers: new Headers({
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
    }),
  };
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    return true;
  } catch (e) {
    console.log("Error checking if repo and directory exists:", e.message);
    return false;
  }
};

const createNewRepo = async (repoName) => {
  const { accessToken } = await chrome.storage.local.get(["accessToken"]);
  const url = `https://api.github.com/user/repos`;
  const repoDescription = `A collection of solutions to various Codewars problems! - Created using [CodeHub](https://github.com/FebinBellamy/CodeHub)`;
  const data = { name: repoName, description: repoDescription };
  const options = {
    method: "POST",
    headers: new Headers({
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    }),
    body: JSON.stringify(data),
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const json = await response.json();
    return json["name"];
  } catch (e) {
    console.log("Error creating a new repo or repo/directory:", e.message);
  }
};

const createReadmeInNewRepo = async (repoName, directory) => {
  const { accessToken, githubUsername } = await chrome.storage.local.get([
    "accessToken",
    "githubUsername",
  ]);
  const commitMessage = "Initial commit";
  const url = `https://api.github.com/repos/${githubUsername}/${repoName}/contents${
    directory ? "/" + directory : ""
  }/README.md`;
  const repoDescriptionEncoded = btoa(
    "A collection of solutions to various Codewars problems! - Created using [CodeHub](https://github.com/FebinBellamy/CodeHub)"
  );
  const data = { message: commitMessage, content: repoDescriptionEncoded };
  const options = {
    method: "PUT",
    headers: new Headers({
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
    }),
    body: JSON.stringify(data),
  };
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
  } catch (e) {
    console.log("Error creating a README.md in the new repo:", e.message);
  }
};

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "connectExistingRepo") {
    const { repoName } = request;
    if (repoName.length > 0 && repoName.length <= 100) {
      let repoFound;
      let directoryName = "";
      let finalRepoName;
      let indexOfForwardSlash = repoName.indexOf("/");
      if (indexOfForwardSlash === -1) {
        let sanitizedRepoName = repoName.replace(/[^a-zA-Z0-9\-\/]/g, "-");
        repoFound = await checkIfRepoExists(sanitizedRepoName);
        finalRepoName = sanitizedRepoName;
      } else if (indexOfForwardSlash === 0) {
        chrome.runtime.sendMessage({
          action: "displayErrorMessage",
          issue: "invalidRepoName",
        });
        return;
      } else {
        directoryName = encodeURIComponent(
          repoName.slice(indexOfForwardSlash + 1)
        );
        finalRepoName = repoName
          .slice(0, indexOfForwardSlash)
          .replace(/[^a-zA-Z0-9\-\/]/g, "-");
        repoFound = await checkIfRepoAndDirectoryExists(
          finalRepoName,
          directoryName
        );
      }
      if (!repoFound) {
        chrome.runtime.sendMessage({
          action: "displayErrorMessage",
          issue: "repoNotFound",
        });
        return;
      } else if (repoFound) {
        chrome.storage.local.set({
          repo: finalRepoName,
          directory: directoryName,
          isRepoConnected: true,
        });
        chrome.runtime.sendMessage({ action: "updateUI" });
      }
    } else {
      chrome.runtime.sendMessage({
        action: "displayErrorMessage",
        issue: "repoNameIsTooLongOrTooShort",
      });
      return;
    }
  }
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "createRepo") {
    const { repoName } = request;

    if (repoName.length > 0 && repoName.length <= 100) {
      let repoFound;
      let directoryName = "";
      let finalRepoName;
      let indexOfForwardSlash = repoName.indexOf("/");

      if (indexOfForwardSlash === -1) {
        let sanitizedRepoName = repoName.replace(/[^a-zA-Z0-9\-\/]/g, "-");
        repoFound = await checkIfRepoExists(sanitizedRepoName);
        finalRepoName = sanitizedRepoName;
      } else if (indexOfForwardSlash === 0) {
        chrome.runtime.sendMessage({
          action: "displayErrorMessage",
          issue: "invalidRepoName",
        });
        return;
      } else if (indexOfForwardSlash > 0) {
        let decodedDirectoryName = repoName.slice(indexOfForwardSlash + 1);
        if (decodedDirectoryName[0] === "/") {
          chrome.runtime.sendMessage({
            action: "displayErrorMessage",
            issue: "invalidRepoName",
          });
          return;
        }
        finalRepoName = repoName
          .slice(0, indexOfForwardSlash)
          .replace(/[^a-zA-Z0-9\-\/]/g, "-");

        directoryName = decodedDirectoryName.replace(
          /[^a-zA-Z0-9\-\/]/g,
          encodeURIComponent
        );

        repoFound = await checkIfRepoAndDirectoryExists(
          finalRepoName,
          directoryName
        );
      } else {
        repoFound = await checkIfRepoExists(repoName);
        finalRepoName = repoName;
      }
      if (repoFound) {
        chrome.runtime.sendMessage({
          action: "displayErrorMessage",
          issue: "createAnAlreadyExisitingRepo",
        });
        return;
      } else {
        await createNewRepo(finalRepoName);
        await createReadmeInNewRepo(finalRepoName, directoryName);
        chrome.storage.local.set({
          repo: finalRepoName,
          directory: directoryName,
          isRepoConnected: true,
        });
        chrome.runtime.sendMessage({ action: "updateUI" });
      }
    } else {
      chrome.runtime.sendMessage({
        action: "displayErrorMessage",
        issue: "repoNameIsTooLongOrTooShort",
      });
      return;
    }
  }
});

chrome.runtime.onMessage.addListener(async (request) => {
  if (request.action === "unlinkRepo") {
    console.log("unlinking repo!");
    await chrome.storage.local.remove(["repo"]);
    chrome.storage.local.set({ isRepoConnected: false });
    chrome.runtime.sendMessage({ action: "updateUI" });
  }
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "pushToGithub") {
    const { githubUsername, repo, directory, accessToken } =
      await chrome.storage.local.get([
        "githubUsername",
        "repo",
        "directory",
        "accessToken",
      ]);
    const {
      directoryName,
      languageOfUserSolution,
      userSolution,
      description,
      rank,
    } = request.codewarsData;
    const fileExtension = supportedFileExtensions[languageOfUserSolution];
    const fileName = directoryName + fileExtension;
    const encodedSolution = btoa(unescape(encodeURIComponent(userSolution)));
    const encodedReadMe = btoa(unescape(encodeURIComponent(description)));
    await addReadme(
      githubUsername,
      repo,
      directory,
      rank,
      directoryName,
      encodedReadMe,
      accessToken
    );
    await addOrUpdateSolution(
      githubUsername,
      repo,
      directory,
      rank,
      directoryName,
      fileName,
      encodedSolution,
      accessToken
    );
  }
});
