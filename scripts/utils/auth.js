// auth.js
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { auth } from "../firebase.js";

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User logged in:", user.uid);
    } else {
        window.location.href = '../public/login.html';
    }
});
