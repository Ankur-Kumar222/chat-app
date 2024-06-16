import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';

const firebaseConfig = {
    apiKey: "AIzaSyDnAYhbdCve3f57PxGa804dcphUhmeZMws",
    authDomain: "chat-app-c8b1a.firebaseapp.com",
    databaseURL: "https://chat-app-c8b1a-default-rtdb.firebaseio.com",
    projectId: "chat-app-c8b1a",
    storageBucket: "chat-app-c8b1a.appspot.com",
    messagingSenderId: "887139394129",
    appId: "1:887139394129:web:c635584043214e9bda0e70"
  };

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const database = firebase.database();

export { firebase, auth, database };

