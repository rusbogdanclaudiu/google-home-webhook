#!/bin/sh

TOKEN=`cat $1`

IP_ADDRESS=`curl http://ipv4.icanhazip.com/`

BODY=`echo '[{ "type": "A", "name": "voyc.eu", "ttl": 3600, "data": "'$IP_ADDRESS'" }]'`
echo $BODY

curl -H "Content-Type: application/json" -H "Accept: application/json" -H "Authorization: sso-key $TOKEN" -X PUT https://api.godaddy.com/v1/domains/voyc.eu/records/A -d "$BODY"
