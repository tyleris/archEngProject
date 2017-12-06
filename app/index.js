
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

const EVENTSDIR = "./events/"
const CREDDIR = './credentials/'

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

////////////////////////
//// tests ////
/////////////////////////

app.get('/', (request, response) => {     
    response.send('working \n');
});

app.get('/test/:text', (request, response) => {     
    const text = request.params.text;
    console.log('recieved message: ' + text);
    response.send('roger that: ' + text + '\n');
});

////////////////////
//// sign up - old way with web client ////
/////////////////////

app.get('/signup', (request, response) => { 
    response.sendFile(path.join(__dirname + '/getCalToken.html'));    
});

app.post('/postEvents', (request, response) => {
    var events = request.body.events;
    var user = request.body.user;
    console.log(user);
    fs.writeFile(EVENTSDIR + user + '_events.json', events);
    response.end('yes');
});

///////////////////////////
/////////// sign up - new way with node
///////////////////////

app.get('/signupNode', (request, response) => {
    console.log('sending signup page to web client');
    response.sendFile(path.join(__dirname + '/signup.html'));
});

app.get('/userLink', (request, response) => {
    console.log('getting google authorization link');
    gCalAPI.getGoogleAuthLink((link) => {
        response.send(link);
    });
});

// request { user: , secret: }
app.post('/saveToken', (request, response) => {
    console.log('saving token');
    var user = request.body.user.toLowerCase();
    var secretCode = request.body.secret;
    gCalAPI.downloadToken(user, secretCode, (err) => {
        if (err) {
            console.log('failed to save token: ' + err);
            response.send('failed to save token: ' + err);
        } else {
            console.log('successfully saved token');
            response.send('successfully saved token');
        }    
    });
});

/////////////////////////
//// add events ////
///////////////////////

// app.get('/displayEvents', (request,response) => {
//     response.sendFile(path.join(__dirname + '/eventsDisplay.html'));
// });

// app.get('/findFreeTime/:user', (request, response) => {
//     var user = request.params.user;
//     fs.readFile(EVENTSDIR + user + '_events.json', (err, data) => {
//         var events =  JSON.parse(data);
//         console.log(events);
//         var freeTime = dateCalcs.findFreeTime(events, startDate, endDate);
//         response.send(freeTime);
//     });
// });

// Request: { users: [user1, user2, etc...], eventStart: <'yyyy-mm-ddThh:mm:ss'>, eventEnd: <'yyyy-mm-ddThh:mm:ss'>, summary:<optional: string>, recur: <[MO,TU,WE,TH,FR]>} 
// Response: { outcome: <string: success or failure>, readout: <string response> }
app.post('/addEvent', (request, response) => {
    // parse API request
    var data = request.body;
    console.log('adding event: ' + JSON.stringify(data));

    var users;
    if (typeof data.users == 'string'){
        users = [data.users.toLowerCase()];
    } else {
        users = data.users.map((item) => item.toLowerCase());
    }

    var eventStart = new Date(data.eventStart);
    var eventEnd = new Date(data.eventEnd);

    var summary = data.summary || 'Meeting with ' + users.join(', ');
    var recur = data.recur == undefined ? '' : ["RRULE:FREQ=WEEKLY;COUNT=15;BYDAY=" + data.recur.join()]; 
    //find end time
    
    console.log('creating event with: \nusers: ' + users + '\nstart: ' + eventStart + '\nend: ' + eventEnd + '\nsummary: ' + summary + '\nrecur: ' + recur);

    // Create google api add event request
    var event = {
        summary: data.summary,
        location: '',
        description: '',
        start: {
            dateTime: eventStart.toISOString(),
            timeZone: 'America/New_York',
        },
        end: {
            dateTime: eventEnd.toISOString(),
            timeZone: 'America/New_York',
        },
        recurrence: recur,
        // attendees: [
        // {email: 'lpage@example.com'},
        // {email: 'sbrin@example.com'},
        // ],
        //reminders: {
        //    useDefault: true,
            // overrides: [
            //     {method: 'email', 'minutes': 24 * 60},
            //     {method: 'popup', 'minutes': 10},
            // ],
    }
    console.log('event created: ' + JSON.stringify(event));

    // Send response to Alexa
    var userReadout = '';
    for (var i = 0; i < users.length; i++){
        userReadout = userReadout + users[i] + ' '
        if (i != users.length -1){
            userReadout = userReadout + 'and '
        }
    }
    
    // Add event
    console.log('sending event to google api to add');
    var cnt = 0;
    for (i = 0; i < users.length; i++){
        gCalAPI.addEvent(users[i], event, (err) => {
            if (err) {
                console.log('add event failed: ' + err);
                response.send({ outcome: 'failure', data: err })
            } else {
                cnt = cnt + 1;

                if (cnt == users.length) {
                    var readout = 'event with ' + userReadout + 'successfully created on ' + readoutDOWTime(eventStart);
                    var outcome = { outcome: 'success', readout: readout }
                    console.log('reading out: ' + JSON.stringify(outcome));
                    response.send(outcome);
                }
            }
        }); 
    }
});

