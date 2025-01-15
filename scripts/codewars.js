chrome.storage.local.get(["isRepoConnected"], (result) => {
  const { isRepoConnected } = result;
  if (isRepoConnected) {
    setTimeout(() => {
      const data = {};
      const submitButton = document.querySelector("#submit_btn");

      const getChallengeInfo = async () => {
        const url = window.location.href;
        const startingIndexOfId = 30;
        const endingIndexOfId = url.indexOf("/train/");
        const problemId = url.slice(startingIndexOfId, endingIndexOfId);
        try {
          const response = await fetch(
            `https://www.codewars.com/api/v1/code-challenges/${problemId}`
          );
          if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
          }
          const json = await response.json();
          const nameOfChallenge = json["name"];
          const rank = json["rank"]["name"][0];
          const descriptionHeader = `<h2><a href=${url} target="_blank">${nameOfChallenge}</a></h2><h3>${rank} kyu</h3>`;
          const descriptionBeforeParsing =
            document.querySelector("#description").innerHTML;
          const parsedDescription = descriptionBeforeParsing.replace(/\n/g, "");
          data["rank"] = `${rank}-kyu`;
          data["name"] = nameOfChallenge;
          data["description"] = `${descriptionHeader}${parsedDescription}`;
          data["directoryName"] = json["slug"];
        } catch (e) {
          console.log("Error! Unable to get description and rank: ", e);
        }
      };

      const getUserSolution = () => {
        const userCodeBeforeParsing =
          document.querySelectorAll(".CodeMirror-lines")[0].innerText;
        const userCodeArr = userCodeBeforeParsing.split("\n");
        let parsedUserSolution = "";

        for (let i = 0; i < userCodeArr.length; i++) {
          let elem = userCodeArr[i];
          if (/[^0-9]/.test(elem)) {
            parsedUserSolution += elem;
            if (i !== userCodeArr.length - 1) {
              parsedUserSolution += "\n";
            }
          }
        }
        data["userSolution"] = parsedUserSolution;
      };

      const interceptRedirection = () => {
        const originalPushState = history.pushState;
        history.pushState = function () {
          setTimeout(() => {
            originalPushState.apply(history, arguments);
          }, 2000);
        };
      };

      const getData = async () => {
        interceptRedirection();
        await getChallengeInfo();
        data["languageOfUserSolution"] = document
          .querySelector(".mr-4")
          .innerText.trimLeft()
          .toLowerCase();
        getUserSolution();
        chrome.runtime.sendMessage({
          codewarsData: data,
          action: "pushToGithub",
        });
      };

      submitButton.addEventListener("click", getData);
      document.addEventListener("keydown", (event) => {
        const isCmdOrCtrlKeyPressed = event.ctrlKey || event.metaKey;
        const isEnterKeyPressed = event.key === "Enter";
        if (
          isCmdOrCtrlKeyPressed &&
          isEnterKeyPressed &&
          !submitButton.classList.contains("is-hidden")
        ) {
          submitButton.click();
        }
      });
    }, 3000);
  }
});
