// dateCalcs.js
// compares and calculates dates and lists of events 
'use strict';

module.exports.findFreeTime = function(events, startDate, endDate) {
    if (events == undefined) { return console.error('error events undefined') }


    if (events.length == 0) {
        console.log('No upcoming events found.');
        return;
    } else {

        const busy = findBusyTime(events);

        const freeTime = invertFreeBusyTime(busy, startDate, endDate);
        return freeTime;
    }
}

function findBusyTime(events) {
    // array to hold all busy times
    const busyTime = [];

    // Converts the event start and end times to date objects (so they can be compared)
    // Also deletes other calendar data like event name (for privacy and simplicity)
    const dates = convertToDateOnlyObject(events);

    // Loop through each calendar even to see whether to add more busy time to calendar
    calLoop: for (var i = 0; i < dates.length; i++) {
        const event = dates[i];
        console.log('next event: ' + JSON.stringify(event));

        if (i == 0) {
            busyTime.push(event); 
            console.log('added first event as busy:' + JSON.stringify(event));

        } else {
            // Loop through all busy times to compare to event to busy times 
            let insert = false;
            let insertAt = undefined;
            busyLoop: for (var j = 0; j < busyTime.length; j += 1) {
                const position = relativePosition(event, busyTime[j]);
                console.log('position found to be: ' + position);

                switch (position) {
                    case 'before':
                        // if cal event comes before busy event, then all the rest of the busy events will also be after, so time to break
                        // also this is time to insert cal event, before current loation
                        //busyTime.push(event); // insert before current location, and 
                        console.log('cal event before. Setting insert = true');
                        insert = true;
                        insertAt = j - 1;
                        break busyLoop;

                    case 'after':
                        // if cal event comes after busy event, do nothing just keep moving forward
                        // unless at last event, then must insert
                        if (j == busyTime.length - 1) {
                            console.log('Cal event after at last busy event. Setting insert = true.');
                            insert = true;
                            insertAt = j + 1;
                        } else {
                            console.log('Cal event after busy event. moving on to next busy event.');
                        }
                        break;

                    case 'subsumed':
                        // ignore cal event. Just move to next cal event
                        console.log('cal event subsumed. does not add busy time. ignoring cal event.');
                        break busyLoop;

                    case 'wrapAround':
                        // this means current busy time no longer necessary.
                        // insertion later when 'before' case triggered
                        console.log('cal event wraps around busy event. deleting busy event. Setting insert = true.');
                        busyTime.pop(j);
                        insert = true;
                        insertAt = j;
                        break;

                    case 'frontOverlap':
                        // update cal event so it has the busy time end time. Then delete the busy time.
                        console.log('cal event front overlap. updating cal end time and deleting busy event. Setting insert = true.');
                        event.end = busyTime[j].end;
                        busyTime.pop(j);
                        insert = true;
                        insertAt = j; // Note: this may be updated later
                        break;

                    case 'backOverlap':
                        // update cal event so it has the busy time start time. Then delete the busy time.
                        console.log('cal event back overlap. updating cal start time and deleting busy event. Setting insert = true.');
                        event.start = busyTime[j].start;
                        busyTime.pop(j);
                        insert = true;
                        insertAt = j; // Note: this may be updated later
                        break;
                            
                    default:
                        throw new Error('no known position type found');
                        break;
                }
            }
            if (insert == true) { 
                busyTime.splice(insertAt, 0, event);
                console.log('inserted busy time: ' + JSON.stringify(event));
            }
        }
    }
    return busyTime;
}

// testing positions of start and end times
function relativePosition(event1, event2) {
    console.log('running relative position function');
    console.log('event 1: ' + JSON.stringify(event1));
    console.log('event 2: ' + JSON.stringify(event2));

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
    console.log('busy time: ' + JSON.stringify(busyTime))
    
    const freeTime = [];
    
    if (busyTime.length == 0) {
        freeTime[0] = { start: startDate, end: endDate }
    
    } else if (busyTime.length == 1) {
        freeTime[0] = { start: startDate, end: busyTime[0].start }
        freeTime[1] = { start: busyTime[0].end, end: endDate }
    
    } else if (busyTime.length > 1) {    
        freeTime.push({ start: startDate, end: busyTime[0].start });

        for (let i = 1; i < busyTime.length; i++) {
            freeTime[i] = { start: busyTime[i - 1].end, end: busyTime[i].start }
        }

        freeTime.push({ start: busyTime[busyTime.length - 1].end, end: endDate })
    } 

    console.log('free time: ' + JSON.stringify(freeTime));
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
    
        dates[i] = { start: startD, end: endD }
    }
    return dates;
}