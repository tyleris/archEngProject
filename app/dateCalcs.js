
// dateCalcs.js
// compares and calculates dates and lists of events 
'use strict';

// window.start 
// returns: { [start: <dateTime>, end: <dateTime>, ... ] }
module.exports.findFreeTime = function(events, window, length, startDate, endDate) {
    if (events == undefined) { return console.error('error events undefined') }
    
    console.log(startDate)
    console.log(endDate)
    console.log(window)

    // Converts the event start and end times to date objects (so they can be compared)
    // Also deletes other calendar data like event name (for privacy and simplicity)
    var dates = convertToDateOnlyObject(events);

    // Get first date
    // make full windows from first date to StartDate
    // mkae full windows from endDate to last date
    

    // set window!!
    console.log('old dates: \n' + lineBreaks(dates));
    var win = createWindowEvents(startDate, endDate, window);
    console.log('window dates: \n' + lineBreaks(win));
    var dayWin = createDayWindows(events, startDate, endDate);
    console.log('day window: \n' + lineBreaks(dayWin));
    dates = dates.concat(dayWin, win);
    console.log('new dates: \n' + lineBreaks(dates));

    // set min window length

    if (events.length == 0) {
        console.log('No upcoming events found.');
        return;
    } else {

        const busy = findBusyTime(dates);
        console.log('busy time: \n' + lineBreaks(busy));

        const freeTime = invertFreeBusyTime(busy, startDate, endDate);
        console.log('free time: \n' + lineBreaks(freeTime));

        return freeTime;
    }
}

// //returns { conflicts: [{ startDate: , endDate, title }, ...] }
// module.exports.testScheduleConflict = function(events, startDate, endDate){
//     if (events == undefined) { return console.error('error events undefined') }
//     if (events.length == 0) {
//         console.log('No upcoming events found.');
//         return { conflicts: []};
    
//     } else {

//         const conflictingEvents = findEventsInWindow(startDate, endDate);

//         return { conflicts: conflictingEvents };
//     }
// }

// Blocks the days before and after start and end date from working
function createDayWindows(events, startDate, endDate) {
    var beginning = new Date('2017-11-20T00:00:00');
    var ending = new Date(endDate);
    ending.setHours(0,0,0,0);
    ending.setDate(ending.getDate() + 20);

    // TODO find first event and set beginning to that

    var beginWin = { start: beginning, end: startDate };
    var endWin = { start: endDate, end: ending };

    var win = [beginWin, endWin];
    return win;
}

function createWindowEvents(startDate, endDate, window) {
    
    // extract unqiue dates for each dates
    // add events window for each date

    var dF = new Date(startDate);
    var dL = new Date(endDate);

    dF.setHours(0,0,0,0)
    dL.setHours(0,0,0,0)
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    var n = (dL - dF) / millisecondsPerDay;
    
    var dates = [];
    //var days = [];
    for (var i = 0; i < n; i++) {
        var daystart = new Date(dF.valueOf());

        var windowstart = new Date(daystart.valueOf());
        windowstart.setHours(parseInt(window.start.hour), window.start.min);

        var windowend = new Date(daystart.valueOf());        
        windowend.setHours(parseInt(window.end.hour), window.end.min);
        
        dF.setDate(dF.getDate() + 1); //increment dF
        
        var dayend = new Date(dF.valueOf());

        dates.push({ start: daystart, end: windowstart });
        dates.push({ start: windowend, end: dayend });
    }
    return dates;
}

function findBusyTime(dates) {
    // array to hold all busy times
    const busyTime = [];

    // Loop through each calendar even to see whether to add more busy time to calendar
    calLoop: for (var i = 0; i < dates.length; i++) {
        const event = dates[i];
        // console.log('next event: ' + JSON.stringify(dates[i]));

        if (i == 0) {
            busyTime.push(event); 
            //console.log('added first event as busy:' + JSON.stringify(event));

        } else {
            // Loop through all busy times to compare to event to busy times 
            // Note busy events are ordered by start time
            let insert = false;
            let insertAt = undefined;
            busyLoop: for (var j = 0; j < busyTime.length; j++) {
                
                const position = relativePosition(event, busyTime[j]);
                // console.log('position found to be: ' + position + ' - ' + JSON.stringify(busyTime[j]));

                switch (position) {
                    case 'before':
                        // if cal event comes before busy event, then all the rest of the busy events will also be after, so time to break
                        // also this is time to insert cal event, before current loation
                        busyTime.splice(j, 0, event); // insert before current location, and increment 1
                        j = j + 1;
                        // console.log('cal event before. Inserting event');
                        // console.log('busyTime so far: \n' + lineBreaks(busyTime));
                        break busyLoop;

                    case 'after':
                        // if cal event comes after busy event, do nothing just keep moving forward
                        // unless at last event, then must insert
                        if (j == busyTime.length - 1) {
                            // console.log('Cal event after last busy event. pushing event.');
                            busyTime.push(event);
                            j = j + 1 //increment to prevent repeat now that busyTime longer
                            // console.log('busyTime so far: \n' + lineBreaks(busyTime));
                        } else {
                            //do nothing
                        }
                        break;

                    case 'subsumed':
                        // console.log('cal event subsumed. ignore event. Break loop. move on. \n')
                        // ignore cal event. Just move to next cal event
                        break busyLoop;

                    case 'wrapAround':
                        // this means current busy time no longer necessary.
                        // console.log('cal event wraps around busy event. deleting busy event.');
                        busyTime.splice(j, 1);
                        j = -1;
                        break;

                    case 'frontOverlap':
                        // update cal event so it has the busy time end time. Then delete the busy time.
                        // console.log('cal event front overlap. updating cal end time and deleting busy event.');
                        event.end = busyTime[j].end;
                        busyTime.splice(j, 1);
                        j = -1;
                        break;

                    case 'backOverlap':
                        // update cal event so it has the busy time start time. Then delete the busy time.
                        // console.log('cal event back overlap. updating cal start time and deleting busy event.');
                        event.start = busyTime[j].start;
                        busyTime.splice(j, 1);
                        //j = j > 1 ? j - 2 : 0;
                        j = -1;
                        break;
                            
                    default:
                        throw new Error('no known position type found');
                        break;
                }
            }
        }
    }
    return busyTime;
}

