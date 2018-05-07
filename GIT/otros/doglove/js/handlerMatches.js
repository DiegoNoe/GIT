var dogs = []
var index = 0;
var matchesList = [];

function checkStatus() {
    firebase.auth().onAuthStateChanged(firebaseUser => {
        if (!firebaseUser) {
            console.log("Invalid credentials");
            window.location = "https://dog-love-diegonoe.c9users.io/login.html";
        }
        else {
            loadProfile();
            loadDogs();
        }
    })
}

function loadProfile() {
    var tmp = "";
    var dogmed = ""
    var imgTab
    var ref = database.ref("user/" + firebase.auth().currentUser.uid)
    ref.once("value").then(function(snapshot) {
        $(".imageTab").attr("src", snapshot.child("img").val().toString());
        $("#dognameTitle").html(snapshot.child("dogname").val())
        $("#username").html(snapshot.child("username").val().toUpperCase())
        document.getElementById("dogbreedProfile").value = snapshot.child("dogbreed").val().toString();
        document.getElementById("dogageProfile").value = snapshot.child("dogage").val().toString();
        document.getElementById("dogpedigreeProfile").value = snapshot.child("dogpedigree").val().toString();
        document.getElementById("dogcolorProfile").value = snapshot.child("dogcolor").val().toString();
        document.getElementById("dogmedicalProfile").value = snapshot.child("dogmedical").val().toString();
        document.getElementById("emailProfile").value = snapshot.child("email").val().toString();
        document.getElementById("dogsizeProfile").value = snapshot.child("dogsize").val().toString();
        document.getElementById("dognameProfile").value = snapshot.child("dogname").val().toString();
        
        //console.log()
        //document.getElementById("imageTab").src = snapshot.child("img").val().toString();
        
        console.log(snapshot)
        
    });
    
    
}

function editInfo() {
    console.log("Entra");
    const dogname = dognameProfile.value;
    const dogbreed = dogbreedProfile.value;
    const dogage = dogageProfile.value;
    const dogsize = dogsizeProfile.value;
    const dogcolor = dogcolorProfile.value;
    const dogpedigree = dogpedigreeProfile.value;
    const dogmedical = dogmedicalProfile.value;
    const email = emailProfile.value;
    const auth = firebase.auth();
    database.ref("user").child(firebase.auth().currentUser.uid).update({
        dogname: dogname,
        dogbreed: dogbreed,
        dogage: dogage,
        dogsize: dogsize,
        dogcolor: dogcolor,
        dogpedigree: dogpedigree,
        dogmedical: dogmedical,
        email: email,
    });
}

function loadDogs() {
    var checked = [];
    var ref = database.ref("user/" + firebase.auth().currentUser.uid + "/profilesReviewed/")
    ref.once("value",function(snapshot) {
        snapshot.forEach(function(childsnap) {
            checked.push(childsnap.key)
        });

        var dogsRef = database.ref("user/")
        dogsRef.once("value", function(snapshotDogs) {
            snapshotDogs.forEach(function(childsnapDogs) {
                if (checked.indexOf(childsnapDogs.key) < 0) {
                    dogs.push(childsnapDogs.key)
                }
            })
            showDog();
        });
    });
}

function showDog() {
    if (index < dogs.length) {
        var doguid = dogs[index];
        var ref = database.ref("user/" + doguid)
        ref.once("value", function(snapshot) {
            $(".showDogImg").attr("src", snapshot.child("img").val().toString());
            $("#showDogName").html("Hi, my name is " + snapshot.child("dogname").val() + "!");
            $("#showDogBreed").html("and I am a " + snapshot.child("dogbreed").val() + "!");
        })
    }
    else {
        $("#showDogName").html("There are no more dogs :(");
        document.getElementById("btnDislike").style.visibility = 'hidden';
        document.getElementById("btnLike").style.visibility = 'hidden';
    }
}

function likedDog() {
    var ref = database.ref("user/" + firebase.auth().currentUser.uid + "/profilesReviewed").child(dogs[index]).set(
        true
    ).then(function() {
        var refLiked = database.ref("user/" + dogs[index] + "/profilesReviewed").once('value', function(snapshot) {
            if (snapshot.hasChild(firebase.auth().currentUser.uid)) {
                if (snapshot.child(firebase.auth().currentUser.uid).val()) {
                    console.log("Match!");
                    $('#matchModal').modal('show');
                }
            }
            index++;
            showDog();
        });
    });
}

function dislikedDog() {
    var ref = database.ref("user/" + firebase.auth().currentUser.uid + "/profilesReviewed").child(dogs[index++]).set(
        false
    ).then(function() {
        showDog();
    });
}

function getMatches() {
    var tmp = "";
    var ref = database.ref("user/" + firebase.auth().currentUser.uid + "/profilesReviewed/").once("value", function(snapshot) {
        snapshot.forEach(function(childsnap) {
            if (childsnap.val()) {
                var matchRef = database.ref("user/" + childsnap.key);
                matchRef.once("value", function(matchsnapshot) {
                    if (matchsnapshot.child("profilesReviewed").hasChild(firebase.auth().currentUser.uid)) {
                        if (matchsnapshot.child("profilesReviewed").child(firebase.auth().currentUser.uid).val()) {
                            tmp += "<p>• Dog Name: " + matchsnapshot.child("dogname").val() + ". Owner's Contact Mail: " + matchsnapshot.child("email").val() + "</p> <br>";
                            //tmp += "<p> - " + "????" + "</p><br>" PUT DOG INFO AND OWNER CONTACT INFO
                            $('#loadMatches').html(tmp);
                        }

                    }
                }).then(function() {
                    if(tmp == ''){
                        /*tmp += "<h3> You don't have any matches yet. Go to the Dogs tab and find a Dog you like! </h3><br>";
                            $('#loadMatches').html(tmp);*/
                    }
                });
            }
        });
    });
}
