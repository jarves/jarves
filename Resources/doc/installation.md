Installation
============

This describes the customized installation, usually used by developers.

A end-user zip package can be downloaded at http://jarves.io when we've released the first alpha version.

### 1. [Install Symfony](http://symfony.com/doc/current/book/installation.html) (2.8)

```bash
symfony new website-with-jarves 2.8
```

### 2.1 Install the Jarves bundles for development/testing

```bash
cd src
git clone git@github.com:jarves/jarves.git Jarves
cd Jarves
git clone git@github.com:jarves/jarves-publication.git Publication
git clone  git@github.com:jarves/jarves-demotheme.git DemoTheme
```

### 2.2 or install all Jarves bundles using composer

```bash
composer require jarves/jarves
composer require jarves/jarves-publication
composer require jarves/jarves-demotheme
```

Activate the bundle in your AppKernel:

```php
<?php
// app/AppKernel.php

public function registerBundles()
{
    $bundles = array(
        // ...


        // our dependencies - it's important that these come before Jarves
        new Propel\Bundle\PropelBundle\PropelBundle(),
        new FOS\RestBundle\FOSRestBundle(),
        new Nelmio\ApiDocBundle\NelmioApiDocBundle(),

        // Jarves
        new Jarves\JarvesBundle(),
        new Jarves\DemoTheme\JarvesDemoThemeBundle(),
        new Jarves\Publication\JarvesPublicationBundle(),
    );
}
```

Add following composer dependencies to the root `composer.json`:

```json

   "require": [


        "propel/propel-bundle": "2.0.x-dev@dev",
        "propel/propel": "dev-master",
        "sybio/image-workshop": ">=2",
        "michelf/php-markdown": ">=1.3",
        "composer\/composer": "1.0.0",
        "friendsofsymfony/rest-bundle": "^2.0.0",
        "nelmio/api-doc-bundle": "~2.5",
        "icap/html-diff": ">=1.0.1",
        "leafo/scssphp": ">=0.6.1"
    ]
```

do **not** run `composer update` yet.

Remove in `composer.json` the `config.platform.php` settings (latest lines).

Use `"symfony-assets-install": "symlink"` if your system supports symlinks.

Composer.json should look like:

```json
{
    "name": "aetros/aetros.com",
    "license": "proprietary",
    "type": "project",
    "autoload": {
        "psr-4": {
            "": "src/"
        },
        "classmap": [
            "app/AppKernel.php",
            "app/AppCache.php"
        ]
    },
    "require": {
        "php": ">=5.3.9",
        "symfony/symfony": "2.8.*",
        "doctrine/orm": "^2.4.8",
        "doctrine/doctrine-bundle": "~1.4",
        "symfony/swiftmailer-bundle": "~2.3",
        "symfony/monolog-bundle": "~2.4",
        "sensio/distribution-bundle": "~5.0",
        "sensio/framework-extra-bundle": "^3.0.2",
        "incenteev/composer-parameter-handler": "~2.0",

        "propel/propel-bundle": "2.0.x-dev@dev",
        "propel/propel": "dev-master",
        "sybio/image-workshop": ">=2",
        "michelf/php-markdown": ">=1.3",
        "composer\/composer": "1.0.0",
        "friendsofsymfony/rest-bundle": "^2.0.0",
        "nelmio/api-doc-bundle": "~2.5",
        "icap/html-diff": ">=1.0.1",
        "leafo/scssphp": ">=0.6.1"

    },
    "require-dev": {
        "sensio/generator-bundle": "~3.0",
        "symfony/phpunit-bridge": "~2.7"
    },
    "scripts": {
        "post-install-cmd": [
            "Incenteev\\ParameterHandler\\ScriptHandler::buildParameters",
            "Sensio\\Bundle\\DistributionBundle\\Composer\\ScriptHandler::buildBootstrap",
            "Sensio\\Bundle\\DistributionBundle\\Composer\\ScriptHandler::clearCache",
            "Sensio\\Bundle\\DistributionBundle\\Composer\\ScriptHandler::installAssets",
            "Sensio\\Bundle\\DistributionBundle\\Composer\\ScriptHandler::installRequirementsFile",
            "Sensio\\Bundle\\DistributionBundle\\Composer\\ScriptHandler::prepareDeploymentTarget"
        ],
        "post-update-cmd": [
            "Incenteev\\ParameterHandler\\ScriptHandler::buildParameters",
            "Sensio\\Bundle\\DistributionBundle\\Composer\\ScriptHandler::buildBootstrap",
            "Sensio\\Bundle\\DistributionBundle\\Composer\\ScriptHandler::clearCache",
            "Sensio\\Bundle\\DistributionBundle\\Composer\\ScriptHandler::installAssets",
            "Sensio\\Bundle\\DistributionBundle\\Composer\\ScriptHandler::installRequirementsFile",
            "Sensio\\Bundle\\DistributionBundle\\Composer\\ScriptHandler::prepareDeploymentTarget"
        ]
    },
    "config": {
        "bin-dir": "bin"
    },
    "extra": {
        "symfony-app-dir": "app",
        "symfony-web-dir": "web",
        "symfony-assets-install": "symlink",
        "incenteev-parameters": {
            "file": "app/config/parameters.yml"
        }
    }
}
```


### 3. Define the jarves configuration

```bash
   cp src/Jarves/Resources/meta/config.xml.dist app/config/config.jarves.xml
   #or if from composer
   cp vendor/jarves/jarves-bundle/Jarves/Resources/meta/config.xml.dist app/config/config.jarves.xml
```

Adjust the `<database>` configuration in `app/config/config.jarves.xml`.

Pro tip: You can completely remove `<database>` section, then Symfony is using the database settings from your `app/config/parameters.yml`.
If you use this ``<database>` configuration way, then all database related stuff regarding Propel from your `app/config` is overwritten.
This database section modifies only Propel connection settings (not Doctrine or other services that use `app/config/parameters.yml` `database_*` parameters)

```xml
  <database>
    <connections>
      <!--
        type: mysql|pgsql|sqlite (the pdo driver name)
        persistent: true|false (if the connection should be persistent)
        slave: true|false (if the connection is a slave or not (readonly or not))
        charset: 'utf8'
      -->
      <connection type="mysql" persistent="false" charset="utf8" slave="false">
        <!--Can be a IP or a hostname. For SQLite enter here the path to the file.-->
        <server>127.0.0.1</server>
        <port></port>
        <!--The schema/database name-->
        <name>test</name>
        <username>root</username>
        <password></password>
      </connection>
    </connections>
  </database>
```

Adjust in `app/config/config.jarves.xml` `<groupOwner>www-data</groupOwner>` to a group that your websites is running in.
For OSX its mostly `_www` or `staff`, and for Ubuntu/Debian `www-data`.

Now **run** `composer update`.

### 4. Setup models and database schema

```bash
php app/console propel:model:build #build base model

php app/console propel:migration:diff #generates a database schema diff
php app/console propel:migration:up #upgrade the database schema

#installs demo data
app/console jarves:install:demo localhost /
```

### 5. Setup the administration route. Open `app/config/routing.yml` and paste this route:

```yaml
jarves:
    resource: "@JarvesBundle/Resources/config/routing.yml"
```

### 6. Verify

run

```bash
php app/console server:run
# open http://127.0.0.1:8000/jarves
```

Username and password for the administration login (http://localhost:8000/jarves) is both `admin`.

REST API doc powered by NelmioApiBundle is available at # open http://localhost:8000/jarves/doc.

The frontend routes are loaded automatically.