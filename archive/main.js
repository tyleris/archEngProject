var request = require('superagent');
var firebase = require('firebase');
var firebaseui = require('firebaseui');

function saveCredential(user, credential){
    request.post('/signup/submit')
      .send({ userid: 'testingID', pass: 'cat' })
      .end(function(err, res){
        if (err || !res.ok) {
          alert('Oh no! error');
        } else {
          alert('yay got ' + JSON.stringify(res.body));
        }
      });
  }

  var config = {
    apiKey: "AIzaSyAz5miy5_KeKAVruNK4xHnMV5GGwX2XhlI",
    authDomain: "alexaschedulingapp.firebaseapp.com",
    databaseURL: "https://alexaschedulingapp.firebaseio.com",
    projectId: "alexaschedulingapp",
    storageBucket: "alexaschedulingapp.appspot.com",
    messagingSenderId: "124358496882"
};
firebase.initializeApp(config);

// FirebaseUI config.
var uiConfig = {
callbacks: {
    signInSuccess: function(currentUser, credential, redirectUrl) {
    
    console.log('hasnt failed yet');
    
    // http.post('/signup/submit', (data)=>{})
    saveCredential(currentUser, credential);

    alert(JSON.stringify(currentUser));

    // Do something.
    // Return type determines whether we continue the redirect automatically
    // or whether we leave that to developer to handle.
    return true;
    }
},
signInSuccessUrl: 'welcome.html',
signInOptions: [
    {
        provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        scopes: [
            'https://www.googleapis.com/auth/calendar.readonly',
        ],
    },
    // Leave the lines as is for the providers you want to offer your users. 
    
//   firebase.auth.FacebookAuthProvider.PROVIDER_ID,
//   firebase.auth.TwitterAuthProvider.PROVIDER_ID,
//   firebase.auth.GithubAuthProvider.PROVIDER_ID,
//   firebase.auth.EmailAuthProvider.PROVIDER_ID,
//   firebase.auth.PhoneAuthProvider.PROVIDER_ID
],
// Terms of service url.
tosUrl: '<your-tos-url>'
};

// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());

// The start method will wait until the DOM is loaded.
ui.start('#firebaseui-auth-container', uiConfig);
