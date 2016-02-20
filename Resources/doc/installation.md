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
app/console jarves:models:build
app/console jarves:schema:update #updates database's schema
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



The frontend routes are loaded automatically.
