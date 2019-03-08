#!/bin/bash

SERVER_URL="https://www.wrossmorrow.org/statesampler/api"

curl -s -X POST "${SERVER_URL}/data" -H 'Content-Type: application/json' -d "@gsheet.json" > tmpid
DATA_ID=$( cat tmpid )  && rm tmpid

curl -s -X POST "${SERVER_URL}/sampler/${DATA_ID}" -H 'Content-Type: application/json' -d '{"type":"random","dist":"uniform"}' > tmpid 
SMPL_ID=$( cat tmpid ) && rm tmpid
echo ${SMPL_ID}
