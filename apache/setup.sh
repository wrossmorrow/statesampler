#!/bin/bash

if [ "$#" -lt 1 ]; then
    echo "Illegal number of parameters. Expects at least a server name, maybe a webmaster address."
elif [ "$#" -eq 1 ]; then
	SERVERDNS=$1
    WEBMASTER="webmaster@localhost"
else 
	SERVERDNS=$1
    WEBMASTER=$2
fi

a2dissite 000-default.conf 000-default-le-ssl.conf

F="/etc/apache2/sites-available/000-default.conf"
mv $F $F.orig
sed "s/my.server.com/${SERVERDNS}/g;s/webmaster@localhost/${WEBMASTER}/g" vhost.conf > $F

F="/etc/apache2/sites-available/000-default-le-ssl.conf"
mv $F $F.orig
sed "s/my.server.com/${SERVERDNS}/g;s/webmaster@localhost/${WEBMASTER}/g" vhost_ssl.conf > $F

a2ensite 000-default.conf 000-default-le-ssl.conf

a2enmod ssl proxy proxy_http
systemctl restart apache2.service
systemctl status apache2.service