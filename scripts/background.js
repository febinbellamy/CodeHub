import { clientId, clientSecret } from "../credentials.js";


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
    const accessTokenUrl = "https://github.com/login/oauth/access_token";
    const authorizeUrl = "https://github.com/login/oauth/authorize";
    const redirectUrl = "https://github.com/";
    const scopes = "repo";
    const authUrl = `${authorizeUrl}?client_id=${clientId}&redirect_uri=${redirectUrl}&scope=${scopes}`;
    console.log("authorizeUrl:", authorizeUrl);
    console.log("redirectUrl:", redirectUrl);
    console.log("scopes:", scopes);
    console.log("Final auth URL:", authUrl);
    const getGitHubAccessToken = async (githubCode) => {
      const url = `${accessTokenUrl}?client_id=${clientId}&client_secret=${clientSecret}&code=${githubCode}`;
      const options = {
        method: "POST",
        headers: new Headers({
          Accept: "application/json",
        }),
      };
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        const json = await response.json();
        if (json["access_token"]) {
          chrome.storage.local.set({ accessToken: json["access_token"] });
        }
      } catch (error) {
        console.log("Error! Unable to get access token", error.message);
      }
    };

    const getGithubUsername = async () => {
      chrome.storage.local.get(["accessToken"], async (result) => {
        const accessToken = result.accessToken;
        const url = `https://api.github.com/user`;
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
          const username = json["login"];
          chrome.storage.local.set({ githubUsername: username });
        } catch (e) {
          console.log("Error! Unable to get github username", e.message);
        }
      });
    };

    chrome.tabs.create({ url: authUrl, active: true });

    const onTabUpdate = async (tabId, changeInfo, tab) => {
      if (tab.url && tab.url.includes("github.com/?code=")) {
        chrome.tabs.onUpdated.removeListener(onTabUpdate);
        const code = tab.url.split("=")[1];
        await getGitHubAccessToken(code);
        await getGithubUsername();
        chrome.storage.local.set({ isUserAuthenticated: true });
        chrome.runtime.sendMessage({ action: "updateUI" });
        chrome.tabs.create({ url: "welcome.html", active: true });
      }
    };
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
    console.log("Error creating a new repo:", e.message);
  }
};

