var http = require('http');
var https = require('https');
var express = require('express');
var fs = require('fs');
var _sessionID;
var _doorID;

var app = express();

var SERVER_PORT = process.env.PORT || 80;
var DOOR_HOST = '10.10.0.11';
var DOOR_PORT = 443;
var DOOR_USER = 'doornode';
var DOOR_PASS = 'matgroup';



app.configure(function(){
  app.use(express.logger('dev'));
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.get('/*',function(req,res,next){
    res.header('Access-Control-Allow-Origin' , '*');
    next();
});

app.get('/', function(req, res){
    res.sendfile('public/index.html');
});

app.get('/open/:id', function(req, res){
    var id = req.params.id;
    openDoor(id);
    res.send('Opening Door ' + id);
    //res.redirect('/');
});

app.get('/open', function(req, res){
    openDoorSequence();
    res.send('Opening Door Sequence');
});

//HTTP
//app.listen(SERVER_PORT);
http.createServer(app).listen(SERVER_PORT);
console.log('Server Listening on port ' + SERVER_PORT);


//HTTPS
var options = {
  key: fs.readFileSync('cert/privatekey.pem'),
  cert: fs.readFileSync('cert/certificate.pem')
};
https.createServer(options, app).listen(443);
console.log('Server Listening on port ' + 443);


init();


//Start Session
function init(doorID) {
    _doorID = doorID ? doorID : null;

    var options = {
      hostname: DOOR_HOST,
      port: DOOR_PORT,
      path: '/',
      method: 'GET',
      rejectUnauthorized: false
    };

    console.log('Door Control Initializing');

    var req = https.request(options, function(res) {
      //console.log("statusCode: ", res.statusCode);
      //console.log("headers: ", res.headers);

      //Get Session ID
      var cookies = res.headers['set-cookie'][0];
      cookies = cookies.split(';');
      _sessionID = cookies[0];
      console.log('Retrieved New Session: ' + _sessionID);

      if(res.statusCode < 400) {
        login(DOOR_USER, DOOR_PASS);
      }

    });

    req.end();
}

//Login Functions
function login(user, pass) {
    var options = {
      hostname: DOOR_HOST,
      port: DOOR_PORT,
      path: '/login.aspx',
      method: 'POST',
      rejectUnauthorized: false
    };

    var req = https.request(options, loginHandler);
    var data = loginRequestData(user, pass);
    req.setHeader('Content-Length', data.length);
    req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
    req.setHeader('Cookie', _sessionID);
    req.write(data);
    req.end();
}

function loginHandler(res) {    
    if(checkValidLogin(res)) {
        console.log("Login Success: " + res.statusCode);
        if(_doorID) openDoor(_doorID);
    }else {
        console.log("Login Error: " + res.statusCode);
    }
}

function checkValidLogin(res) {
    var val = false;
    //console.log(res.headers.location);
    if(res.statusCode < 400 && res.headers.location != '/login.aspx') {
        val = true;
    }
    return val;
}

function openDoorSequence() {
    console.log("Opening Door Sequence");
    openDoor(0);
    setTimeout(function() { openDoor(2); }, 5000 );
}

//Door Control
function openDoor(id) {
    var options = {
      hostname: DOOR_HOST,
      port: DOOR_PORT,
      path: '/activitydevices.aspx',
      method: 'POST',
      rejectUnauthorized: false
    };

    console.log("Opening Door ID: " + id);

    var req = https.request(options, function(res) {
        if(res.statusCode < 400) {
            if(res.statusCode == 302) {
                console.log("Session Expired - Logging In");
                init(id);
            } else {
                console.log("Door Opened");
            }
        } else {
            console.log("Error Opening Door: " + res.statusCode);
        }
    });
    
    var data = openDoorRequestData(id);
    req.setHeader('Content-Length', data.length);
    req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
    req.setHeader('Cookie', _sessionID);
    req.write(data);
    req.end();
}

function openDoorRequestData(id) {
    var data = 'ctl00_MainBodyCPH_TabContainer1_ClientState=%7B%22ActiveTabIndex%22%3A0%2C%22TabState%22%3A%5Btrue%2Ctrue%2Ctrue%5D%7D&__VIEWSTATE=DAwNEAIAAA4BBQAOAQ0QAgAADgEFAQ4BDRACAAAOBAUBBQUFBwUJDgQNEAIAAA4BBQUOAQ0QAgwPAQEEVGV4dAEFdXNlcjEAAAAADRACAAAOAwUBBQMFBQ4DDRACDwEBBXN0eWxlAQ1kaXNwbGF5Om5vbmU7AAAADRACDA8BAgAAARZBY2Nlc3MgRWFzeSBDb250cm9sbGVyAAAAAA0QAgwPAQIAAAEAAAAAAA0QAgAADgEFAQ4BDRACEA4MDwEBCURhdGFCb3VuZAgAABAGCBACDwcCBgAIAQVWYWx1ZQEIQWN0aXZpdHkBCEltYWdlVXJsASJ%2BL0ltYWdlcy9BcHBsaWNhdGlvbnMvQWN0aXZpdHkucG5nAQtOYXZpZ2F0ZVVybAIFAAEIRGF0YVBhdGgCBQABB1Rvb2xUaXACBQACAAACCAAQBAgQAg8HAgYACAIHAAFIVHJhbnNhY3Rpb25zJiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7AgkAAAILAAEaL2FjdGl2aXR5dHJhbnNhY3Rpb25zLmFzcHgCDAACDwACDQACBQACAAACDgAAEAIPBwIGAAgCBwABOERldmljZSBDb250cm9sJiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7AgkAAAILAAEVL2FjdGl2aXR5ZGV2aWNlcy5hc3B4AgwAAhEAAg0AAgUAAgAAAhAAABACDwcCBgAIAgcAATpEZWZhdWx0IFNldHRpbmdzJiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7AgkAAAILAAEcL2FjdGl2aXR5ZGVmYXVsdHNldHRpbmcuYXNweAIMAAITAAINAAIFAAIAAAISAAAQAg8HAgYACAIHAAEEQ2FyZAIJAAEgfi9JbWFnZXMvQXBwbGljYXRpb25zL0NhcmQxNi5wbmcCCwACBQACDAACBQACDQACBQACAAACFAAQBwgQAg8IAQdFbmFibGVkCAIGAAgCBwABH0NhcmQgQWRtaW5pc3RyYXRpb24mIzE2MDsmIzE2MDsCCQAAAgsAARwvY2FyZGNhcmRhZG1pbmlzdHJhdGlvbi5hc3B4AgwAAhgAAg0AAgUAAgAAAhcAABACDwgCFgAIAgYACAIHAAFDQWNjZXNzIEdyb3VwcyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOwIJAAACCwABFi9jYXJkYWNjZXNzZ3JvdXBzLmFzcHgCDAACGgACDQACBQACAAACGQAAEAIPCAIWAAgCBgAIAgcAAVNDYXJkIEZvcm1hdCYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOwIJAAACCwABFC9jYXJkY2FyZGZvcm1hdC5hc3B4AgwAAhwAAg0AAgUAAgAAAhsAABACDwgCFgAIAgYACAIHAAFSRGVwYXJ0bWVudCYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOwIJAAACCwABFC9jYXJkZGVwYXJ0bWVudC5hc3B4AgwAAh4AAg0AAgUAAgAAAh0AABACDwgCFgAIAgYACAIHAAFFUmVzZXQgQVBCJiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7JiMxNjA7AgkAAAILAAESL2NhcmRyZXNldGFwYi5hc3B4AgwAAiAAAg0AAgUAAgAAAh8AABACDwcCBgAIAgcAAhIAAgkAAAILAAEYL2NhcmRkZWZhdWx0c2V0dGluZy5hc3B4AgwAAiEAAg0AAgUAAgAAAhIAABACDwcCBgAIAgcAAQ1Db25maWd1cmF0aW9uAgkAASJ%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%2BAAINAAIFAAIAAAI9AAAQAg8IAhYACAIGAAgCBwABV0RhdGUgJiMzODsgVGltZSYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOyYjMTYwOwIJAAACCwABGy9zeXN0ZW1kYXRldGltZXNldHRpbmcuYXNweAIMAAJAAAINAAIFAAIAAAI%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%3D&__EVENTTARGET=&__EVENTARGUMENT=&rdDoor0=on&rdDoor1=on&rdDoor2=on&rdDoor3=on&ctl00%24MainBodyCPH%24TabContainer1%24TabPanel2%24ddlZones=-1&ctl00%24MainBodyCPH%24btnUpdate=&ctl00%24MainBodyCPH%24hidDoorValues='
    for(var i=0; i<16; i++) {
        var code = '1';
        if(i == id) {
            code = '4';
        }
        data += '' + id + '-' + code + '%2C';
    }
    data += '&ctl00%24MainBodyCPH%24hidInputValues=0-1%2C1-1%2C2-1%2C3-1%2C4-1%2C5-1%2C6-1%2C7-1%2C8-1%2C9-1%2C10-1%2C11-1%2C12-1%2C13-1%2C14-1%2C15-1%2C16-1%2C17-1%2C18-1%2C19-1%2C20-1%2C21-1%2C22-1%2C23-1%2C24-1%2C25-1%2C26-1%2C27-1%2C28-1%2C29-1%2C30-1%2C31-1%2C&ctl00%24MainBodyCPH%24hidOutputValues=32-1%2C33-1%2C34-1%2C35-1%2C36-1%2C37-1%2C38-1%2C39-1%2C40-1%2C41-1%2C42-1%2C43-1%2C44-1%2C45-1%2C46-1%2C47-1%2C48-1%2C49-1%2C50-1%2C51-1%2C52-1%2C53-1%2C54-1%2C55-1%2C56-1%2C57-1%2C58-1%2C59-1%2C60-1%2C61-1%2C62-1%2C63-1%2C&ctl00%24MainBodyCPH%24hidState=1&ctl00%24MainBodyCPH%24Rights=2&ctl00%24MainBodyCPH%24AECERROR%24hfDummy=&__EVENTVALIDATION=GwABAAAA%2F%2F%2F%2F%2FwEAAAAAAAAADwEAAAAcAAAACKJFyA6440vYX%2F3QCZy6NviY5dswmeXbMJrl2zCb5dswnOXbMMsi2zBMRctJ2EDLSdlAy0naQMtJ20DLSdxAy0ndQMtJ3kDLSd9Ay0kElCZ6mPQU5Cb%2F9JuWq1fCuRRQPBveaXqEwIThnDuUkOrtLTwLAA%3D%3D'
    return data;
}

function loginRequestData(user, pass) {
  var data = '__VIEWSTATE=DAwNEAIAAA4BBQAOAQ0QAgAADgEFAw4BDRACAAAOAgUBBQMOAg0QAgAADgMFAQUDBQUOAw0QAg8BAQVzdHlsZQENZGlzcGxheTpub25lOwAAAA0QAgwPAQEEVGV4dAEWQWNjZXNzIEVhc3kgQ29udHJvbGxlcgAAAAANEAIMDwECAgABAAAAAAANEAIAAA4HBQMFBwUNBRMFFQUXBRkOBw0QAgAADgEFAQ4BDRACDwECAgABBkxvZyBPbgAAAA0QAg8BAgIAAQlVc2VyIE5hbWUAAAANEAIPAQICAAEIUGFzc3dvcmQAAAANEAIPAQICAAEITGFuZ3VhZ2UAAAANEAIMAAwJEAkQBQABB0VuZ2xpc2gBATAICBAFAAEIRXNwYcOxb2wBATIJCBAFAAEHRGV1dHNjaAEBNQkIEAUAAQlGcmFuw6dhaXMBATYJCBAFAAEKUG9ydHVndcOqcwEBNwkIEAUAAQpOZWRlcmxhbmRzAQE4CQgQBQABDOeugOS9k%2BS4reaWhwEBOQkIEAUAAQznuYHkvZPkuK3mlocBAjEwCQgQBQABCeaXpeacrOiqngECMTEJCAAAAA0QAgwPAQEHVG9vbFRpcAIFAAAAAAANEAIPAQICAAENQUVDIDIuMS41LjEwCgAAAA4BASBjdGwwMCRMb2dpbkJvZHlDb250ZW50JGJ0bkxvZ2luMQAA&__EVENTTARGET=ctl00%24LoginBodyContent%24btnLogin1&__EVENTARGUMENT=&ctl00%24LoginBodyContent%24txtUserName='
  data += user;
  data += '&ctl00%24LoginBodyContent%24txtPassword='
  data += pass;
  data += '&ctl00%24LoginBodyContent%24Language=0&__EVENTVALIDATION=GwABAAAA%2F%2F%2F%2F%2FwEAAAAAAAAADwEAAAANAAAACJy6Nvj5X%2FYfnh1leNXXQQ7X10EO0NdBDtPXQQ7S10EO3ddBDtzXQQ760UEOxdFBDpdgLP8LAA%3D%3D'
  return data;
}
