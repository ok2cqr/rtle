#!/bin/sh
# Stamps a fresh release version into index.html and offline.js.
# Run it before every deploy - the version drives both the ?v= query strings and
# the service worker cache name, so a bump is what pushes a new build to users.
#
# Usage: tools/bump-version.sh [YYYYMMDDHHMM]

set -eu

cd "$(dirname "$0")/.."

old="$(sed -n 's/^const VERSION = "\(.*\)";$/\1/p' offline.js)"
if [ -z "$old" ]; then
    echo "cannot read the current version from offline.js" >&2
    exit 1
fi

# Local time, matching the stamps used by earlier releases
new="${1:-$(date +%Y%m%d%H%M)}"
if [ "$old" = "$new" ]; then
    echo "version is already $new, nothing to do"
    exit 0
fi

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

# js/app.js carries the stamp in the ADIF <PROGRAMVERSION> header
for file in index.html offline.js js/app.js; do
    # sed -i is spelled differently on BSD and GNU, and this runs on both.
    # Redirecting back into the original file also preserves its owner and mode.
    LC_ALL=C sed "s/$old/$new/g" "$file" > "$tmp"
    cat "$tmp" > "$file"
done

echo "$old -> $new"
grep -n "$new" index.html offline.js js/app.js
