// Firebase web configuration for Trick or Trivia.
// The Firebase config identifies the project; access is protected by
// Authentication and Realtime Database Security Rules, not by hiding these values.
export const firebaseConfig = {
  apiKey: "PASTE_FIREBASE_API_KEY",
  authDomain: "halloween-trick-or-trivia.firebaseapp.com",
  databaseURL: "https://halloween-trick-or-trivia-default-rtdb.firebaseio.com/",
  projectId: "halloween-trick-or-trivia",
  storageBucket: "halloween-trick-or-trivia.firebasestorage.app",
  messagingSenderId: "PASTE_MESSAGING_SENDER_ID",
  appId: "PASTE_FIREBASE_APP_ID"
};

export const DEFAULT_ROOM_CODE = "CARL26";

export const firebaseConfigured = !Object.values(firebaseConfig).some(value =>
  typeof value !== "string" || value.includes("PASTE_")
);
