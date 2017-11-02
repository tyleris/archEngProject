//index.js
//Main file for processing caledar events from the google API
'use strict';

// TODO:
// Deal with all day events (allow settings. if yes, convert to event starting at 00:00 ending 24:00)
// Timezones
// Additional calendars as a setting
// comparing two calendars

const gCalAPI = require('./googleCalAPI.js');
const dateCalcs = require('./dateCalcs.js');
const fs = require('fs');
const express = require('express');
const app = express();
const http = require('http');
const bodyParser = require('body-parser');
const path = require('path');

const port = 8080;

// Set start and end date to determine what events to retrieve
const startDate = new Date('2017-10-24'); 
const endDate = new Date('2017-10-26');
endDate.setDate(endDate.getDate() + 1);

/////////////////////////////
//////// Middleware ////////////
/////////////////////////////

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/////////////////////////////
//////// Routers ////////////
/////////////////////////////

app.get('/', (request, response) => {     
    response.send('working \n');
});

app.get('/test/:text', (request, response) => {     
    const text = request.params.text;
    response.send('roger that: ' + text + '\n');
});

app.get('/getGoogleLink', (request, response) => {     
    gCalAPI.getGoogleAuthLink(function(link) {
        response.send(link);
    });    
});

// app.get('/downloadToken:code', (request, response) => {     
//     const code = request.params.code;
//     gCalAPI.downloadToken(code, function() { response.send('your user ID token has been stored. \n'); } );
// });

app.get('/signup', (request, response) => { 
    // Can I pass a variable here?
    response.sendFile(path.join(__dirname + '/signup2.html'));    
});

app.post('/signup/submit', (request, response) => {
    var userid = request.body.userid;
    var pass = request.body.pass;
    console.log('username and pass:' + userid + ' ' + pass);
    response.end('yes');
});

// app.get('/login/:id:pass', (request, response) => { 
//     const id = request.params.id;
//     const pass = request.params.pass;
//     response.send('you are logged in \n');
// });

app.get('/myFreeTime', (request, response) => { 
    gCalAPI.getEvents(startDate, endDate, function(eventsList) {
        const freeTime = dateCalcs.findFreeTime(eventsList, startDate, endDate);
        response.send('free time is: ' + freeTime);
    });
});

app.listen(port, () => console.log('listening on port:' + port));
/* Note: User has three options for using Google Cal API callbacks. 
* 1. Use gCalAPI.getEvents with a callback to do anything user pleases
* 2. Use gCalAPI.getEvents(start, end, downloadEvents) to download json of events to a local file 
* 3. Use localGetEvents(file, callback) to run callback function on a local json
*/

////////// Option 1 ////////////

// // get calendar events from google API and run callback immediately
// gCalAPI.getEvents(startDate, endDate, function(events) = dateCalcs.findFreeTime(events, starDate, endDate));

////////// Option 2 ////////////

// // Download events as json to be read directly using localGetEvents
// gCalAPI.getEvents(startDate, endDate, downloadEvents);

// function downloadEvents(events) {
//     fs.writeFile('./events.json', JSON.stringify(events), (err) => {
//         if(err) {
//             return console.log(err);
//         }
//         console.log('The google API events were saved in file "events.json"');
//     }); 
// }

////////// Option 3 ////////////

// localGetEvents('./events.json', function(events) { dateCalcs.findFreeTime(events, startDate, endDate) });

function localGetEvents(eventFile, callback) {
    // load file
    fs.readFile('./events.json', (err, data) => {
        if (err) {
            console.log('could not read file "events.json"');
        } else {
            const events = JSON.parse(data);
            console.log('successfully loaded file. Executing callback.');
            callback(events);
        }
    });
}

/////////////////////////

function test(events){
    if (events == undefined) {return console.error('error events undefined')}

    if (events.length == 0) {
        console.log('No upcoming events found.');
      } else {
        console.log('Upcoming events:');
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            var eventStart = event.start.dateTime || event.start.date;
            var eventEnd = event.end.dateTime || event.end.date;
          console.log('%s - %s', eventStart, eventEnd, event.summary);
        }
      }
}
