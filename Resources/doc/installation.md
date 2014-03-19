Installation
============

This describes the customized installation, usually used by developers.

A end-user zip package can be downloaded at http://jarves.org when we've released the first alpha version.

### 1. [Install Symfony](http://symfony.com/doc/current/book/installation.html)
### 2. Install the JarvesBundle

Download all php files:

Check first that you have `"minimum-stability": "dev",` in your `composer.json`.

```bash
./composer.phar require jarves/jarves-bundle
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

### 3. Define the database configuration

You have four ways to configure your database. Choose one of them.

### 3.1 Through symfony

This is the default symfony way to define your database connection configuration.

In `app/config/paramters.yml`:

```
parameters:
     database_driver: pdo_mysql
     database_host: 127.0.0.1
     database_port: null
     database_name: symfony
     database_user: root
     database_password: null
```

### 3.2 Through the Jarves cms configuration

With this configuration you have more possibilies to configure your database.

For example, you can define here table-prefix or a master with slave connections.

You can either use the `jarves:configuration:database` command or edit the `app/config/config.jarves.xml` file directly.

#### 3.2.1 Using the installation script

Copy the installation script to your public folder:

```bash
   cp vendor/jarves/jarves-bundle/Jarves/Resources/meta/installation-wizard.php.dist web/install.php
```

Open the `install.php` script in your browser and follow the wizard.

#### 3.2.2 Using the configuration command

```
$ app/console jarves:configuration:database --help
Usage:
 jarves:configuration:database type database-name username [pw] [server] [port]

Arguments:
 type                  database type: mysql|pgsql|sqlite
 database-name         database name
 username              database login username
 pw                    use '' to define a empty password
 server                hostname or ip
 port

Options:
 --help (-h)           Display this help message.
 --quiet (-q)          Do not output any message.
 --verbose (-v|vv|vvv) Increase the verbosity of messages: 1 for normal output, 2 for more verbose output and 3 for debug
 --version (-V)        Display this application version.
 --ansi                Force ANSI output.
 --no-ansi             Disable ANSI output.
 --no-interaction (-n) Do not ask any interactive question.
 --shell (-s)          Launch the shell.
 --process-isolation   Launch commands from shell as a separate process.
 --env (-e)            The Environment name. (default: "dev")
 --no-debug            Switches off debug mode.

Help:

 You can set with this command configuration values inside the app/config/config.jarves.xml file.

 It overwrites only options that you provide.
```

```bash
app/console jarves:configuration:database mysql symfony root ''
```

#### 3.2.3 or Editing the jarves configuration directly

```bash
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
