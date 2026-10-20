// Imports the initializeApp function from the Firebase App SDK via CDN to instantiate the Firebase application instance[cite: 1]
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
// Imports the getAuth function from the Firebase Auth SDK via CDN to manage authentication services[cite: 1]
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// Imports the getFirestore function from the Firebase Firestore SDK via CDN to manage database operations[cite: 1]
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Defines the configuration object containing credentials and keys to connect to Firebase services[cite: 1]
const firebaseConfig = {
    // Sets the unique Web API key for Firebase project authentication[cite: 1]
    apiKey: "AIzaSyBK1IfVi-TlMfjjbhgcySOnblEWWkSMZmk",
    // Sets the domain hosting the auth handlers[cite: 1]
    authDomain: "pvt-jsi18-spck.firebaseapp.com",
    // Sets the Firebase project ID[cite: 1]
    projectId: "pvt-jsi18-spck",
    // Sets the Cloud Storage bucket location[cite: 1]
    storageBucket: "pvt-jsi18-spck.firebasestorage.app",
    // Sets the numerical sender ID for Cloud Messaging[cite: 1]
    messagingSenderId: "442820359743",
    // Sets the unique App ID identifying this specific web application instance[cite: 1]
    appId: "1:442820359743:web:356535ab4cb3940b78ea8a"
};

// Initializes and exports the core Firebase Application instance with the specified credentials[cite: 1]
export const app = initializeApp(firebaseConfig);
// Initializes and exports the Firebase Authentication instance attached to the app[cite: 1]
export const auth = getAuth(app);
// Initializes and exports the Cloud Firestore database instance attached to the app[cite: 1]
export const db = getFirestore(app);