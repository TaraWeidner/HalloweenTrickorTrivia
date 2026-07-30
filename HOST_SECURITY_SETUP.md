# Secure Host Portal Setup

The public player site and private host portal use separate URLs:

- Player game: `https://taraweidner.github.io/HalloweenTrickorTrivia/?room=CARL26#play`
- Private host portal: `https://taraweidner.github.io/HalloweenTrickorTrivia/host.html?room=CARL26`

## One-time activation

1. Keep the current host browser claimed while completing setup.
2. Open Firebase Console → Realtime Database → Rules.
3. Replace the rules with the current contents of `database.rules.json` and publish.
4. Open the private host portal URL on the current host browser.
5. Enter a private host key with at least 12 characters. Do not reuse a personal password.
6. Select **Save Host Key & Open Controls**.
7. Confirm the host controls load and the room still says `CARL26`.
8. After successful testing, activate `public-shell.js` in `questions-live.js` to remove the Host Controls tab from the public game.

## How the protection works

The browser converts the key to a SHA-256 hash. Firebase stores only the hash under a path that players cannot read. A device must prove that it has the matching key before Firebase permits it to claim `hostUid`. The public site can hide the host interface, while the database rules independently block unauthorized writes.

## Recovery

A browser that currently holds the host role may set a new key from the private host portal. If no browser holds the host role and the key is lost, use Firebase Console to remove `rooms/CARL26/hostSecurity/keyHash`, then reopen the host portal to establish a new key.
