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
    console.log("Repo doesn't exist! Returning false");
    return false;
  } catch (e) {
    console.log("Error checking if repo exists:", e.message);
  }
};

const checkIfRepoAndDirectoryExists = async (repoName, directory) => {
  console.log("checking if repo and directory exists!!");
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
    console.log("repoAndDirectory exists!");
    return true;
  } catch (e) {
    console.log("Error checking if repo and directory exists:", e);
    return false;
  }
};

export { checkIfRepoExists, checkIfRepoAndDirectoryExists };
