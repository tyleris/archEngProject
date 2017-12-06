var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
const express = require('express');
const firebase = require('firebase');

//TODO: get all calendars and let user select which call 
//TODO: enable passing of which user to select. By passing credential location

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/calendar'];
//var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
var TOKEN_DIR = './credentials/';
var TOKEN_PATH = TOKEN_DIR + 'userToken.json';

let start; //format: "2017-10-17"
let end;

/////////////////////
///////////////////// get link
/////////////////////

exports.getGoogleAuthLink = function getGoogleAuth(callback) {
  console.log('running getGoogleAuth');
  authorizeServer(function(oauth2Client) {
    console.log('authorizing server');
    var authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    });
    const link = authUrl;
    callback(link);
  });  
}

////////////////////
//////////////////// get and save user token
////////////////////

/**
 * Download token from Google based on user access code
 * @param {Object} code The access code used to retrieve a user token from Google.
 */
exports.downloadToken = function downloadToken(secretCode, callback) {
  authorizeServer(function(oauth2Client) {
    oauth2Client.getToken(secretCode, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      callback();
    });
  });
}

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

////////////
//////////// get list of calendar events
////////////

//Main API call to get calendar events
// Parameters: start days, end days
exports.getEvents = function getEvents(startDate, endDate, callback){
  authorizeServer(function(oauth2Client) { 
    authorizeUser(oauth2Client, function (userToken) {
      listEvents(userToken, callback)
    });
  });
}

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
    timeZone: 'America/New_York',
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

///////////////////////
/////////////////////// Add event
///////////////////////

// var event = {
  //   summary: 'Google I/O 2015',
  //   location: '800 Howard St., San Francisco, CA 94103',
  //   description: 'A chance to hear more about Google\'s developer products.',
  //   start: {
  //     dateTime: '2015-05-28T09:00:00-07:00',
  //     timeZone: 'America/Los_Angeles',
  //   },
  //   end: {
  //     dateTime: '2015-05-28T17:00:00-07:00',
  //     timeZone: 'America/Los_Angeles',
  //   },
  //   recurrence: [
  //     'RRULE:FREQ=DAILY;COUNT=2'
  //   ],
  //   attendees: [
  //     {email: 'lpage@example.com'},
  //     {email: 'sbrin@example.com'},
  //   ],
  //   reminders: {
  //     useDefault: false,
  //     overrides: [
  //       {method: 'email', 'minutes': 24 * 60},
  //       {method: 'popup', 'minutes': 10},
  //     ],
  //   },
  // };
  exports.addEvent = function addEvent(event, callback){
    authorizeServer(function(oauth2Client) { 
      authorizeUser(oauth2Client, function (userToken) {
        addEventToGCal(userToken, event, function(event){
          // do something with event
          callback(event); 
        });
      });
    });
  }

function addEventToGCal(auth, event, callback) {
  calendar.events.insert({
    auth: auth,
    calendarId: 'primary',
    resource: event,
  }, function(err, event) {
    callback(err, event);
    if (err) {
      console.log('There was an error contacting the Calendar service: ' + err);
      return;
    }
    console.log('Event created: %s', event.htmlLink);
  });
}

// /**
//  * Store token to disk be used in later program executions.
//  * @param {Object} token The token to store to disk.
//  */
// function storeToken(token) {
//   try {
//     fs.mkdirSync(TOKEN_DIR);
//   } catch (err) {
//     if (err.code != 'EEXIST') {
//       throw err;
//     }
//   }
//   fs.writeFile(TOKEN_PATH, JSON.stringify(token));
//   console.log('Token stored to ' + TOKEN_PATH);
// }

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