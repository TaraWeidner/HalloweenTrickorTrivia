# Firebase Setup — Trick or Trivia

The game code is Firebase-ready. Complete these console steps once to turn the local prototype into a synchronized online room.

## 1. Create the project

1. Open the Firebase Console.
2. Create a project named something like `Halloween Trick or Trivia`.
3. Google Analytics is optional for this game.
4. Register a **Web app** inside the project.
5. Copy the Firebase configuration object shown after registration.

## 2. Add the web configuration

Open `firebase-config.js` and replace every `PASTE_...` placeholder with the matching value from the Firebase configuration object.

The Firebase web configuration identifies the project. Access is protected by Authentication and Realtime Database Security Rules. Never place the home address in this file.

## 3. Enable Anonymous Authentication

1. In Firebase, open **Authentication**.
2. Open **Sign-in method**.
3. Enable **Anonymous** sign-in.

Each browser receives a temporary user ID. This lets the rules distinguish the host and each player without requiring players to create accounts.

## 4. Create Realtime Database

1. Open **Realtime Database**.
2. Create the database.
3. Start in locked mode.
4. Open the **Rules** tab.
5. Replace the rules with the contents of `database.rules.json`.
6. Publish the rules.

## 5. Publish the configuration

Commit the updated `firebase-config.js` to the branch used by GitHub Pages. Reload the game page with a hard refresh.

The connection badge should change from **Firebase setup needed** to **Live room CARL26**.

## 6. Claim the host device

1. Open the game on the device that will control the test.
2. Select **Host Controls**.
3. Click **Claim Host Controls** before sharing the link.
4. Keep that browser open during the test.

The first authenticated device to claim an empty room becomes its host. Only that device can launch questions, reveal answers, change scores, clear players, or access the private address field.

## 7. Join from player phones

Open the same GitHub Pages URL on each phone. The room code defaults to `CARL26`. Players enter a name or team name and select **Enter the Game**.

Questions launched by the host should appear automatically on connected phones. Players choose an answer, and the host can reveal and score all correct entries.

## Address privacy

- The address is stored under the host-only `private` database path.
- The public address field is deleted whenever **Show event address** is off.
- Do not add the address to `firebase-config.js`, HTML, JavaScript, README files, or the public repository.

## Host recovery during testing

The active host can click **Release Host** before moving controls to another browser. If the original anonymous host identity is lost before release, delete `rooms/CARL26/hostUid` manually in Realtime Database, then claim the room again.
