#!/usr/bin/env node
require('rconsole');
console.set({ facility : 'local0', title: 'basic' });

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

var localStaticServePath = process.env.SNAP_COMMON || process.env.HOME;
localStaticServePath += '/voyc-static-content';
app.use(express.static(localStaticServePath));

if(!process.env.LOCAL_TEST_SERVER) {
    var godaddy = require('./godaddy');
    app.use('/godaddy/', godaddy);
    godaddy.startWatchdog('http://voyc.eu/godaddy/', 15000);
    //godaddy.startWatchdog('http://127.0.0.1/godaddy/', 100);    
}

var vWeb = require('./voyc-webserver');
vWeb.init(app);

app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("Hello snapcrafter, with godaddy A record setup\n");
    console.log('index request');
});

app.post('/hook', function (req, res) {

    console.log('hook request');

    try {

        if (req.body) {
            var requestBody = req.body;
            console.log(requestBody);
        }

        return res.json({
        });
    } catch (err) {
        console.log("Can't process request: " + err);

        return res.status(400).json({
            status: {
                code: 400,
                errorType: err.message
            }
        });
    }
});


if(process.env.LOCAL_TEST_SERVER) {
    app.listen((process.env.PORT || 80), function () {
        console.log("Server listening");
    });
} else {
    //https://git.daplie.com/Daplie/greenlock-express
    require('greenlock-express').create({
        server: 'staging',
        email: 'rusbogdanclaudiu@gmail.com',
        agreeTos: true, 
        approveDomains: [ 'voyc.eu' ], 
        app: app    
    }).listen(80, 443);
        
}