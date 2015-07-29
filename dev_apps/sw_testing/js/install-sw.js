navigator.serviceWorker.register('/scope/sw.js', { scope: '/scope/' }).then(undefined, err => alert(err));
