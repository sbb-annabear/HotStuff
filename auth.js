// Imports initialized authentication and database instances from local config module[cite: 4]
import { auth, db } from "./firebase-config.js";
// Imports collection loader function from script module[cite: 4]
import { loadUserCollection } from "./script.js";
// Imports standard user authentication methods from Firebase Auth SDK[cite: 4]
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// Imports document data methods from Cloud Firestore SDK[cite: 4]
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Exported variable holding global authentication user object initialized as null[cite: 4]
export let currentUser = null;

// Theo dõi trạng thái tài khoản
// Listens for authentication state change events triggered by Firebase Auth[cite: 4]
onAuthStateChanged(auth, async (user) => {
    // Synchronizes local state variable with authenticated user object[cite: 4]
    currentUser = user;
    // Retrieves authentication action button element from UI[cite: 4]
    const authBtn = document.getElementById("auth-action-btn");
    // Retrieves profile display name element node[cite: 4]
    const profileName = document.getElementById("profile-name");
    // Retrieves profile email element node[cite: 4]
    const profileEmail = document.getElementById("profile-email");

    // Evaluates if user is currently signed in[cite: 4]
    if (user) {
        // Updates auth button text and click event to handle logout[cite: 4]
        if (authBtn) {
            authBtn.innerText = "Đăng xuất";
            authBtn.onclick = () => signOut(auth).then(() => alert("Logged Out Succesfully."));
        }
        // Updates UI text content with current user email[cite: 4]
        if (profileEmail) profileEmail.innerText = user.email;
        
        // Fetches extended user profile document snapshot from Firestore database[cite: 4]
        const userDoc = await getDoc(doc(db, "users", user.uid));
    // Checks if matching user document exists in database[cite: 4]
    if (userDoc.exists()) {
    // Extracts document fields object[cite: 4]
    const data = userDoc.data();
    // Sets profile display name[cite: 4]
    if (profileName) profileName.innerText = data.name || "User";
    
    // Tải ảnh đại diện đã lưu từ Firestore
    // Locates profile picture avatar element[cite: 4]
    const profileAvatar = document.getElementById("profile-avatar");
    // Sets image element source to photoURL from Firestore if available[cite: 4]
    if (profileAvatar && data.photoURL) {
        profileAvatar.src = data.photoURL;
    }
}
        // Loads saved user collection recipes matching user UID[cite: 4]
        loadUserCollection(user.uid);
    // Runs fallback logic when user is logged out[cite: 4]
    } else {
        // Updates auth button text and click event to handle login navigation[cite: 4]
        if (authBtn) {
            authBtn.innerText = "Đăng nhập";
            authBtn.onclick = () => {
                // Determines relative URL path location based on current directory structure[cite: 4]
                const isInsidePage = window.location.pathname.includes("/page/");
                // Redirects window location to login page[cite: 4]
                window.location.href = isInsidePage ? "login.html" : "page/login.html";
            };
        }
    }
});

// Xử lý Form Đăng Nhập
// Retrieves login form element node[cite: 4]
const loginForm = document.getElementById("standalone-login-form");
// Checks if login form exists on active page view[cite: 4]
if (loginForm) {
    // Binds submit listener to run authentication process[cite: 4]
    loginForm.addEventListener("submit", async (e) => {
        // Prevents browser HTML form submission default page reload[cite: 4]
        e.preventDefault();
        // Reads email input value[cite: 4]
        const email = document.getElementById("login-email").value;
        // Reads password input value[cite: 4]
        const pass = document.getElementById("login-pass").value;

        // Executes Firebase authentication request inside try block[cite: 4]
        try {
            // Authenticates existing user credentials[cite: 4]
            await signInWithEmailAndPassword(auth, email, pass);
            // Displays success alert[cite: 4]
            alert("Logged In Succesfully.");
            // Redirects user to index home page[cite: 4]
            window.location.href = "../index.html";
        // Handles authentication errors[cite: 4]
        } catch (err) {
            // Displays authentication failure error message[cite: 4]
            alert("Lỗi đăng nhập: " + err.message);
        }
    });
}

// Xử lý Form Đăng Ký
// Retrieves registration form element node[cite: 4]
const regForm = document.getElementById("standalone-register-form");
// Checks if registration form exists on active page view[cite: 4]
if (regForm) {
    // Binds submit listener to process user registration[cite: 4]
    regForm.addEventListener("submit", async (e) => {
        // Prevents browser HTML form submission default page reload[cite: 4]
        e.preventDefault();
        // Reads full name input value[cite: 4]
        const name = document.getElementById("reg-name").value;
        // Reads registration email input value[cite: 4]
        const email = document.getElementById("reg-email").value;
        // Reads registration password input value[cite: 4]
        const pass = document.getElementById("reg-pass").value;

        // Wraps registration API requests inside try block[cite: 4]
        try {
            // Creates new user account in Firebase Auth[cite: 4]
            const res = await createUserWithEmailAndPassword(auth, email, pass);
            // Creates corresponding user record document in Firestore[cite: 4]
            await setDoc(doc(db, "users", res.user.uid), {
                name: name,
                email: email,
                createdAt: new Date()
            });
            // Displays registration success alert[cite: 4]
            alert("Account Created Successfully!");
            // Redirects newly created user to index home page[cite: 4]
            window.location.href = "../index.html";
        // Handles registration errors[cite: 4]
        } catch (err) {
            // Displays registration failure error message[cite: 4]
            alert("Lỗi đăng ký: " + err.message);
        }
    });
}