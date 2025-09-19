import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, onAuthStateChanged  } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { auth } from "../scripts/firebase.js";


onAuthStateChanged(auth, user => {
    if (user) window.location.href = 'OrakenWebsite/public/kartdrome.html';
});


const login = document.getElementById('userLogin')

login.addEventListener('submit', (e) => {
    e.preventDefault()

    const button = login.querySelector("button[type='submit']");
    const originalButtonHTML = button.innerHTML;

    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span>`;

    let loginPassword = login['password'].value;
    let loginEmail = login['email'].value;

    setPersistence(auth, browserSessionPersistence).then (() => {

        signInWithEmailAndPassword(auth, loginEmail, loginPassword)
    
        .then((userCredential) => {
            // Signed in
            login['email'].value = '';
            login['password'].value = '';
            window.location.href = './public/kartdrome.html';
        })
        .catch((error) => {
            const errorCode = error.code;
            console.log(loginEmail)
            console.log(loginPassword)
            console.log(typeof loginEmail)
            console.log(errorCode)
            button.disabled = false;
            button.innerHTML = originalButtonHTML;
        });

    })
    
});





