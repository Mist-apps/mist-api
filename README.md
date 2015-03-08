Mist API
========

The Mist API is the main part of the Mist application. It provide CRUD methods for all the resources, and authentication methods for security.

## Installation

The API works in standalone with it's own webserver. But it is not recommended to use it directly in production for security reasons. Use Nginx as proxy to listen on the port 80 and forward the requests to the webserver listening on port 8080 for examle. For a developpement installation, you may use the integrated webserver without nginx.

The API rely on a MongoDB database for storing data.

The "build-essentials" package is needed to compile some node modules dependencies. For example, the BSON module is compiled during installation. If the package is not installed, another library, much slower, will be used.

A deploy script is available to deploy the application automatically. It deploys in development or production environment. In production, it connects to the git repository to get changes from the master branch. In development , it rsync from your sources directory to the deployment directory.

These manual works on debian-like distros (tested on Debian/Ubuntu).

#### All:
* add debian backports repository: `egrep -q "deb .*backports" /etc/apt/sources.list || echo "deb http://ftp.fr.debian.org/debian/ wheezy-backports main" | sudo tee -a /etc/apt/sources.list > /dev/null`
* update the package indexes: `sudo apt-get update`
* install nodejs: `sudo apt-get install nodejs nodejs-legacy`
* install npm: `curl https://www.npmjs.com/install.sh | sudo sh`
* install build-essential: `sudo apt-get install build-essential`
* install mongoDB: `sudo apt-get install mongodb`

#### For a development installation:
* clone the repository where you want: `git clone https://github.com/Mist-apps/mist-api.git /path/to/sources`
* go into the cloned repository: `cd /path/to/sources`
* install the dependencies: `npm install`

It's done ! You may start develop the web application:
* To run the api integrated webserver, use the `node api.js` command into the sources path.
* You may access the api on http://localhost:8080.
* If you want to change the database connection information, or the integrated web-server URL and port, you can change the `/path/to/sources/config.json` file.

#### For a production installation:
* clone the repository in the opt folder: `sudo git clone https://github.com/Mist-apps/mist-api.git /opt/mist-api`
* go into the cloned repository: `cd /opt/mist-api`
* install the dependencies: `sudo npm install`
* install nginx: `sudo apt-get install nginx`
* create the vhost file: `sudo vim /etc/nginx/etc/sites-available/mist-api`
* add these contents:
``` Nginx
server {

    listen 80;

    server_name my-api-domain-name;

    access_log   /var/log/nginx/mist-api.access.log;
    error_log    /var/log/nginx/mist-api.error.log;

    location / {
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   Host      $http_host;
        proxy_pass         http://127.0.0.1:8080;
    }

}
```
* set the rights on the vhost file: `sudo chown root:root /etc/nginx/etc/sites-available/mist-api`
* enable the vhost: `sudo ln -s /etc/nginx/etc/sites-available/mist-api /etc/nginx/etc/sites-enabled/mist-api`
* reload nginx: `sudo service nginx reload`
* create the init-script: `sudo vim /etc/init.d/mist-api`
* add these content:
``` Shell
#! /bin/sh

# Author: Leleux Laurent <lolo88l@hotmail.com>

DESC="Mist API Server"
NAME="Mist API"
SHORTNAME="mist-api"
DAEMON="/opt/mist-api/api.js"
DAEMON_ARGS=""
PIDFILE="/var/run/${SHORTNAME}.pid"
SCRIPTNAME="/etc/init.d/${SHORTNAME}"
LOGFILE="/var/log/${SHORTNAME}.log"
MAX_STOP_DURATION=15

# Exit if the package is not installed
[ -f "$DAEMON" ] || exit 0

# Delete old pidfile without process
if [ -f "$PIDFILE" ]; then
        pid=`cat "$PIDFILE"`
        [ -z "`ps -eaf | grep $pid | grep $DAEMON`" ] && rm -f $PIDFILE
fi

#
# Function that starts the daemon/service
# Return
#   0 if daemon has been started
#   1 if daemon was already running
#   2 if daemon could not be started
#
do_start()
{
        [ -f "$PIDFILE" ] && return 1
        logdir=`dirname $LOGFILE`
        [ -d "$logdir" ] || mkdir $logdir
        nohup "node" "$DAEMON" 0<"/dev/null"  1>>"$LOGFILE" 2>&1 &
        [ $? -ne 0 ] && return 2
        echo $! > $PIDFILE
        return 0
}

#
# Function that stops the daemon/service
# Return
#   0 if daemon has been stopped
#   1 if daemon was already stopped
#   2 if daemon could not be stopped
#
do_stop()
{
        [ -f "$PIDFILE" ] || return 1
        kill `cat $PIDFILE`
        [ $? -ne 0 ] && return 2
        duration=0
        until [ -z "`ps -eaf | grep $pid | grep $DAEMON`" ] || [ $duration -ge $MAX_STOP_DURATION ]; do
                echo -n "."
                sleep 0.5
        done
        echo -n " "
        [ $duration -ge $MAX_STOP_DURATION ] && return 2
        rm -f $PIDFILE
        return 0
}

#
# Read command and execute it
#
case "$1" in
        start)
                echo -n "Starting $NAME ... "
                do_start
                case "$?" in
                        0) echo "[OK]" ;;
                        1) echo "[Fail]\nService already started" ;;
                        2) echo "[Fail]" ;;
                esac
                ;;
        stop)
                echo -n "Stopping $NAME "
                do_stop
                case "$?" in
                        0) echo "[OK]" ;;
                        1) echo "[Fail]\nService already stopped" ;;
                        2) echo "[Fail]" ;;
                esac
                ;;
        restart)
                echo -n "Restarting $NAME "
                do_stop
                case "$?" in
                        0|1) do_start
                                 case "$?" in
                                        0) echo "[OK]" ;;
                                        1) echo "[Fail]\nService already started" ;;
                                        2) echo "[Fail]" ;;
                                 esac
                                 ;;
                        2) echo "[Fail]\nUnable to stop $NAME" ;;
                esac
                ;;
        status)
                [ -f "$PIDFILE" ] && echo "Service $NAME is running with pid `cat $PIDFILE`" || echo "Service $NAME is stopped"
                ;;
        *)
                echo "Usage: $SCRIPTNAME {start|stop|status|restart}" >&2
                exit 3
                ;;
esac
```
* set the rights on the init-script`sudo chown root:root /etc/init.d/mist-api`
* let the integrated web-server start on boot: `sudo update-rc.d mist-api defaults`

It's done ! You may access the api on http://my-api-domain-name/. If you want to change the database connection information, or the integrated web-server URL and port, you can change the `/path/to/sources/config.json` file. Be careful, if you changes the integrated webserver parameters, you must adapt the `/etc/nginx/etc/sites-available/mist-api` config file to match the right webserver. Otherwise, nginx (as proxy) will forward the requests to the wrong server.
