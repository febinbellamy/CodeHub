console.log("scripts/background.js");

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
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "authenticateUser") {
    const accessTokenUrl = "https://github.com/login/oauth/access_token";
    const authorizeUrl = "https://github.com/login/oauth/authorize";
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const redirectUrl = "https://github.com/";
    const scopes = "repo";
    const authUrl = `${authorizeUrl}?client_id=${clientId}&redirect_uri=${redirectUrl}&scope=${scopes}`;
    console.log("authUrl", authUrl);

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
          await chrome.storage.local.set({ accessToken: json["access_token"] });
          console.log("Stored accessToken in Chrome.storage.local!");
        }
      } catch (error) {
        console.log("Error! Unable to get access token", error.message);
      }
    };

    const getGithubUsername = async () => {
      chrome.storage.local.get(["accessToken"], async (result) => {
        const accessToken = result.accessToken;
        console.log("accessToken (getGithubUsername)", accessToken);
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
          console.log("json for githubUsername request:", json);
          const username = json["login"];
          chrome.storage.local.set({ githubUsername: username }, () => {
            console.log(
              `Setting githubUsername in chrome storage to ${username}`
            );
          });
        } catch (e) {
          console.log("Error! Unable to get github username", e.message);
        }
      });
    };

    // open up authURL in a new tab
    chrome.tabs.create({ url: authUrl, active: true });

    const onTabUpdate = async (tabId, changeInfo, tab) => {
      if (tab.url && tab.url.includes("github.com/?code=")) {
        chrome.tabs.onUpdated.removeListener(onTabUpdate);
        const code = tab.url.split("=")[1];
        await getGitHubAccessToken(code);
        await getGithubUsername();
        chrome.storage.local.set({ isUserAuthenticated: true }, () => {
          console.log("Setting isUserAuthenticated to true");
        });

        // Open up welcome.html in a new tab AFTER the user authenticates github account
        chrome.tabs.create({ url: "welcome.html", active: true });

        // Display "Create a new repo or link current repo" section
        // TODO: I may have to reload welcome.html
      }
    };
    chrome.tabs.onUpdated.addListener(onTabUpdate);
  }
});

const checkIfRepoExists = async (repoName) => {
  console.log(`Checking if ${repoName} repo exists!`);
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
    console.log("json for checkIfRepoExists request", json);

    for (let i = 0; i < json.length; i++) {
      let currentRepoName = json[i]["name"];
      if (currentRepoName === repoName.toLowerCase()) return true;
    }
    return false;
  } catch (e) {
    console.log("Error checking if repo exists:", e.message);
  }
};

const createNewRepo = async (repoName) => {
  console.log("Creating new repo!");
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
    const name = json["name"];
    console.log("Name of repo:", name);
    return name;
  } catch (e) {
    console.log("Error creating a new repo:", e.message);
  }
};

const createReadmeInNewRepo = async (repoName) => {
  console.log("Creating a ReadMe in the new repo!");
  const { accessToken, githubUsername } = await chrome.storage.local.get([
    "accessToken",
    "githubUsername",
  ]);
  const commitMessage = "Initial commit";
  const url = `https://api.github.com/repos/${githubUsername}/${repoName}/contents/README.md`;
  console.log("createReadmeInNewRepo fetching for this url =>", url);
  const repoDescriptionEncoded = btoa(
    "A collection of solutions to various Codewars problems! - Created using [CodeHub](https://github.com/FebinBellamy/CodeHub)"
  );
  console.log("repoDescriptionEncoded ->", repoDescriptionEncoded);
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
    console.log("json for createReadmeInNewRepo request", json);
    console.log("Created a ReadMe!");
  } catch (e) {
    console.log("Error creating a ReadMe in the new repo:", e.message);
  }
};

// Link to an existing repo. Include error handling logic (if repo doesn't exist, if fetch request fails, etc.)
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "connectExistingRepo") {
    const { repoName } = request;
    console.log(`Attempting to LINK EXISTING repo ${repoName}`);

    if (repoName.length > 0 && repoName.length <= 100) {
      // get all repos and check if the repo name exists.
      const repoFound = await checkIfRepoExists(repoName);
      console.log("repoFound", repoFound);
      if (!repoFound) {
        console.log(
          `Error: the ${repoName} repository was not found. Please enter a valid repository name.`
        );
      } else if (repoFound) {
        // The repo was found! Link it.
        // add await keyword here
        chrome.storage.local.set(
          { repo: repoName, isRepoConnected: true },
          () => {
            console.log(
              `Setting repo key in storage to ${repoName} and isRepoConnected to true!`
            );
            // next, in welcome.js you should now display the repo link on the page along with an "unlink repository" button
          }
        );
      }
    } else {
      // in welcome.js you should display an error message on the page itself - Missing repo name!
      console.log("Display error ON the page");
      console.log("Error: please enter a valid repository name!");
    }
  }
});

// Create a new GitHub repo and link it. Include error handling logic (if repo doesn't exist, if fetch request fails, etc.)
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "createRepo") {
    const { repoName } = request;
    console.log(`Attempting to CREATE new Repo named ${repoName}`);

    if (repoName.length > 0 && repoName.length <= 100) {
      // check if the repo already exists.
      const repoFound = await checkIfRepoExists(repoName);
      console.log("repoFound", repoFound);

      if (repoFound) {
        // if the repo already exists, display an error message
        // Error creating ${repoName}. Repository may have already been created. Click on the "Select an existing repository" option instead.
        console.log(
          `Error creating ${repoName} - this repository already exists! Click on the "Select an existing repository" option instead.`
        );
      } else if (!repoFound) {
        // The repo doesn't already exist so create it!
        const finalRepoName = await createNewRepo(repoName);
        console.log("finalRepoName: ", finalRepoName);
        await createReadmeInNewRepo(finalRepoName);

        chrome.storage.local.set(
          { repo: finalRepoName, isRepoConnected: true },
          () => {
            console.log(
              `Setting repo key in storage to ${finalRepoName} and isRepoConnected to true!`
            );
            // next, in welcome.js you should now display the repo link on the page along with an "unlink repository" link
          }
        );
      }
    } else {
      // in welcome.js you should display an error message on the page itself. Missing repo name!
      console.log("Display error ON the page");
      console.log("Error: please enter a valid repository name.");
    }
  }
});

// TODO: Implement "unlink a repo" functionality
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "unlinkRepo") {
//   }
// });

// // Push solution received from codewars.js to the user's GitHub repo.
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "pushToGithub") {
    console.log(request.codewarsData);
    const { githubUsername, repo, accessToken } =
      await chrome.storage.local.get(["githubUsername", "repo", "accessToken"]);
    const { directoryName, languageOfUserSolution, userSolution, description } =
      request.codewarsData;
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

    const addSolution = async () => {
      const url = `https://api.github.com/repos/${githubUsername}/${repo}/contents/${directoryName}/${fileName}`;
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
        const json = await response.json();
        console.log("json for pushing solution to GitHub", json);
      } catch (error) {
        console.log(
          "Error pushing codewars solution to GitHub!",
          error.message
        );
      }
    };

    const addReadme = async () => {
      const url = `https://api.github.com/repos/${githubUsername}/${repo}/contents/${directoryName}/README.md`;
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
        const json = await response.json();
        console.log("json for pushing ReadMe to GitHub", json);
      } catch (error) {
        console.log(
          "Error pushing ReadMe for codewars solution to GitHub!",
          error.message
        );
      }
    };
    await addReadme();
    await addSolution();
  }
});
