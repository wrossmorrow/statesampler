#!/bin/bash

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
#
# 	statesampler node/shell deploy script
# 
#   Copyright 2018 William Ross Morrow
#
#   Licensed under a modified Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       https://github.com/wrossmorrow/statesampler/LICENSE.md
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
#
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 

# load environment variables
set -a && source .env && set +a

# set defaults
[[ -z ${STATESAMPLER_HOME_DIR} ]] && STATESAMPLER_HOME_DIR="/etc/statesampler"
[[ -z ${STATESAMPLER_LOG_DIR}  ]] && STATESAMPLER_LOG_DIR="/var/log/statesampler"
[[ -z ${STATESAMPLER_NODE_EXE} ]] && STATESAMPLER_NODE_EXE="/usr/local/bin/node"

# make sure home and log dirs exist, make a service folder too
mkdir -p ${STATESAMPLER_HOME_DIR} ${STATESAMPLER_HOME_DIR}
mkdir ${STATESAMPLER_HOME_DIR}/service

# create environment file
env | grep '^STATESAMPLER_' > ${STATESAMPLER_HOME_DIR}/service/.env

# copy start and stop, and make them user-executable
cp service/statesampler.start ${STATESAMPLER_HOME_DIR}/service/start
cp service/statesampler.stop  ${STATESAMPLER_HOME_DIR}/service/stop
chmod u+x ${STATESAMPLER_HOME_DIR}/st*

# copy source files, package.json, and install
cp -r src ${STATESAMPLER_HOME_DIR}/
cp package.json ${STATESAMPLER_HOME_DIR}/
D=${PWD} && cd ${STATESAMPLER_HOME_DIR} && npm install && cd ${D}

# user setup
sudo useradd -r statesampler
sudo chown -R statesampler: ${STATESAMPLER_HOME_DIR} ${STATESAMPLER_LOG_DIR}

# create unit file for the service
echo "# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
#
# 	systemd unit file for State Sampler server
#
# 	Use: 
# 
# 		place in /etc/systemd/system
# 		systemctl enable statesampler.service
# 		systemctl start statesampler.service
# 
#   Copyright 2018 William Ross Morrow
#
#   Licensed under a modified Apache License, Version 2.0 (the \"License\");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       https://github.com/wrossmorrow/statesampler/LICENSE.md
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an \"AS IS\" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
#
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 

[Unit]
Description=State Sampler Server for Qualtrics Surveys
After=network.target

[Service]
User=statesampler
Group=statesampler
Type=forking
StandardOutput=syslog
StandardError=syslog
WorkingDirectory=${STATESAMPLER_HOME_DIR}
EnvironmentFile=${STATESAMPLER_HOME_DIR}/service/.env
ExecStart=${STATESAMPLER_HOME_DIR}/service/start
PIDFile=${STATESAMPLER_LOG_DIR}/.pid
ExecStop=${STATESAMPLER_HOME_DIR}/service/stop
Restart=always

[Install]
WantedBy=multi-user.target" > /etc/systemd/system/statesampler.service

# service setup
sudo systemctl daemon-reload
sudo systemctl enable statesampler.service
sudo systemctl start statesampler.service
sudo systemctl status statesampler.service