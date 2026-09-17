/* Service worker + centered Add to Home Screen prompt */
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('./sw.js')
        .then(function (reg) {
          try {
            reg.update();
          } catch (e) {}
        })
        .catch(function (err) {
          console.warn('SW register failed', err);
        });
    });
  }

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
      var until = parseInt(localStorage.getItem(DISMISS_UNTIL_KEY) || '0', 10);
      if (until && Date.now() < until) return true;
    } catch (e) {}
    return false;
  }

  function dismissFor(days) {
    try {
      localStorage.setItem(
        DISMISS_UNTIL_KEY,
        String(Date.now() + (days || 3) * 24 * 60 * 60 * 1000)
      );
    } catch (e) {}
  }

  function removePrompt() {
    var el = document.getElementById('pwaPrompt');
    if (el) el.remove();
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
    overlay.setAttribute('aria-labelledby', 'pwaPromptTitle');

    var ios = isIos();
    var bodyText = ios
      ? 'On iPhone / iPad: tap <strong>Share</strong> → <strong>Add to Home Screen</strong> for faster scores and better live alerts.'
      : 'Install Lex Liga on your home screen for quicker scores and better live match alerts.';

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
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    var installBtn = document.getElementById('pwaPromptInstall');
    if (installBtn) {
      installBtn.onclick = function () {
        if (!deferredPrompt) {
          close();
          return;
        }
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function (choice) {
          deferredPrompt = null;
          if (choice && choice.outcome === 'accepted') {
            try {
              localStorage.removeItem(DISMISS_UNTIL_KEY);
            } catch (e) {}
          } else {
            dismissFor(3);
          }
          removePrompt();
        });
      };
    }
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(showPrompt, 1200);
  });

  setTimeout(function () {
    if (isIos() && !isStandalone()) showPrompt();
  }, 1500);

  setTimeout(function () {
    if (!isStandalone() && !document.getElementById('pwaPrompt') && !isDismissedRecently()) {
      if (deferredPrompt || isIos() || /android/i.test(navigator.userAgent)) {
        showPrompt();
      }
    }
  }, 3500);
})();
