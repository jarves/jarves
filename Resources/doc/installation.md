Installation
============

This describes the customized installation, usually used by developers.

A end-user zip package can be downloaded at http://jarves.io when we've released the first alpha version.

### 1. [Install Symfony](http://symfony.com/doc/current/book/installation.html)
### 2. Install the JarvesBundle for Developer and testing

```bash
cd src
git clone git@github.com:jarves/jarves.git Jarves
cd Jarves
git clone git@github.com:jarves/jarves-publication.git Publication
git clone  git@github.com:jarves/jarves-demotheme.git DemoTheme
```

Activate the bundle in your AppKernel:

```php
<?php
// app/AppKernel.php

public function registerBundles()
{
    $bundles = array(
        // ...
        new Jarves\JarvesBundle(),
        new Jarves\DemoTheme\JarvesDemoThemeBundle(),
        new Jarves\Publication\JarvesPublicationBundle(),

        // our dependencies
        new FOS\RestBundle\FOSRestBundle(),
        new JMS\SerializerBundle\JMSSerializerBundle(),
        new Nelmio\ApiDocBundle\NelmioApiDocBundle(),
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
        "composer\/composer": "1.0.*@dev",
        "friendsofsymfony/rest-bundle": "1.1.*",
        "jms/serializer-bundle": "0.12.*",
        "nelmio/api-doc-bundle": "~2.5",
        "icap/html-diff": ">=1.0.1",
        "leafo/scssphp": ">=0.6.1"
    ]
```

and run `composer update`.

### 3. Define the jarves configuration

```bash
   cp src/Jarves/Resources/meta/config.xml.dist app/config/config.jarves.xml
   #or if from composer
   cp vendor/jarves/jarves-bundle/Jarves/Resources/meta/config.xml.dist app/config/config.jarves.xml
```

   Either you define your database settings in the Symfony way (in`app/config/paramters.yml`) or
   you can uncomment the `<database>` (by removing the `_` character) configuration in `app/config/config.jarves.xml`.

   Example:

```xml
  <database>
    <!--All tables will be prefixed with this string. Best practise is to suffix it with a underscore.
    Examples: dev_, domain_ or prod_-->
    <prefix>jarves_</prefix>
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

### 4. Setup models and database schema

```bash

#build propel's schema.xml for each Bundle, only necessary if Jarves object definitions have changed
php app/console jarves:orm:build:propel Jarves
php app/console jarves:orm:build:propel JarvesPublication

# this is required
php app/console propel:model:build #build base model

php app/console propel:migration:diff #generates a database schema diff
php app/console propel:migration:up #upgrade the database schema

#installs demo data
app/console jarves:install:demo localhost /web-folder/ #the web-folder is usually just /
```

Important: If you haven't configured a database-prefix the `jarves:schema:update` will **DROP ALL TABLES** in the current
database that are not port of Jarves cms.

### 5. Setup the administration route. Open `app/config/routing.yml` and paste this route:

```yaml
jarves:
    resource: "@JarvesBundle/Resources/config/routing.yml"
```

Define the `jarves_admin_prefix` parameter:

```yaml
# app/config/parameters.yml
parameters:
    # ...
    jarves_admin_prefix: /jarves
```

### 6. Verify

run

```bash
php app/console server:run
# open http://127.0.0.1/jarves
```

REST API doc powered by NelmioApiBundle is available at # open http://127.0.0.1/jarves/doc.


The frontend routes are loaded automatically.
