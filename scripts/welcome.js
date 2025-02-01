document.addEventListener('DOMContentLoaded', () => {
  const progressBar = document.querySelector('.loader-progress');
  const loaderContainer = document.querySelector('.loader-container');
  setTimeout(() => {
    progressBar.style.width = '100%';
  }, 50);
  setTimeout(() => {
    loaderContainer.style.display = 'none';
  }, 1500);

  const menuLinks = document.querySelectorAll('.header-menu-link');
  menuLinks.forEach(link => {
    link.addEventListener('click', e => {
      menuLinks.forEach(link => link.classList.remove('is-current'));
      e.target.classList.add('is-current');
    });
  });

  const authButton = document.querySelector('#authenticate-btn');
  const authRequestSection = document.querySelector('#authenticate-request');
  const getStartedButton = document.querySelector('#get-started-btn');
  const linkRepoRequestSection = document.querySelector('#link-repo-request');
  const repoConnectedSection = document.querySelector('#repo-connected');
  const aTagForRepoUrl = document.querySelector('#repo-url');
  const aTagforUnlinkRepo = document.querySelector('#unlink-repo');

  authButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'authenticateUser' });
  });

  aTagforUnlinkRepo.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'unlinkRepo' });
  });

  getStartedButton.addEventListener('click', () => {
    const selectedOption = document.querySelector('#repo-options').value;
    const repoName = document
      .querySelector('#repo-name')
      .value.trim()
      .replaceAll(' ', '-');
    if (selectedOption === 'existing-repo') {
      chrome.runtime.sendMessage({
        action: 'connectExistingRepo',
        repoName: repoName,
      });
    } else if (selectedOption === 'new-repo') {
      chrome.runtime.sendMessage({ action: 'createRepo', repoName: repoName });
    }
  });

  const updateUI = () => {
    chrome.storage.local.get(
      ['isUserAuthenticated', 'isRepoConnected', 'githubUsername', 'repo'],
      result => {
        const { isUserAuthenticated, isRepoConnected, githubUsername, repo } =
          result;

        const repoOptions = document.querySelector('#repo-options');
        const repoNameInput = document.querySelector('#repo-name');

        if (!isUserAuthenticated && !isRepoConnected) {
          repoConnectedSection.style.display = 'none';
          linkRepoRequestSection.style.display = 'none';
          authRequestSection.style.display = 'block';

          repoOptions.disabled = true;
          repoNameInput.disabled = true;
        } else if (isUserAuthenticated && !isRepoConnected) {
          authRequestSection.style.display = 'none';
          repoConnectedSection.style.display = 'none';
          linkRepoRequestSection.style.display = 'block';

          repoOptions.disabled = false;
          repoNameInput.disabled = false;
        } else if (isUserAuthenticated && isRepoConnected) {
          authRequestSection.style.display = 'none';
          linkRepoRequestSection.style.display = 'none';
          repoConnectedSection.style.display = 'block';

          aTagForRepoUrl.innerHTML = `${githubUsername}/${repo}`;
          aTagForRepoUrl.href = `https://github.com/${githubUsername}/${repo}`;
        }
      }
    );
  };

  const displayErrorMessage = msg => {
    let errorMessage;

    const repoName = document.querySelector('#repo-name').value;
    if (msg.issue === 'repoNotFound') {
      errorMessage = `Error: the ${repoName} repository was not found. Please enter a valid repository name.`;
    } else if (msg.issue === 'createAnAlreadyExisitingRepo') {
      errorMessage = `Error: the ${repoName} repository already exists. Please choose the "Select an existing repository" option.`;
    } else if (msg.issue === 'repoNameIsTooLongOrTooShort') {
      errorMessage = `Error: please enter a valid repository name that is between 1 and 100 characters long.`;
    } else {
      errorMessage = `Error: please enter a valid repository name.`;
    }

    if (linkRepoRequestSection.children[0].tagName === 'P') {
      linkRepoRequestSection.children[0].innerText = errorMessage;
    } else {
      const pTag = document.createElement('p');
      pTag.innerText = errorMessage;
      pTag.style.color = 'red';
      linkRepoRequestSection.prepend(pTag);
    }
  };

  chrome.runtime.onMessage.addListener(message => {
    if (message.action === 'updateUI') {
      updateUI();
    } else if (message.action === 'displayErrorMessage') {
      displayErrorMessage(message);
    }
  });

  updateUI();
});
