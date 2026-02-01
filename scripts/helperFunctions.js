const getNextPageUrlFromLinkHeader = (linkHeader) => {
  if (!linkHeader) return null;
  const parts = linkHeader.split(",");
  for (const part of parts) {
    const match = part.trim().match(/<([^>]+)>;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
};

const checkIfRepoExists = async (repoName) => {
  const { accessToken } = await chrome.storage.local.get(["accessToken"]);
  const options = {
    method: "GET",
    headers: new Headers({
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
    }),
  };
  try {
    let url = `https://api.github.com/user/repos?per_page=100&page=1`;
    while (url) {
      const response = await fetch(url, options);
      if (!response.ok) {
        console.log(
          `GitHub API error: ${response.status} - ${response.statusText}`
        );
        return false;
      }
      const json = await response.json();
      if (json.some((repo) => repo.name.toLowerCase() === repoName.toLowerCase())) {
        return true;
      }
      url = getNextPageUrlFromLinkHeader(response.headers.get("Link"));
    }
    return false;
  } catch (e) {
    console.log("Error checking if repo exists:", e.message);
    return false;
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
