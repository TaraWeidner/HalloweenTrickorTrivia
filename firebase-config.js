// Firebase web configuration for Trick or Trivia.
// The Firebase config identifies the project; access is protected by
// Authentication and Realtime Database Security Rules, not by hiding these values.
export const firebaseConfig = {
  apiKey: "PASTE_FIREBASE_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://PASTE_DATABASE_NAME.REGION.firebasedatabase.app",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "PASTE_MESSAGING_SENDER_ID",
  appId: "PASTE_FIREBASE_APP_ID"
};

export const DEFAULT_ROOM_CODE = "CARL26";

export const firebaseConfigured = !Object.values(firebaseConfig).some(value =>
  typeof value !== "string" || value.includes("PASTE_")
);
