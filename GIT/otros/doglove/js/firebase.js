const config = {
    apiKey: "AIzaSyBvQ2TuR3CFU9Gqh9LrsjNYE2m8Yv0BE0A",
    authDomain: "doglove-d79e4.firebaseapp.com",
    databaseURL: "https://doglove-d79e4.firebaseio.com",
    projectId: "doglove-d79e4",
    storageBucket: "doglove-d79e4.appspot.com",
    messagingSenderId: "523279515963"  
}

firebase.initializeApp(config);
var database = firebase.database();
var storage = firebase.storage();
