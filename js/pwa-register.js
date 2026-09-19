/* Lex Liga – Service Worker + Add to Home Screen prompt */

(function () {

  /* -----------------------------
     SERVICE WORKER
  ----------------------------- */

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('./sw.js')
        .then(function (registration) {

          try {
            registration.update();
          } catch (e) {}

        })
        .catch(function (error) {
          console.warn('Service worker registration failed:', error);
        });
    });
  }


  /* -----------------------------
     INSTALL PROMPT
  ----------------------------- */

  var DISMISS_UNTIL_KEY = 'lexPwaDismissUntil';

  var deferredPrompt = null;


  function isIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }


  function isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.indexOf('android-app://') === 0
    );
  }


  function isDismissedRecently() {
    try {
      var until = parseInt(
        localStorage.getItem(DISMISS_UNTIL_KEY) || '0',
        10
      );

      return until && Date.now() < until;

    } catch (e) {
      return false;
    }
  }


  function dismissFor(days) {
    try {
      localStorage.setItem(
        DISMISS_UNTIL_KEY,
        String(
          Date.now() +
          (days || 3) * 24 * 60 * 60 * 1000
        )
      );
    } catch (e) {}
  }


  function removePrompt() {
    var element = document.getElementById('pwaPrompt');

    if (element) {
      element.remove();
    }
  }


  function showPrompt() {

    if (isStandalone()) return;

    if (isDismissedRecently()) return;

    if (document.getElementById('pwaPrompt')) return;


    var overlay = document.createElement('div');

    overlay.id = 'pwaPrompt';
    overlay.className = 'pwa-prompt-overlay';

    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute(
      'aria-labelledby',
      'pwaPromptTitle'
    );


    var ios = isIos();


    var bodyText = ios

      ? 'On iPhone / iPad: tap <strong>Share</strong> → <strong>Add to Home Screen</strong> for faster scores and easier access.'

      : 'Install Lex Liga on your home screen for quicker access to live scores and match updates.';


    var actions = ios

      ? '<button type="button" class="pwa-prompt-secondary" id="pwaPromptClose">Got it</button>'

      : '<button type="button" class="pwa-prompt-secondary" id="pwaPromptClose">Not now</button>' +
        '<button type="button" class="pwa-prompt-primary" id="pwaPromptInstall">Install</button>';


    overlay.innerHTML =
      '<div class="pwa-prompt-card">' +

      '<button type="button" class="pwa-prompt-x" id="pwaPromptX" aria-label="Close">✕</button>' +

      '<div class="pwa-prompt-icon" aria-hidden="true">📱</div>' +

      '<h2 id="pwaPromptTitle">Add Lex Liga to Home Screen</h2>' +

      '<p class="pwa-prompt-body">' +
      bodyText +
      '</p>' +

      '<div class="pwa-prompt-actions">' +
      actions +
      '</div>' +

      '</div>';


    document.body.appendChild(overlay);


    function close() {
      dismissFor(3);
      removePrompt();
    }


    document.getElementById('pwaPromptX').onclick = close;

    document.getElementById('pwaPromptClose').onclick = close;


    overlay.addEventListener('click', function (event) {

      if (event.target === overlay) {
        close();
      }

    });


    var installButton =
      document.getElementById('pwaPromptInstall');


    if (installButton) {

      installButton.onclick = function () {

        if (!deferredPrompt) {
          close();
          return;
        }


        deferredPrompt.prompt();


        deferredPrompt.userChoice
          .then(function (choice) {

            deferredPrompt = null;


            if (
              choice &&
              choice.outcome === 'accepted'
            ) {

              try {
                localStorage.removeItem(
                  DISMISS_UNTIL_KEY
                );
              } catch (e) {}

            } else {

              dismissFor(3);

            }


            removePrompt();

          })
          .catch(function () {
            deferredPrompt = null;
            removePrompt();
          });

      };

    }

  }


  /* -----------------------------
     ANDROID / CHROME INSTALL EVENT
  ----------------------------- */

  window.addEventListener(
    'beforeinstallprompt',
    function (event) {

      event.preventDefault();

      deferredPrompt = event;

      setTimeout(function () {
        showPrompt();
      }, 1200);

    }
  );


  /* -----------------------------
     INSTALLED EVENT
  ----------------------------- */

  window.addEventListener(
    'appinstalled',
    function () {

      deferredPrompt = null;

      try {
        localStorage.removeItem(
          DISMISS_UNTIL_KEY
        );
      } catch (e) {}

      removePrompt();

    }
  );


  /* -----------------------------
     iOS INSTRUCTIONS
  ----------------------------- */

  setTimeout(function () {

    if (
      isIos() &&
      !isStandalone()
    ) {
      showPrompt();
    }

  }, 1500);

})();
