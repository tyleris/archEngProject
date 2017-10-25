// a place to mess around with scripts

// start = new Date('2017-10-15');
// end = new Date('2017-10-16');

// console.log('start: ' + start.getTime());
// console.log('end: ' + end.getTime());
// console.log('end: ' + end.getTime());

const e = new Date('2017-10-26');
console.log(JSON.stringify(e));
console.log(e.getDate());
e.setDate(e.getDate() + 1);
console.log(JSON.stringify(e));