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
    //testing server: staging
    /*require('greenlock-express').create({
        server: 'https://acme-v01.api.letsencrypt.org/directory',
        email: 'rusbogdanclaudiu@gmail.com',
        agreeTos: true, 
        approveDomains: [ 'voyc.eu' ], 
        app: app    
    }).listen(80, 443);
      */  

    var path = process.env.SNAP_COMMON || '~';
    path += '/letsencrypt';

    function approveDomains(opts, certs, cb) {
        // This is where you check your database and associated
        // email addresses with domains and agreements and such
       
       
        // The domains being approved for the first time are listed in opts.domains
        // Certs being renewed are listed in certs.altnames
        if (certs) {
          opts.domains = certs.altnames;
        }
        else {
          opts.email = 'rusbogdanclaudiu@gmail.com';
          opts.agreeTos = true;
        }
       
        // NOTE: you can also change other options such as `challengeType` and `challenge`
        // opts.challengeType = 'http-01';
        // opts.challenge = require('le-challenge-fs').create({});

        console.log('opts: '  + JSON.stringify(opts));
        console.log('certs: '  + JSON.stringify(certs));
       
        cb(null, { options: opts, certs: certs });
    }


      // returns an instance of node-greenlock with additional helper methods
    var lex = require('greenlock-express').create({
        // set to https://acme-v01.api.letsencrypt.org/directory in production
        //server: 'staging'
        server : 'https://acme-v01.api.letsencrypt.org/directory'
    
    // If you wish to replace the default plugins, you may do so here
    //
    , challenges: { 'http-01': require('le-challenge-fs').create({ webrootPath: path + '/tmp/acme-challenges' }) }
    , store: require('le-store-certbot').create({ webrootPath: path + '/tmp/acme-challenges' })
    
    // You probably wouldn't need to replace the default sni handler
    // See https://git.coolaj86.com/coolaj86/le-sni-auto if you think you do
    //, sni: require('le-sni-auto').create({})
    
    , approveDomains: approveDomains
    });

    // handles acme-challenge and redirects to https
    require('http').createServer(lex.middleware(require('redirect-https')())).listen(80, function () {
        console.log("Listening for ACME http-01 challenges on", this.address());
    });
    
    // handles your app
    require('https').createServer(lex.httpsOptions, lex.middleware(app)).listen(443, function () {
        console.log("Listening for ACME tls-sni-01 challenges and serve app on", this.address());
    });
    
}