// // Find events that overlap a window
// function findEventsInWindow(events, startDate, endDate) {
//     console.log('running findEventInWindow');

//     //var conflictingEvents = [];
//     //for (var i = 0; i < events,  
//     //for each event
//     // if start between or end between
//     // or if start before and end after
//     // then add event to list
// }

// testing positions of start and end times
function relativePosition(event1, event2) {
    //console.log('running relative position function');
    //console.log('event 1: ' + JSON.stringify(event1));
    //console.log('event 2: ' + JSON.stringify(event2));

    // Does event 1 come before event 2?
    if (endB4(event1, event2)) { return 'before' }

    // Does event 1 come after event 2?
    if (startAfter(event1, event2)) { return 'after' }

    // Is event 1 subsumed by (ie in between) event 2?
    if (startBetween(event1, event2) && endBetween(event1, event2)) { return 'subsumed' }

    // Does event 1 wrap around event 2 (ie event 1 subsumes event 2)?
    if (startB4(event1, event2) && endAfter(event1, event2)) { return 'wrapAround' }

    // Does event 1 start before but end during event 2?
    if (startB4(event1, event2) && endBetween(event1, event2)) { return 'frontOverlap' }

    // Does event 1 start during but end after event 2?
    if (startBetween(event1, event2) && endAfter(event1, event2)) { return 'backOverlap' }

    throw new Error('no relative position found... must be logical error'); 
}

// testing position of start and end times
function startB4(event1, event2) {
    if (event1.start.getTime() < event2.start.getTime()) {
        return true;
    }
    return false;
}

function startAfter(event1, event2) {
    if (event1.start.getTime() > event2.end.getTime()) {
        return true;
    }
    return false;
}

function startBetween(event1, event2) {
    if (event1.start.getTime() >= event2.start.getTime() && event1.start.getTime() <= event2.end.getTime()) {
        return true;
    }
    return false;
}

function endB4(event1, event2) {
    if (event1.end.getTime() < event2.start.getTime()) {
        return true;
    }
    return false;
}
    
function endAfter(event1, event2) {
    if (event1.end.getTime() > event2.end.getTime()) {
        return true;
    }
    return false;
}
    
function endBetween(event1, event2) {
    if (event1.end.getTime() >= event2.start.getTime() && event1.end.getTime() <= event2.end.getTime()) {
        return true;
    }
    return false;
}

function invertFreeBusyTime(busyTime, startDate, endDate) {
    //console.log('busy time: ' + JSON.stringify(busyTime))
    
    const freeTime = [];
    
    if (busyTime.length == 0) {
        freeTime[0] = { start: startDate, end: endDate }
    
    } else if (busyTime.length == 1) {
        freeTime[0] = { start: startDate, end: busyTime[0].start }
        freeTime[1] = { start: busyTime[0].end, end: endDate }
    
    } else if (busyTime.length > 1) {    
        
        for (let i = 1; i < busyTime.length; i++) {
            freeTime.push({ start: busyTime[i - 1].end, end: busyTime[i].start });
        }
        
        // TODO , this might now work anymore!!

        // if the period doesn't start with busy time
        // console.log(startDate.valueOf() + ' : ' + busyTime[0].start.valueOf());
        // console.log(startDate.valueOf() == busyTime[0].start.valueOf())
        // if (startDate.valueOf() != busyTime[0].start.valueOf()){
        //     freeTime.push({ start: startDate, end: busyTime[0].start });
        // } 

        // for (let i = 1; i < busyTime.length; i++) {
        //     freeTime.push({ start: busyTime[i - 1].end, end: busyTime[i].start });
        // }

        // // if the period doesn't end with busy time
        // console.log(endDate.valueOf()) 
        // console.log(busyTime[busyTime.length - 1].end.valueOf())
        // console.log(endDate.valueOf() != busyTime[busyTime.length - 1].end.valueOf())
        // if (endDate.valueOf() != busyTime[busyTime.length - 1].end.valueOf()) {
        //     freeTime.push({ start: busyTime[busyTime.length - 1].end, end: endDate })
        // }
    } 

    return freeTime;
}

// turn to dates. Eliminates other calendar information
function convertToDateOnlyObject(events) {
    const dates = [];

    for (var i = 0; i < events.length; i++) {
        const e = events[i];
        // console.log('start: ' + JSON.stringify(e.start.dateTime) + ' end: ' + JSON.stringify(e.end.dateTime));
    
        const startD = new Date(e.start.dateTime || e.start.date); // note: date is for All Day events 
        const endD = new Date(e.end.dateTime || e.end.date); // note: date is for All Day events
        //TODO: should add 1 for end of all date event right?

        dates[i] = { start: startD, end: endD }
    }
    return dates;
}

function lineBreaks(arr) {
    var result = '';
    for (var i = 0; i < arr.length; i++) {
        result = result + JSON.stringify(arr[i]) + '\n'
    }
    return result;
}