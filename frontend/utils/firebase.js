// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth , GoogleAuthProvider} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "nexoraai-23be8.firebaseapp.com",
  projectId: "nexoraai-23be8",
  storageBucket: "nexoraai-23be8.firebasestorage.app",
  messagingSenderId: "824862023326",
  appId: "1:824862023326:web:0da790ee6fce8dface258f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
export { auth, googleProvider };