function readoutDOWTime(date){
    var dow = date.getDay();
    dow = convertToDOWName(dow);
    
    console.log(date);
    var time = readoutTime(date);

    return dow + 'at ' + time;
}

// format changed
// //input hh:mm
// function timeReadout(hhmm){
//     var h = hhmm.substring(0,2);
//     console.log(h);
//     var suffix = getSuffixWord(h);
//     var hOut = getHoursWord(h);
//     console.log(hOut);
//     var minTens = hhmm.substring(3,4);
//     console.log(minTens);
//     var tensOut = getTensWord(minTens); 
//     console.log(tensOut);
//     var minOnes = hhmm.substring(4,5);
//     console.log(minOnes);
//     var onesOut = getOnesWord(minOnes);
//     console.log(onesOut);

//     return hOut + minTens + onesOut + suffix 
// }

/////////////////////
///////////// find free time
////////////////////

// Request: {users: [user1, user2, etc...], window: <breakfast, morning, lunch, afternoon, dinner, evening, day, wake>, length: {<1, 2, 3>} dateRange: { start: dateTime, end: dateTime }, dateStart: <date> }
// dateTime format 2017-11-30T09:00:00
// Response: { freeTimes: [{ start: dateTime, end: dateTime }], readout: 'You have free time at 3, 6, 7 and 8' }
app.post('/findFreeTime', (request, response) => {
    var data = request.body;
    console.log('finding free time. Request data: ' + JSON.stringify(data));

    // create a time window based on the words passed
    var window = getTimeWindow(data.window);
    var startDate;
    var endDate;
    // determine the date range
    if (data.dateRange == undefined && data.dateStart != undefined){
        startDate = new Date(data.dateStart);
        startDate.setHours(0,0,0,0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);

        console.log('set range using dateStart. start: ' + startDate + ' end: ' + endDate);
    } else if (data.dateRange != undefined && data.dateStart == undefined) {
        startDate = new Date(dateRange.start)
        endDate = new Date(dateRange.end)
    } else if (data.dateRange != undefined && data.dateStart != undefined) {
        //TODO
    } else if (data.dateRange == undefined && data.dateStart == undefined) {
        //TODO
    }

    // set the length of the new event to be added 
    var length = data.length == undefined ? 60 : data.length * 60;
                    
     
    // var dateRange = data.dateRange == undefined ? makeDateRangeThisWeek() : data.dateRange;
    // var dateStart = data.dateStart == undefined ? 
    // console.log('date range: ' + JSON.stringify(dateRange));
    // var startDate = new Date(dateRange.start);
    // var endDate = new Date(dateRange.end);
    //console.log(startDate + ':' + endDate);

    // get the user events data 
    var users = data.users.map((item) => item.toLowerCase());

    console.log('users: ' + JSON.stringify(users));
    var eventsAll = [];
    var count = 0;
    for (var i = 0; i < users.length; i++) {
        // var pathstring = EVENTSDIR + users[i] + '_events.json';
        // var content = fs.readFileSync(pathstring, 'utf8')
        // content = JSON.parse(content);
        // events = events.concat(content);
        
        gCalAPI.getEvents(users[i], startDate, endDate, (events) => {
            //console.log('events: ' + JSON.stringify(events));

            eventsAll.concat(events);
            console.log('events so far: ' + JSON.stringify(events));
            console.log('count so far: ' + count);

            // wait till all loops finished
            if (count == users.length - 1) {
    
                // find the free time
                console.log('finding free time...');
                var freeTime = dateCalcs.findFreeTime(events, window, length, startDate, endDate);

                // convert the time into english words
                var readout = readoutFreeTime(freeTime);
                
                console.log('readout:' + readout);

                var resData = { freeTimes: freeTime, readout: readout };
 
                // send response
                response.send(resData);
            }
            count = count + 1; 
        })
    }
});

