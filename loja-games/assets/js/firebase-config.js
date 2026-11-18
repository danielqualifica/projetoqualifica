import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIz*****aQ",
    authDomain: "geekzone8-e62cc.firebaseapp.com",
    projectId: "geekzone8-e62cc",
    storageBucket: "geekzone8-e62cc.firebasestorage.app",
    messagingSenderId: "352980826174",
    appId: "1:352980826174:web:b0ff806a47234803def96f"
};


const app = initializeApp(firebaseConfig);


// Firebase Authentication
const auth = getAuth(app);


// Firestore
const db = getFirestore(app);


// Disponibiliza para outros arquivos
window.GeekZoneFirebase = {
    auth,
    db
};


console.log("Firebase inicializado com sucesso!");


export {
    app,
    auth,
    db
};