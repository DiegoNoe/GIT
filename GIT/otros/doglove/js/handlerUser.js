function login(){
    const email = txtEmailLogIn.value;
    const pass = txtPasswordLogIn.value;
    const auth = firebase.auth();

    var userCredentials = auth.signInWithEmailAndPassword(email, pass).then(function() {
        console.log("success login");
        window.location = "https://dog-love-diegonoe.c9users.io/index.html";
    }).catch(function(error) {
        console.log(e.message);
    });
}





function signUpAuth() {
    console.log("Si entro aqui!");
    const username = usrSignUp.value;
    const dogname = dogNameSignUp.value;
    const dogbreed = dogBreedSignUp.value;
    const dogage = dogAgeSignUp.value;
    const dogsize = dogSizeSignUp.value;
    const dogcolor = dogColorSignUp.value;
    const dogpedigree = dogPedigreeSignUp.value;
    const dogmedical = dogMedicalSignUp.value;
    const email = txtEmailSignUp.value;
    const pass = txtPasswordSignUp.value;
    const auth = firebase.auth();
    
    const img = imgSignUp.value.toString();
    
    
    
    auth.createUserWithEmailAndPassword(email, pass).then(function(user){
        console.log("Aqui iguanas");
        signUpDatabase(user, username, dogname, dogbreed, dogage, dogsize, dogcolor, dogpedigree, dogmedical, email, pass, img);
        console.log("User created");
        window.location = "https://dog-love-diegonoe.c9users.io/index.html";
    }).catch(function(error){
        console.log(error.code)
        console.log("User Failed, check the pass")
    });
            
}
function signUpDatabase(user, username, dogname, dogbreed, dogage, dogsize, dogcolor, dogpedigree, dogmedical, email, pass, img) {
    console.log("Entra");
    database.ref("user").child(user.uid).set({
        username: username,
        dogname: dogname,
        dogbreed: dogbreed,
        dogage: dogage,
        dogsize: dogsize,
        dogcolor: dogcolor,
        dogpedigree: dogpedigree,
        dogmedical: dogmedical,
        email: email,
        pass: pass,
        img: img,
        profilesReviewed: {
            [user.uid]: false
        }
    });
}

function logout() {
    firebase.auth().signOut().then(function() {
        window.location = "https://dog-love-diegonoe.c9users.io/login.html";
    }).catch(function(error) {
        console.log("Failed to logout")
    });
}

