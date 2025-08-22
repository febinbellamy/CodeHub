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
      folderStructure: "level-problem-language",
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

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "authenticateUser") {
    chrome.tabs.create({ url: authUrl, active: true });
    chrome.tabs.onUpdated.addListener(onTabUpdate);
  }

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
        issue: "invalidRepoOrDirectoryName",
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

  if (request.action === "createRepo") {
    const { userInput } = request;
    if (userInput.length === 0 || userInput.length > 100) {
      chrome.runtime.sendMessage({
        action: "displayErrorMessage",
        issue: "repoNameIsTooLongOrTooShort",
      });
      return;
    }
    const indexOfForwardSlash = userInput.indexOf("/");
    const indexOfDoubleForwardSlash = userInput.indexOf("//");
    if (indexOfForwardSlash === 0 || indexOfDoubleForwardSlash >= 0) {
      chrome.runtime.sendMessage({
        action: "displayErrorMessage",
        issue: "invalidRepoOrDirectoryName",
      });
      return;
    }
    const { repoName, directoryName } = extractRepoNameAndDirectoryName(
      userInput,
      indexOfForwardSlash
    );
    const repoFound = await checkIfRepoExists(repoName);
    if (directoryName === "") {
      if (repoFound) {
        chrome.runtime.sendMessage({
          action: "displayErrorMessage",
          issue: "createAnAlreadyExisitingRepo",
        });
        return;
      }
      await createNewRepo(repoName);
      await createReadmeAndDirectory(repoName, directoryName);
    } else if (directoryName !== "") {
      const repoAndDirectoryFound = await checkIfRepoAndDirectoryExists(
        repoName,
        directoryName
      );
      if (repoAndDirectoryFound) {
        chrome.runtime.sendMessage({
          action: "displayErrorMessage",
          issue: "repoAndDirectoryAlreadyExists",
        });
        return;
      }
      if (!repoFound) {
        await createNewRepo(repoName);
      }
      await createReadmeAndDirectory(repoName, directoryName);
    }
    chrome.storage.local.set({
      repo: repoName,
      directory: directoryName,
      isRepoConnected: true,
    });
    chrome.runtime.sendMessage({ action: "updateUI" });
  }

  if (request.action === "unlinkRepo") {
    await chrome.storage.local.remove(["repo"]);
    chrome.storage.local.set({ isRepoConnected: false });
    chrome.runtime.sendMessage({ action: "updateUI" });
  }

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
      languageOfUserSolution,
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
      languageOfUserSolution,
      encodedSolution,
      accessToken
    );
  }
});
