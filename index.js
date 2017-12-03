#!/usr/bin/env node

require('rconsole');
var sys = console;
sys.set({ facility : 'local0', title: 'basic' });

const express = require('express');
const bodyParser = require('body-parser');


const restService = express();
restService.use(bodyParser.json());

restService.get('/', function (req, res) {
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("Hello snapcrafter\n");
    sys.log('index request');
});

restService.post('/hook', function (req, res) {

    sys.log('hook request');

    try {

        if (req.body) {
            var requestBody = req.body;
            sys.log(requestBody);
        }

        return res.json({
        });
    } catch (err) {
        sys.log("Can't process request: " + err);

        return res.status(400).json({
            status: {
                code: 400,
                errorType: err.message
            }
        });
    }
});

restService.listen((process.env.PORT || 80), function () {
    sys.log("Server listening");
});