const createReadmeInNewRepo = async (repoName) => {
  const { accessToken, githubUsername } = await chrome.storage.local.get([
    "accessToken",
    "githubUsername",
  ]);
  const commitMessage = "Initial commit";
  const url = `https://api.github.com/repos/${githubUsername}/${repoName}/contents/README.md`;
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
    const json = await response.json();
  } catch (e) {
    console.log("Error creating a ReadMe in the new repo:", e.message);
  }
};

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "connectExistingRepo") {
    const { repoName } = request;
    if (repoName.length > 0 && repoName.length <= 100) {
      const repoFound = await checkIfRepoExists(repoName);
      console.log("repoFound ->", repoFound);
      if (!repoFound) {
        chrome.runtime.sendMessage({
          action: "displayErrorMessage",
          issue: "repoNotFound",
        });
      } else if (repoFound) {
        chrome.storage.local.set({ repo: repoName, isRepoConnected: true });
        chrome.runtime.sendMessage({ action: "updateUI" });
      }
    } else {
      chrome.runtime.sendMessage({
        action: "displayErrorMessage",
        issue: "repoNameIsTooLongOrTooShort",
      });
    }
  }
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "createRepo") {
    const { repoName } = request;

    if (repoName.length > 0 && repoName.length <= 100) {
      const repoFound = await checkIfRepoExists(repoName);
      if (repoFound) {
        chrome.runtime.sendMessage({
          action: "displayErrorMessage",
          issue: "createAnAlreadyExisitingRepo",
        });
      } else if (!repoFound) {
        const finalRepoName = await createNewRepo(repoName);
        await createReadmeInNewRepo(finalRepoName);
        chrome.storage.local.set({
          repo: finalRepoName,
          isRepoConnected: true,
        });
        chrome.runtime.sendMessage({ action: "updateUI" });
      }
    } else {
      chrome.runtime.sendMessage({
        action: "displayErrorMessage",
        issue: "repoNameIsTooLongOrTooShort",
      });
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
    const { githubUsername, repo, accessToken } =
      await chrome.storage.local.get(["githubUsername", "repo", "accessToken"]);
    const {
      directoryName,
      languageOfUserSolution,
      userSolution,
      description,
      rank,
    } = request.codewarsData;
    const supportedFileExtensions = {
      agda: ".agda",
      bf: ".bf",
      c: ".c",
      cfml: ".cfm",
      cpp: ".cpp",
      cobol: ".cbl",
      coffeescript: ".coffee",
      clojure: ".clj",
      commonlisp: ".lisp",
      coq: ".v",
      crystal: ".cr",
      csharp: ".cs",
      d: ".d",
      dart: ".dart",
      elixir: ".ex",
      elm: ".elm",
      erlang: ".erl",
      factor: ".factor",
      forth: ".fs",
      fortran: ".f",
      fsharp: ".fs",
      go: ".go",
      groovy: ".groovy",
      haskell: ".hs",
      haxe: ".hs",
      idris: ".idr",
      java: ".java",
      javascript: ".js",
      julia: ".jl",
      kotlin: ".kt",
      lambdacalc: ".lam",
      lean: ".lean",
      lua: ".lua",
      nasm: ".asm",
      nim: ".nim",
      objc: ".m",
      ocaml: ".ml",
      pascal: ".pas",
      perl: ".pl",
      php: ".php",
      powershell: ".ps1",
      prolog: ".pl",
      purescript: ".purs",
      python: ".py",
      r: ".r",
      reason: ".re",
      racket: ".rkt",
      raku: ".raku",
      riscv: ".o",
      ruby: ".rb",
      rust: ".rs",
      scala: ".scala",
      solidity: ".sol",
      shell: ".sh",
      sql: ".sql",
      swift: ".swift",
      typescript: ".ts",
      vb: ".vb",
    };
    const fileExtension = supportedFileExtensions[languageOfUserSolution];
    const fileName = directoryName + fileExtension;
    const encodedSolution = btoa(unescape(encodeURIComponent(userSolution)));
    const encodedReadMe = btoa(unescape(encodeURIComponent(description)));

    const checkFileExists = async (baseUrl) => {
      try {
        const response = await fetch(baseUrl, {
          method: 'GET',
          headers: new Headers({
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${accessToken}`
          })
        });
        return response.ok;
      } catch (error){
        console.log(
          "Error checking for pre-existing file!",
          error.message
        );
      }
    };

    const getNextAvailableFilename = async (basePath, baseFileName, fileExtension) => {
      let counter = 1;
      let exists = await checkFileExists(`https://api.github.com/repos/${githubUsername}/${repo}/contents/${basePath}/${baseFileName}`);
      
      if (!exists){
        return baseFileName;
      }

      while (exists){
        const numbered = baseFileName.replace(fileExtension, `-${counter}${fileExtension}`);
        exists = await checkFileExists(`https://api.github.com/repos/${githubUsername}/${repo}/contents/${basePath}/${numbered}`);
        if (!exists){
          return numbered;
        }
        counter++;
      }
    };

    const addSolution = async () => {
      const basePath = `${rank}/${directoryName}`;
      const newFileName = await getNextAvailableFilename(basePath, fileName, fileExtension);
      const url = `https://api.github.com/repos/${githubUsername}/${repo}/contents/${rank}/${directoryName}/${newFileName}`;
      const data = {
        message: "Add solution - CodeHub",
        content: encodedSolution,
      };
      const options = {
        method: "PUT",
        headers: new Headers({
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        }),
        body: JSON.stringify(data),
      };

      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        console.log(
          `Success! The solution has been pushed to the ${directoryName} directory.`
        );
      } catch (error) {
        console.log(
          "Error pushing codewars solution to GitHub!",
          error.message
        );
      }
    };

    const addReadme = async () => {
      const url = `https://api.github.com/repos/${githubUsername}/${repo}/contents/${rank}/${directoryName}/README.md`;
      const data = {
        message: "Add README.md - CodeHub",
        content: encodedReadMe,
      };
      const options = {
        method: "PUT",
        headers: new Headers({
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        }),
        body: JSON.stringify(data),
      };
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        console.log(
          `Success! The README has been added to the ${directoryName} directory.`
        );
      } catch (error) {
        console.log(
          "Error pushing README for codewars solution to GitHub!",
          error.message
        );
      }
    };
    await addReadme();
    await addSolution();
  }
});
