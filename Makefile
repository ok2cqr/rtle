# Deploy on the web server:  make prod   (run as root)
#
# The version stamp is bumped here rather than in a commit, so no release can
# forget it. That leaves index.html, offline.js and js/app.js modified in the
# working tree afterwards, which is why the pull below is a hard reset - a plain
# `git pull` would refuse with "local changes would be overwritten".
#
# Consequence: anything uncommitted on the server is discarded on every deploy.
# Untracked files are left alone.

REMOTE ?= origin
BRANCH ?= master
OWNER  ?= rtle:sftpusers

# The steps are strictly sequential - never let -j interleave them
.NOTPARALLEL:

.PHONY: prod pull bump own version

prod: pull bump own version

# Take the remote exactly as it is, throwing away the stamp of the last deploy
pull:
	git fetch $(REMOTE) $(BRANCH)
	git reset --hard $(REMOTE)/$(BRANCH)

# A new stamp means a new cache name and new ?v= query strings, which is what
# actually makes browsers pick the release up
bump:
	sh tools/bump-version.sh

# Everything except .git, so the next deploy can still run git as this user
own:
	find . -path ./.git -prune -o -exec chown $(OWNER) {} +

version:
	@sed -n 's/^const VERSION = "\(.*\)";$$/deployed version: \1/p' offline.js
