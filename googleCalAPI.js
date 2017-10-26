var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
const express = require('express');

//TODO: get all calendars and let user select which call 
//TODO: enable passing of which user to select. By passing credential location

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
//var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
var TOKEN_DIR = './credentials/';
var TOKEN_PATH = TOKEN_DIR + 'userToken.json';

let start; //format: "2017-10-17"
let end;

//Main API call to get calendar events
// Parameters: start days, end days
exports.getEvents = function getEvents(startDate, endDate, callback){
  authorizeServer(function(oauth2Client) { 
    authorizeUser(oauth2Client, function (userToken) {
      listEvents(userToken, callback)
    });
  });
}

exports.getGoogleAuth = function getGoogleAuth(callback) {
  console.log('running getGoogleAuth');
  return authorizeServer(function(oauth2Client) {
    console.log('authorizing server');
    var authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    });
    const text = 'Authorize this app by visiting this url and copying the code from that page below: ' + authUrl;
    callback(text);
  });  
}
  
  exports.getNewToken = function getNewToken(oauth2Client, code) {
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
    });
  }
  
// function authorizeServer(apiCallback, userCallback) {
//   fs.readFile('client_secret.json', function processClientSecrets(err, content) {
//     if (err) {
//       console.log('Error loading client secret file: ' + err);
//       return;
//     }
//     var credentials = JSON.parse(content);

//     // Authorize a client with the loaded credentials, then call the Google Calendar API.
//     var clientSecret = credentials.installed.client_secret;
//     var clientId = credentials.installed.client_id;
//     var redirectUrl = credentials.installed.redirect_uris[0];
//     var auth = new googleAuth();
//     var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

//     authorizeUser(oauth2Client, apiCallback, userCallback);
//   });
// }

function authorizeServer(callback) {
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    var credentials = JSON.parse(content);

    // Authorize a client with the loaded credentials, then call the Google Calendar API.
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    console.log('oauth2Client created:' + oauth2Client);
    callback(oauth2Client);
  });
}

// /**
//  * Create an OAuth2 client with the given credentials, and then execute the
//  * given callback function.
//  *
//  * @param {Object} credentials The authorization client credentials.
//  * @param {function} callback The callback to call with the authorized client.
//  */
// function authorizeUser(oauth2Client, callback) {
//   // TODO: this should become user login.

//   // Check if we have previously stored a token.
//   fs.readFile(TOKEN_PATH, function(err, token) {
//     if (err) {
//       console.log('No token found. Getting new token.');
//       getNewToken(oauth2Client, apiCallback);
    
//     } else {
//       oauth2Client.credentials = JSON.parse(token);
//       console.log('Token found. Accessing token from path :' + TOKEN_PATH);
      
//       // call the passed function with the authorization
//       callback(oauth2Client);
//     }
//   });
// }

function authorizeUser(oauth2Client, callback) {
  // TODO: this should become user login.

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      console.log('No token found. please go to get new token path.');
      // getNewToken(oauth2Client, apiCallback);
    
    } else {
      oauth2Client.credentials = JSON.parse(token);
      console.log('Token found. Accessing token from path :' + TOKEN_PATH);
      
      // call the passed function with the authorization
      callback(oauth2Client);
    }
  });
}


// /**
//  * Get and store new token after prompting for user authorization, and then
//  * execute the given callback with the authorized OAuth2 client.
//  *
//  * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
//  * @param {getEventsCallback} callback The callback to call with the authorized
//  *     client.
//  */
// function getNewToken(oauth2Client, callback) {
//   var authUrl = oauth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: SCOPES
//   });
//   console.log('Authorize this app by visiting this url: ', authUrl);
//   var rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
//   });
//   rl.question('Enter the code from that page here: ', function(code) {
//     rl.close();
//     oauth2Client.getToken(code, function(err, token) {
//       if (err) {
//         console.log('Error while trying to retrieve access token', err);
//         return;
//       }
//       oauth2Client.credentials = token;
//       storeToken(token);
//       callback(oauth2Client);
//     });
//   });
// }


/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

////////////
//////////// Actual API call
////////////

/**
 * Lists the events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth, callback) {
  var calendar = google.calendar('v3');
  console.log('Getting calendar events from dates: ' + JSON.stringify(start) + ' to: ' + JSON.stringify(end));
  calendar.events.list({
    auth: auth,
    calendarId: 'primary',
    timeMin: start,
    timeMax: end,
    singleEvents: true,
    orderBy: 'startTime'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var eventsList = response.items;
    console.log('Calendar events successfully downloaded. Executing user callback');
    // The callback enabling user to execute whatever code desired.
    callback(eventsList);
  });
}

// /**
//  * Lists the next 10 events on the user's primary calendar.
//  *
//  * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
//  */
// function testEvents(auth) {
//     var calendar = google.calendar('v3');
//     calendar.events.list({
//       auth: auth,
//       calendarId: 'primary',
//       timeMin: "2017-10-17T12:57:14.591Z",
//       timeMax: "2017-10-20T12:57:14.591Z",
//       singleEvents: true,
//       orderBy: 'startTime'
//     }, function(err, response) {
//       if (err) {
//         console.log('The API returned an error: ' + err);
//         return;
//       }
//       var events = response.items;
//       if (events.length == 0) {
//         console.log('No upcoming events found.');
//       } else {
//         console.log('Upcoming 3 days:');
//         for (var i = 0; i < events.length; i++) {
//             var event = events[i];
//             var start = event.start.dateTime || event.start.date;
//             var end = event.end.dateTime || event.end.date;
//           console.log('%s - %s', start, event.summary);
//         }
//       }
//     });
//   }
