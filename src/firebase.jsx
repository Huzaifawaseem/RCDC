import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyB_bcgnPIiUdfbwl90P5akK1H9OaNsPcqM",
  authDomain: "rcdclist-dea80.firebaseapp.com",
  databaseURL: "https://rcdclist-dea80-default-rtdb.firebaseio.com",
  projectId: "rcdclist-dea80",
  storageBucket: "rcdclist-dea80.firebasestorage.app",
  messagingSenderId: "78588707325",
  appId: "1:78588707325:web:45c0d73410523b3f291994",
  measurementId: "G-N7LB5J9HGY"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);