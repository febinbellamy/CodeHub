import { authUrl, onTabUpdate } from "./authenticateGithub.js";
import {
  supportedFileExtensions,
  addOrUpdateSolution,
  addReadme,
} from "./codewarsToGithub.js";
import {
  createNewRepo,
  createReadmeAndDirectory,
} from "./createRepoAndReadme.js";
import {
  checkIfRepoExists,
  checkIfRepoAndDirectoryExists,
  extractRepoNameAndDirectoryName,
} from "./helperFunctions.js";

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

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "connectExistingRepo") {
    const { userInput } = request;
    if (userInput.length === 0 || userInput.length > 100) {
      chrome.runtime.sendMessage({
        action: "displayErrorMessage",
        issue: "repoNameIsTooLongOrTooShort",
      });
      return;
    }
    const indexOfForwardSlash = userInput.indexOf("/");
    if (indexOfForwardSlash === 0) {
      chrome.runtime.sendMessage({
        action: "displayErrorMessage",
        issue: "invalidRepoName",
      });
      return;
    }
    const { repoName, directoryName } = extractRepoNameAndDirectoryName(
      userInput,
      indexOfForwardSlash
    );
    if (directoryName === "") {
      const repoFound = await checkIfRepoExists(repoName);
      if (!repoFound) {
        chrome.runtime.sendMessage({
          action: "displayErrorMessage",
          issue: "repoNotFound",
        });
        return;
      }
    } else if (directoryName !== "") {
      const repoAndDirectoryFound = await checkIfRepoAndDirectoryExists(
        repoName,
        directoryName
      );
      if (!repoAndDirectoryFound) {
        chrome.runtime.sendMessage({
          action: "displayErrorMessage",
          issue: "repoAndDirectoryNotFound",
        });
        return;
      }
    }
    chrome.storage.local.set({
      repo: repoName,
      directory: directoryName,
      isRepoConnected: true,
    });
    chrome.runtime.sendMessage({ action: "updateUI" });
  }
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "createRepo") {
    const { userInput } = request;

    if (userInput.length > 0 && userInput.length <= 100) {
      let repoFound;
      let directoryName = "";
      let finalRepoName;
      let indexOfForwardSlash = userInput.indexOf("/");

      if (indexOfForwardSlash === -1) {
        let sanitizedRepoName = userInput.replace(/[^a-zA-Z0-9\-\/]/g, "-");
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

        await createReadmeAndDirectory(finalRepoName, directoryName);
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
