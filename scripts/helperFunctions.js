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
      console.log(
        `GitHub API error: ${response.status} - ${response.statusText}`
      );
      return false;
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
    if (response.status === 404) {
      console.log("Repo and directory path does not exist!");
      return false;
    }
    if (!response.ok) {
      console.log(
        `GitHub API error: ${response.status} - ${response.statusText}`
      );
      return false;
    }
    return true;
  } catch (e) {
    console.log("Error checking if repo and directory exists:", e);
    return false;
  }
};

const sanitizeRepoName = (name) => {
  return name.replace(/[^a-zA-Z0-9\-\/]/g, "-");
};

const extractRepoNameAndDirectoryName = (input, idxOfForwardSlash) => {
  let repoName = "";
  let directoryName = "";

  if (idxOfForwardSlash === -1) {
    repoName = sanitizeRepoName(input);
  } else {
    repoName = sanitizeRepoName(input.slice(0, idxOfForwardSlash));
    directoryName = encodeURIComponent(input.slice(idxOfForwardSlash + 1));
  }
  return { repoName, directoryName };
};

const toggleVisibility = (section, visible) => {
  section.style.display = visible ? "block" : "none";
  section.style.visibility = visible ? "visible" : "hidden";
};

const updateUI = (
  authRequestSection,
  linkRepoRequestSection,
  repoConnectedSection,
  aTagForRepoUrl
) => {
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
        aTagForRepoUrl.href = `https://github.com/${githubUsername}/${repo}${
          directory ? "/tree/main/" + directory : ""
        }`;
        aTagForRepoUrl.target = "_blank";
      }
    }
  );
};

export {
  checkIfRepoExists,
  checkIfRepoAndDirectoryExists,
  extractRepoNameAndDirectoryName,
  toggleVisibility,
  updateUI,
};
