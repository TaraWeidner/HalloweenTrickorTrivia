// Firebase web configuration for Trick or Trivia.
// The Firebase config identifies the project; access is protected by
// Authentication and Realtime Database Security Rules, not by hiding these values.
export const firebaseConfig = {
  apiKey: "AIzaSyC5-Tpr4bvoL_uPRO9bSVl_ZkTvoRYEZAw",
  authDomain: "halloween-trick-or-trivia.firebaseapp.com",
  databaseURL: "https://halloween-trick-or-trivia-default-rtdb.firebaseio.com/",
  projectId: "halloween-trick-or-trivia",
  storageBucket: "halloween-trick-or-trivia.firebasestorage.app",
  messagingSenderId: "908447343528",
  appId: "1:908447343528:web:4f5b1c862878ff5dea739d",
  measurementId: "G-J9TW00DKGD"
};

export const DEFAULT_ROOM_CODE = "CARL26";

export const firebaseConfigured = !Object.values(firebaseConfig).some(value =>
  typeof value !== "string" || value.includes("PASTE_")
);
