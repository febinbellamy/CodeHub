console.log("hello from welcome.js!");

const authButton = document.querySelector("#authenticate-btn");
const authRequestSection = document.querySelector("#authenticate-request");
const getStartedButton = document.querySelector("#get-started-btn");
const linkRepoRequestSection = document.querySelector("#link-repo-request");
const repoConnectedSection = document.querySelector("#repo-connected");

authButton.addEventListener("click", () => {
  console.log("Authenticate button clicked!");
  // Send message to background.js to kickstart the authentication process
  chrome.runtime.sendMessage({ action: "authenticateUser" });
});

getStartedButton.addEventListener("click", () => {
  console.log("getStartedButton clicked!");
  console.log(
    "attempting to link an existing repo OR create a new repo"
  );
});

chrome.storage.local.set({
  isUserAuthenticated: false,
  isRepoConnected: false,
});

chrome.storage.local.get(
  ["isUserAuthenticated", "isRepoConnected"],
  (result) => {
    const { isUserAuthenticated, isRepoConnected } = result;

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
    }
  }
);
