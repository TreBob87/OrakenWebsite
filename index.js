// Import the Firebase modules you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    // ...
    // The value of `databaseURL` depends on the location of the database
    apiKey: "AIzaSyDg54uaZXT-xLEVFIfqmsLtxt0T_424KIQ",
    authDomain: "oraken-kart-counter.firebaseapp.com",
    projectId: "oraken-kart-counter",
    storageBucket: "oraken-kart-counter.appspot.com",
    messagingSenderId: "670891246010",
    appId: "1:670891246010:web:ce13d39cb484cf34efdd83",
    databaseURL: "https://oraken-kart-counter-default-rtdb.europe-west1.firebasedatabase.app/",
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        console.log(uid);

        // ...
    } else {
        // User is signed out
        window.location.href = 'login.html'
    }
});
