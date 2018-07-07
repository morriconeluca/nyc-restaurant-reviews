((d, n) => {
'use strict';

// Create useful alias of native createElement function.
d.cE = d.createElement;

/**
 * Catch DOMContentLoaded event even the script is loading asynchronously.
 */
function onReady(callback) {
  d.readyState !== 'loading' ? callback() : d.addEventListener('DOMContentLoaded', function ifDOMLoaded() {
    callback();
    d.removeEventListener('DOMContentLoaded', ifDOMLoaded);
  });
}

onReady(() => {
  /**
   * Register and handle the Service Worker.
   */
  (() => {
    // Check if Service Worker is supported.
    if (!n.serviceWorker) {
      console.log('Service Worker not supported');
      return; // Exit from function.
    }
    n.serviceWorker.register('/sw.js')
      .then(reg => {
        // Exit if the current page wasn't loaded via a SW.
        if (!n.serviceWorker.controller) return;
        // Listening messages from SW.
        n.serviceWorker.addEventListener('message', event => {
          /* When client receives the 'refreshed' message, the boolean flag 'dismissed', which is in the session storage of this client, will be deleted. N.B. The new SW sends this message to all clients. Look at sw.js to inspect. */
          if (event.data.action === 'refreshed') {
            sessionStorage.removeItem('dismissed');
          }
          /* When client receives the 'dismissed' message, the boolean flag 'dismissed', which is in the session storage of this client, will be set to true. N.B. The current SW sends this message to all clients. Look at sw.js to inspect. */
          if (event.data.action === 'dismissed') {
            sessionStorage.setItem('dismissed', true);
          }
        });
        /* Exit if the update of SW was dismissed in this session previously. */
        if (sessionStorage.dismissed) return;
        // If there's an updated worker already waiting.
        if (reg.waiting) {
          SWUpdateAlert(reg.waiting);
          return;
        }
        // If there's an updated worker installing.
        if (reg.installing) {
          // If one arrives, track its progress.
          trackProgressOf(reg.installing);
          return;
        }
        // Otherwise, listen for new installing worker arriving.
        reg.addEventListener('updatefound', () => {
          // If one arrives, track its progress.
          trackProgressOf(reg.installing);
        });
      })
      .catch(error => {
        console.log('[SW] Registration failed, error:', error);
      });

      /**
       * Set, show and handle SW update alert.
       */
      function SWUpdateAlert(worker) {
        trackControllerChange();
        // Set SW update alert.
        const div = d.cE('div'),
              notice = d.cE('p'),
              buttons = d.cE('p'),
              refresh = d.cE('button'),
              dismiss = d.cE('button');

        div.id = 'update-alert';
        div.setAttribute('role', 'alert');

        notice.innerHTML = 'New version available.';

        buttons.className = 'no-wrap';

        refresh.type = 'button';
        refresh.innerHTML = 'REFRESH';

        dismiss.type = 'button';
        dismiss.innerHTML = 'DISMISS';

        buttons.append(refresh, dismiss);
        div.append(notice, buttons);
        d.body.appendChild(div);

        // Set a timeout to make animation visible.
        setTimeout(() => {
          div.className = 'open';
          /* 1. Set a timeout to listen the alert text in right order with screen readers. 2. On load, sometimes Google Maps grabs the focus, a timeout fixes this behaviour. */
          setTimeout(() => {
            refresh.focus(); // Move focus to the refresh button.
            /* Dismiss, hide and remove the alert after 7 sec. The alert will be showed again on load of a next page, because the user did not answer expressally. */
            setTimeout(() => {
              if (!sessionStorage.dismissed) hideAlert(div);
            },5000);
          },300);
        },1000);

        /* When refresh button is clicked, the client sends a message to the new SW that is waiting. */
        refresh.addEventListener('click', () => {
          worker.postMessage({action: 'refresh'});
        });

        /* When dismiss button is clicked, the client sends a message to the current SW that actually is active yet. */
        dismiss.addEventListener('click', () => {
          n.serviceWorker.controller.postMessage({action: 'dismiss'});
          hideAlert(div); // Dismiss, hide and remove the alert.
        });
      }

      /**
       * Track the progress of new SW.
       */
      function trackProgressOf(worker) {
        worker.addEventListener('statechange', function() {
          if (this.state == 'installed') {
            SWUpdateAlert(this);
          }
        });
      }

      /**
       * Track change of controller and reload when new SW is activated.
       */
      function trackControllerChange() {
        /* Ensure refresh is only called once. This works around a bug in "force update on reload". */
        let refreshing;
        n.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          location.reload(true);
          refreshing = true;
        });
      }

      /**
       * Dismiss, hide and remove the alert.
       */
      function hideAlert(panel) {
        panel.classList.remove('open');
        d.body.focus(); // Move focus to the body.
        setTimeout(() => {
          panel.remove();
        }, 300);
      }
  })();
});
})(document, navigator);
