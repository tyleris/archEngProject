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

// Set start and end date to determine what events to retrieve
const startDate = new Date('2017-10-24'); 
const endDate = new Date('2017-10-26');
endDate.setDate(endDate.getDate() + 1);

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

localGetEvents('./events.json', function(events) { dateCalcs.findFreeTime(events, startDate, endDate) });

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
