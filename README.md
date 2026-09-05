# RTLE - Real-time log entry

**Real-time log entry** - a tool to enter QSO from your SOTA/BOTA/POTA/TOTA/GMA/WWFF activations in real-time and create the ADIF file - everything just in your browser.

## Working application is available on **[rtle.ok2cqr.com](https://rtle.ok2cqr.com)**

Written in HTML/Javascript by [Petr, OK2CQR](https://www.ok2cqr.com).

If you find any bug or have a suggestion on how to improve the website, please let me know at [petr@ok2cqr.com](mailto:petr@ok2cqr.com).
I&nbsp;get many emails every day, if you don't get a reply in a few days, don't hesitate to send your email again.

## Deployment

Copying the files to the server is not enough on its own any more. RTLE is a PWA:
the service worker in `offline.js` keeps the whole app in the browser cache so it
keeps working without a connection, and a browser only picks up a new release
when the **version stamp** changes.

The stamp is a `YYYYMMDDHHMM` timestamp living in three files - the cache name in
`offline.js`, the `?v=` query strings in `index.html`, and `APP_VERSION` in
`js/app.js` (which also ends up in the ADIF export header, so it has to stay
exactly 12 characters long). `tools/bump-version.sh` rewrites all of them at
once:

```sh
sh tools/bump-version.sh                # stamp with the current time
sh tools/bump-version.sh 202601011200   # or an explicit one
```

Forgetting to bump means the release reaches nobody - every browser keeps
serving the version it already has cached.

### On the server

```sh
make deploy
```

That fetches the branch, hard-resets the working tree to it, bumps the stamp and
gives the files to the web user. Defaults can be overridden:

```sh
make deploy BRANCH=main OWNER=www-data:www-data SUDO=
```

The bump edits tracked files, so the working tree on the server is always dirty
and a plain `git pull` would refuse to run - hence the hard reset. It also means
**anything uncommitted on the server is discarded** on every deploy.

### By hand

Copy the files as before and run `sh tools/bump-version.sh` afterwards, either on
the server or locally before copying. `.htaccess` belongs on the server too - it
is what keeps `index.html` and `offline.js` revalidating on every request instead
of being cached by the browser on their own.

### How an update reaches an open page

The new worker takes over as soon as it is installed. If the QSO field is empty
the page refreshes itself; if something is typed there, or a dialog is open, a
"new version available" bar appears instead so no callsign is lost mid-pileup.