function readoutFreeTime(freeTime) {
    var readout = 'you are both free ';

    var items = freeTime.length <= 5 ? freeTime.length : 5;
    var oldDay = '';
    for (var i = 0; i < items; i++) {
        var start = new Date(freeTime[i].start);
        var end = new Date(freeTime[i].end);
        var day = convertToDOWName(start.getDay());
        if (day != oldDay) {
            if (oldDay == ''){
                readout = readout + 'on ' + day
            } else {
                readout = readout + 'you are also free on ' + day
            }
        };
        
        if (day != oldDay) {
            readout = readout + 'from ' + readoutTime(start) + "to " + readoutTime(end);        
        } else {
            readout = readout + 'or from ' + readoutTime(start) + "to " + readoutTime(end);        
        }
        
        oldDay = day;
    }
    return readout;
}

// ex return: 'six thirty five PM'
function readoutTime(date) {
    var hour = date.getHours();
    var suffix = hour >= 12 ? "PM ":"AM ";

    hour = ((hour + 11) % 12 + 1);
    hour = getOnesWord(hour);

    var mins = date.getMinutes();
    
    var tens;
    var ones;
    if (mins < 20) {
        tens = '';
        ones = getOnesWord(mins);
    } else {
        var tens = Math.floor(mins/10);
        tens = getTensWord(tens);

        ones = mins % 10;
        ones = getOnesWord(ones);
    }
    
    return hour + tens + ones + suffix;
}

function getSuffixWord(hour24){
    return hour24 >= 12 ? "PM ":"AM ";
}

function getHoursWord(hour24){
    var hour12 = ((hour24 + 11) % 12 + 1);
    return getOnesWord(hour12)
}

function getOnesWord(ones){
    if (!ones) return '';
    if (typeof ones != 'string') { ones = ones.toString()}
    switch (ones) {
        case '0': return ''; 
        case '1': return 'one ';
        case '2': return 'two ';
        case "3": return 'three '; 
        case "4": return 'four '; 
        case '5': return 'five '; 
        case '6': return 'six '; 
        case '7': return 'seven '; 
        case '8': return 'eight '; 
        case '9': return 'nine '; 
        case '10': return 'ten '; 
        case '11': return 'eleven '; 
        case '12': return 'twelve ';
        case '13': return 'thirteen ';
        case '14': return 'fourteen ';
        case '15': return 'fifteen ';
        case '16': return 'sixteen ';
        case '17': return 'seventeen ';
        case '18': return 'eighteen ';
        case '19': return 'nineteen ';  
        default: return new Error('ones out of range:' + ones);
            break;
    }
    return ones;
}

function getTensWord(tens){
    if (!tens) return '';
    if (typeof tens != 'string') { tens = tens.toString()}
    switch (tens) {
        case '0': return '';
        case "1": return '';
        case '2': return 'twenty ';
        case '3': return 'thirty ';
        case '4': return 'fourty ';
        case '5': return 'fifty ';
        case '6': return 'sixty ';
        case '7': return 'seventy ';
        case '8': return 'eighty ';
        case "9": return 'ninety ';
        default: return new Error('tens out of range: ' + tens);
            break;
    }
}

function getTimeWindow(window) {
    switch (window) {
        case 'breakfast': return { start: { hour: 8, min: 0 }, end: { hour: 11, min: 0} }
        case 'morning': return { start: { hour: 8, min: 0 }, end: { hour: 12, min: 0 } }
        case 'lunch': return { start: { hour: 11, min: 30 }, end: { hour: 13, min: 30 } }
        case 'afternoon': return { start: { hour: 12, min: 0 }, end: { hour: 18 , min: 0 } }
        case 'dinner': return { start: { hour: 17, min: 30 }, end: { hour: 20, min: 30} }
        case 'evening': return { start: { hour: 6, min: 0 }, end: { hour: 22, min: 0 } }
        case 'day': return { start: { hour: 8, min: 0 }, end: { hour: 18, min: 0 } }
        case 'wake': return { start: { hour: 8, min: 0 }, end: { hour: 22 , min: 0 } } 
        default: return new Error('incorrect window given:' + window)
    }
}

function makeDateRangeThisWeek() {
    var s = new Date();
    s.setHours(0,0,0,0); 
    var e = new Date(s.valueOf());
    e.setDate(e.getDate() + 7);
    return {start: s, end: e }
}

function convertToDOWName(int) {
    switch (int) {
        case 0: return 'Sunday '
        case 1: return 'Monday '
        case 2: return 'Tuesday '
        case 3: return 'Wednesday '
        case 4: return 'Thursday '
        case 5: return 'Friday '
        case 6: return 'Saturday '
        default: return new Error('day of week number incorrect')
    }
}

app.listen(port, () => console.log('listening on port:' + port));

////////////////////////////////////////////////////////
////////////////// old junk below ////////////////////////
////////////////////////////////////////////////

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
