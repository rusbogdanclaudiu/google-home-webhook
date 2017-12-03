var express = require('express');
var router = express.Router();

var fs = require('fs');
const http = require('http');
const https = require('https');

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
    console.log('Time: ', Date.now())
    next()
})
// default route = watchdog
router.get('/', function (req, res) {
    res.send('OK');
})

router.startWatchdog = function(path, timer) {
    godaddyToken = '';
    recoveryActive = false;
    monitorId = 0;

    function init() {
        godaddyTokenPath = process.env.SNAP_COMMON || "~";
        fs.readFile(godaddyTokenPath + '/godaddy.token', 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            
            godaddyToken = data;
            console.log('godaddy: token = ' + godaddyToken);
            monitorId = setInterval(monitor, timer);
        });    
    }

    function monitor() {
        http.get(path, (res) => {
            let data = '';
            
            // A chunk of data has been recieved.
            res.on('data', (chunk) => {
                data += chunk;
            });
           
            res.on('end', (res) => {
                //perfect
                //console.log(JSON.parse(data));
            });
        }).on("error", (err) => {
             //timeout most likely
             console.log('godaddy: monitoring path yielded error: ' + err.message);
             if(!recoveryActive) {
                recoveryActive = true;
                recovery();    
            }
        });
    }

    function recovery() {
        console.log('godaddy: starting recovery');

        http.get("http://ipv4.icanhazip.com", (ipRes) => {
            let ip = '';
            ipRes.on('data', (chunk) => {
                ip += chunk;
            });
           
            ipRes.on('end', (res) => {
                //perfect
                ip = ip.trim();
                console.log('godaddy: external IP address: ' + ip);

                var body = JSON.stringify([{ 'type': 'A', 'name': 'voyc.eu', 'ttl': 3600, 'data': ip }]);

                var options = {
                    hostname: 'api.godaddy.com',
                    port: 443,
                    path: '/v1/domains/voyc.eu/records/A',
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': 'sso-key ' + godaddyToken.trim(),
                        'Content-Length': body.length
                    }
                };

                console.log('godaddy: seding headers:' + JSON.stringify(options) + ' body: ' +body);
                           
                var req = https.request(options, (res) => {
                    let data = '';
                    console.log('godaddy: finalizing recovery request to godaddy with: ' + res.headers + "/" + res.statusCode);
                    recoveryActive = false;

                    res.on('data', (d) => { data += d; });
                    res.on('end', ()=> { console.log("godaddy: recovery response : " + data); });

                });        
                req.on('error', (e) => {
                    console.error('godaddy: error in recovery: ' + e);
                });
                req.write(body);
                req.end();

            });
        }).on("error", (err) => {
            //timeout most likely
            console.log('godaddy: error in recovery' + err.message);
            
        });

        //TOKEN=`cat $1`
        //IP_ADDRESS=`curl http://ipv4.icanhazip.com/`
        //BODY=`echo '[{ "type": "A", "name": "voyc.eu", "ttl": 3600, "data": "'$IP_ADDRESS'" }]'`
        //echo $BODY
        //curl -H "Content-Type: application/json" -H "Accept: application/json" -H "Authorization: sso-key $TOKEN" -X PUT https://api.godaddy.com/v1/domains/voyc.eu/records/A -d "$BODY"
    }
      
    init();
}

module.exports = router


