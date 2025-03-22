import { signInWithEmailAndPassword  } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { auth } from "../scripts/firebase.js";


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
            window.location.href = '../index.html';
        })
        .catch((error) => {
            const errorCode = error.code;
            console.log(loginEmail)
            console.log(loginPassword)
            console.log(typeof loginEmail)
            console.log(errorCode)
        });
});





