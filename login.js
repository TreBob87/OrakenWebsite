import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signInWithRedirect  } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";


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
const login = document.getElementById('userLogin')


login.addEventListener('submit', (e) => {
    e.preventDefault()
    let loginPassword = login['password'].value;
    let loginEmail = login['email'].value;

     signInWithEmailAndPassword(auth, loginEmail, loginPassword)

        .then((userCredential) => {
            // Signed in
            login['email'].value = '';
            login['password'].value = '';
            window.location.href = 'index.html'
        })
        .catch((error) => {
            const errorCode = error.code;
            console.log(loginEmail)
            console.log(loginPassword)
            console.log(typeof loginEmail)
            console.log(errorCode)
        });
});





