console.log("codewars script injected!");
setTimeout(() => {
  const data = {};
  const submitButton = document.querySelector("#submit_btn");

  // The description of the problem and the difficulty level (via the CodeWars API - https://dev.codewars.com/#code-challenges-api
  const getDescriptionAndRank = async () => {
    const url = window.location.href;
    const startingIndexOfId = 30;
    const endingIndexOfId = url.indexOf("/train/");
    const problemId = url.slice(startingIndexOfId, endingIndexOfId);
    try {
      const res = await fetch(
        `https://www.codewars.com/api/v1/code-challenges/${problemId}`
      );
      const json = await res.json();
      data["description"] = json["description"];
      data["rank"] = json["rank"]["name"]; // 6-kyu, 5-kyu, etc.
      data["fileAndDirectoryName"] = json["slug"];
      data["name"] = json["name"];
    } catch (e) {
      console.log("Error! Unable to get description and rank: ", e);
    }
  };

  const getUserSolution = () => {
    const userCodeBeforeParsing =
      document.querySelectorAll(".CodeMirror-lines")[0].innerText;
    const userCodeArr = userCodeBeforeParsing.split("\n");
    let result = "";

    for (let i = 0; i < userCodeArr.length; i++) {
      let elem = userCodeArr[i];
      if (/[^0-9]/.test(elem)) {
        result += elem;
        if (i !== userCodeArr.length - 1) {
          result += "\n";
        }
      }
    }
    data["userSolution"] = result;
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
    await getDescriptionAndRank();
    data["languageOfUserSolution"] = document
      .querySelector(".mr-4")
      .innerText.trimLeft();
    getUserSolution();

    chrome.runtime.sendMessage({ codewarsData: data });
  };

  submitButton.addEventListener("click", getData);
}, 3000);
