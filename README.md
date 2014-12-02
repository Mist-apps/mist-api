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
* install build-essentials: `sudo apt-get install build-essentials`
* install mongoDB: `sudo apt-get install mongodb`

#### For a development installation:
* clone the repository where you want: `git clone https://github.com/Mist-apps/mist-api.git /path/to/sources`
* go into the cloned repository: `cd /path/to/sources`
* install the dependencies: `npm install`

It's done ! You may access the api on http://localhost:8080. If you want to change the database connection information, or the integrated web-server URL and port, you can change the `/path/to/sources/config.json` file.

#### For a production installation:
* clone the repository in the opt folder: `sudo git clone https://github.com/Mist-apps/mist-api.git /opt/mist-api`
* go into the cloned repository: `cd /opt/mist-api`
* install the dependencies: `sudo npm install`
* install nginx: `sudo apt-get install nginx`
* add the vhost: `sudo mv mist-api /etc/nginx/etc/sites-available/mist-api && sudo chown root:root /etc/nginx/etc/sites-available/mist-api`
* enable the vhost: `sudo ln -s /etc/nginx/etc/sites-available/mist-api /etc/nginx/etc/sites-enabled/mist-api`
* reload nginx: `sudo service nginx reload`
* add the init-script: `sudo mv mist-api /etc/init.d/ && sudo chown root:root /etc/init.d/mist-api`
* let the integrated web-server start on boot: `sudo update-rc.d mist-api defaults`

It's done ! You may access the api on http://my-api-domain-name/. If you want to change the database connection information, or the integrated web-server URL and port, you can change the `/path/to/sources/config.json` file. Be careful, if you changes the integrated webserver parameters, you must adapt the `/etc/nginx/etc/sites-available/mist-api` config file to match the right webserver. Otherwise, nginx (as proxy) will forward the requests to the wrong server.
