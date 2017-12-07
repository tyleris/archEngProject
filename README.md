#### Schedule It  ####
Lwin and Tyler final project
Architecting and Engineering Software Systems

# Overview
Schedule It is an Alexa based skill to enable users to 
1. Search the MIT course catalogue and add courses to one's calendar 
2. Find mutually available free time on calendars. 

This repo is the server side of the app. It interfaces with the Google Calendar API, provides user authenticatio, and contains the logic to find mutually available free time in a given window

# Installation 
- npm install

# Dependancies 
- node.js
- express
- fs (file system)
- body-parser
- readline
- googleapis
- google-auth-library

# Modules
- index.js
- googleCalAPI.js
- dateCalcs.js

index.js
- The starting point of the server. Sends webpage to client, handles requests from alexa, initiates the interface with google APIs.
- Also reponsible for converting dates into words to send to alexa to read. 
- Three main routes: /addEvent, /findFreeFree, /signup

googleCalAPI.js
- Interfaces with Google to retrieve a link to direct user to authorize the app with Google
- Adds events to Google calendar
- Retrives list of events on calendar within a date range

dateCalcs.js
- The core logic of the finding free time skill. 
- Reads through each calendar event and calculates all busy times within a widow. Then takes the inverse to get the free time.  

# Webpages
signup.html
