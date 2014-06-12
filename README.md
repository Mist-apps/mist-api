Mist API
========

The Mist API is the main part of the Mist application. It provide CRUD methods for all the resources, and authentication methods for security.

## Installation

The API works in standalone with it's own webserver. But it is not recommended to use it directly in production for security reasons. Use Nginx as proxy to listen on the port 80 and forward the requests to thew ebserver listening on port 8080 for examle. For a developpement installation, you may use the integrated webserver without nginx.

The API rely on a MongoDB database for storing data.

The "build-essentials" package is needed to compile some node modules dependencies. For example, the BSON module is compiled during installation. If the package is not installed, another library, much slower, will be used.

A deploy script is available to deploy the application automatically. It deploys in development or production environment. In production, it connects to the git repository to get changes from the master branch. In development , it rsync from your sources directory to the deployment directory.

These manual works on debian-like distros (tested on Debian/Ubuntu).

#### All:
* add debian backports repository: `egrep -q "deb .*backports" /etc/apt/sources.list || echo "deb http://ftp.fr.debian.org/debian/ wheezy-backports main" | sudo tee -a /etc/apt/sources.list > /dev/null`
* update the package indexes: `sudo apt-get update`
* install nodejs: `sudo apt-get install nodejs nodejs-legacy`
* install build-essentials: `sudo apt-get install build-essentials`
* install mongoDB: `sudo apt-get install mongodb`

#### For a production installation:
* install nginx: `sudo apt-get install nginx`
* add the vhost: `sudo mv mist-api /etc/nginx/etc/sites-available/mist-api && sudo chown root:root /etc/nginx/etc/sites-available/mist-api`
* enable the vhost: `sudo ln -s /etc/nginx/etc/sites-available/mist-api /etc/nginx/etc/sites-enabled/mist-api`
* reload nginx: `sudo service nginx reload`

#### For a development installation:
* clone the repository where you want: `git clone https://github.com/lolo88l/mist-api.git /path/to/sources`
* go into the cloned repository: `cd /path/to/sources`
* install the dependencies: `npm install`

#### All:
* edit the deploy script: `vim deploy`
* change the constants to match your paths. DEPLOY_PATH_* = where the files will be deployed, defaults are good. DEV_PATH_* = where your dev sources are stored (git clone), no need to change them for a production installation. *_API_URL = the url of the api for the web application. You need to change the one that match your installation (prod/dev).
* add the deploy script: `sudo mv deploy /usr/local/bin/ && sudo chown root:root /usr/local/bin/deploy`
* add the init-script: `sudo mv mist-api /etc/init.d/ && sudo chown root:root /etc/init.d/mist-api`

#### For a production installation:
* deploy the app: `deploy prod`
* go into the sources path defined in the deployment script: `cd /path/to/sources`
* install the dependencies: `sudo npm install`

#### For a development installation:
* deploy the app: `deploy dev`

That's all ! Updating can be done by executing only the command: deploy dev/prod
