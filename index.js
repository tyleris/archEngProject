//index.js
//Main file for processing caledar events from the google API

const gCalAPI = require('./googleCalAPI.js');

startDate = '2017-10-18'; 
endDate = '2017-10-28';

gCalAPI.getEvents(startDate, endDate, freeBusy);

function freeBusy(events){
    if (events == undefined) {return console.error('error events undefined')}

    var busyTime;
    if (events.length == 0) {
        console.log('No upcoming events found.');
      } else {
        let cnt = 0;
        for (var i = 0; i < events.length; i++) {
            var event = events[i];

                // Loop through all busy start times. 
                for (var j = 0; j < busyTime.length; j += 1) {
                    var busy = busyTime[j];

                    if (event.start.dateTime < busy.start) {
                        var newStart = event.start.dateTime;

                        // Now start determining what to do based on end time
                        for (var k = j; k < busyTime.length; k += 1 ) {
                            var busyEnd = busyTime[k].end;  
                            
                            // if ends before start, insert new object
                            if (event.end.dateTime < busy2.start) {

                            // If ends between start and end, delete and use new end
                            } else if () {

                            }

                            // If ends after end, delete 
                        }

                        break; // no need to loop through more start times
                    }
                }
                // For each busyTime event
                // if  event.start < busyTime.start 
                { start = event.end.dateTime , end = endDate + 'T00:00:00.000Z' }
            
            }

            var eventEnd = event.end.dateTime || event.end.date;
          console.log('%s - %s', eventStart, eventEnd, event.summary);
        }
      }
}

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