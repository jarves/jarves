<?php

namespace Jarves\Propel;

use Jarves\Configuration\Connection;
use Jarves\Jarves;
use Jarves\Exceptions\FileNotWritableException;
use Propel\Generator\Command\MigrationDiffCommand;
use Propel\Generator\Command\ModelBuildCommand;
use Propel\Runtime\Connection\ConnectionManagerMasterSlave;
use Propel\Runtime\Connection\ConnectionManagerSingle;
use Propel\Runtime\Propel;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\StreamOutput;
use Symfony\Component\Finder\Finder;

/**
 * Class PropelHelper
 *
 * @package Core
 */
class PropelHelper
{
    /**
     * @var array
     */
    public $objectsToExtension = array();
    /**
     * @var array
     */
    public $classDefinition = array();

    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @param Jarves $jarves
     */
    function __construct(Jarves $jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @param Jarves $jarves
     */
    public function setJarves($jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @return Jarves
     */
    public function getJarves()
    {
        return $this->jarves;
    }

    /**
     * @return string
     */
    public function init()
    {
        try {
            $result = $this->fullGenerator();
        } catch (\Exception $e) {
//            self::cleanup();
            throw new \Exception('Propel initialization Error.', 0, $e);
        }

//        self::cleanup();

        return $result;
    }

    /**
     * @return string
     */
    public function getTempFolder()
    {
        $kernel = $this->getJarves()->getKernel();

        return $kernel->getCacheDir() . '/propel/';
    }

    /**
     *
     */
    public function cleanup()
    {
        $fs = $this->getJarves()->getCacheFileSystem();
        if ($fs->has('propel')) {
            $fs->delete('propel');
        }
    }

    /**
     * @return array
     */
    public function checkModelXml()
    {
        $bundles = $this->getJarves()->getKernel()->getBundles();
        $errors = [];
        foreach ($bundles as $bundleName => $bundle) {

            if (file_exists($schema = $bundle->getPath() . '/Resources/config/jarves.propel.schema.xml')) {
                simplexml_load_file($schema);
                if ($errors = libxml_get_errors()) {
                    $errors[$schema] = $errors;
                }

            }
        }

        return $errors;
    }

    /**
     * @return string
     */
    public function fullGenerator()
    {
        $this->writeConfig();
        $this->writeBuildProperties();
        $this->collectSchemas();

        $content = '';

        $content .= $this->generateClasses();
        $content .= $this->updateSchema();

        return $content;
    }

    /**
     * @return string
     * @throws \Exception
     */
    public function generateClasses()
    {
        $tmp = $this->getJarves()->getKernel()->getCacheDir() . '/';

        if (!file_exists($tmp . 'propel')) {
            self::writeConfig();
            self::writeBuildProperties();
            self::collectSchemas();
        }

        $platform = $this->getJarves()->getSystemConfig()->getDatabase()->getMainConnection()->getType();
        $platform = ucfirst($platform) . 'Platform';

        $input = new ArrayInput(array(
            '--config-dir' => $tmp . 'propel/',
            '--schema-dir' => $tmp . 'propel/',
            '--output-dir' => $tmp . 'propel/build/classes/',
            '--platform' => $platform,
            '--verbose' => 'vvv'
        ));
        $command = new ModelBuildCommand();
        $command->getDefinition()->addOption(
            new InputOption('--verbose', '-v|vv|vvv', InputOption::VALUE_NONE, '') //because migrationDiffCommand access this option
        );

        $output = new StreamOutput(fopen('php://memory', 'rw'));
        $command->run($input, $output);
        $content = stream_get_contents($output->getStream());
        $content .= self::moveClasses();

        return $content;
    }

    /**
     * @return string
     * @throws \FileNotWritableException
     */
    public function moveClasses()
    {
        $fs = $this->getJarves()->getCacheFileSystem();
        $tmp = $this->getJarves()->getKernel()->getCacheDir() . '/';
        $result = '';

        if ($fs->has('propel-classes')) {
            $fs->delete('propel-classes');
        }

        $fs->rename('propel/build/classes', 'propel-classes');

        $bundles = $this->getJarves()->getKernel()->getBundles();

        foreach ($bundles as $bundleName => $bundle) {
            $source = $tmp
                . 'propel-classes/'
                . str_replace('\\', '/', ucfirst($bundle->getNamespace()))
                . '/Model';

            if (!is_dir($source)) {
                continue;
            }

            $files = Finder::create()
                ->files()
                ->in($source)
                ->depth(0)
                ->name('*.php');

            $result .= "$source" . "\n";

            foreach ($files as $file) {
                $target = $bundle->getPath() . '/Model/' . basename($file->getPathname());

                //$result .= "$file => " . (file_exists($target) + 0) . "\n";
                if (!file_exists($target)) {
                    try {
                        if (!is_dir(dirname($target))) {
                            mkdir(dirname($target));
                        }
                    } catch (\Exception $e) {
                        throw new \Exception(sprintf('Can not create directory `%s`.', dirname($target)), 0, $e);
                    }
                    if (!copy($file->getPathname(), $target)) {
                        throw new FileNotWritableException(tf('Can not move file %s to %s', $source, $target));
                    }
                }
                unlink($file->getPathname());
            }
        }

        return $result;

    }
    /**
     * @param Connection $connection
     * @param Connection[] $slaves
     *
     * @return string
     */
    public function getConnectionYml(Connection $connection, $slaves)
    {
        $dsn = $connection->getDsn();

        $user = var_export($connection->getUsername(), true);
        $password = var_export($connection->getPassword(), true);
        $dsn = var_export($dsn, true);
        $adapter = strtolower($connection->getType());
        $persistent = $connection->getPersistent() ? 'true' : 'false';

        foreach ($slaves as $slave) {
            $slaves .= '
          - dsn: ' . $slave->getDsn(true);

        }

        $slaves = '';

        $yml = <<<EOF
default:
        adapter: $adapter
        classname: \Propel\Runtime\Connection\PropelPDO
        dsn: $dsn
        user: $user
        password: $password
        options:
          ATTR_PERSISTENT: $persistent
        attributes:
          ATTR_EMULATE_PREPARES: true
        settings:
          charset: utf8
        slaves:
          $slaves
EOF;

        return $yml;
    }

    /**
     * @return bool
     * @throws \Exception
     */
    public function writeConfig()
    {
        $fs = $this->getJarves()->getCacheFileSystem();
        $path = $this->getJarves()->getKernel()->getCacheDir();

        try {
            $fs->mkdir('propel');
        } catch (\Exception $e) {
            throw new \Exception(sprintf('Can not create propel folder `%s`.', $path . '/propel'), 0, $e);
        }

        $config = $this->getJarves()->getSystemConfig();

        $connections = self::getConnectionYml($config->getDatabase()->getMainConnection(), $config->getDatabase()->getSlaveConnections());

        $yml = <<<EOF
propel:
  database:
    connections:
      $connections
  generator:
    defaultConnection: default
    connections:
      - default
#    objectModel:
#      disableIdentifierQuoting: true

  runtime:
    defaultConnection: default
    connections:
      - default

EOF;

        $fs->write('propel/propel.yml', $yml);

        return true;
    }

    public function loadConfig()
    {
        $serviceContainer = Propel::getServiceContainer();
        $database = $this->getJarves()->getSystemConfig()->getDatabase();

        if ($database->hasSlaveConnection()) {
            $manager = new ConnectionManagerMasterSlave();

            $config = $this->getManagerConfig($database->getMainConnection());
            $manager->setWriteConfiguration($config);

            $slaves = [];
            foreach ($database->getConnections() as $connection) {
                if ($connection->isSlave()) {
                    $slaves[] = $this->getManagerConfig($connection);
                }
            }
            $manager->setReadConfiguration($slaves);
        } else {
            $manager = new ConnectionManagerSingle();
            $config = $this->getManagerConfig($database->getMainConnection());
            $manager->setConfiguration($config);
        }

        $manager->setName('default');

        $serviceContainer->setAdapterClass('default', $database->getMainConnection()->getType());
        $serviceContainer->setConnectionManager('default', $manager);
        $serviceContainer->setDefaultDatasource('default');
    }

    public function getManagerConfig(Connection $connection)
    {
        $config = [];
        $config['dsn'] = $connection->getDsn();
        $config['user'] = (string)$connection->getUsername();
        $config['password'] = (string)$connection->getPassword();

        $config['options']['ATTR_PERSISTENT'] = (boolean)$connection->getPersistent();
        $config['settings']['charset'] = $connection->getCharset();

        return $config;
    }

    /**
     * Updates database's Schema.
     *
     * This function creates whatever is needed to do the job.
     * (means, calls writeXmlConfig() etc if necessary).
     *
     * This function inits the Propel class.
     *
     * @param  bool $withDrop
     *
     * @return string
     * @throws \Exception
     */
    public function updateSchema($withDrop = false)
    {
        $sql = self::getSqlDiff($withDrop);

        if (is_array($sql)) {
            throw new \Exception("Propel updateSchema failed: \n" . $sql[0]);
        }

        if (!$sql) {
            return "Schema up 2 date.";
        }

        $sql = explode(";\n", $sql);

        $this->loadConfig();
        $con = Propel::getWriteConnection('default');
        $tablePrefix = $this->getJarves()->getSystemConfig()->getDatabase()->getPrefix();
        $con->beginTransaction();
        try {
            foreach ($sql as $query) {
                if ($tablePrefix && 0 === strpos($query, 'DROP')) {
                    preg_match('/DROP ([^\s]*) /', $query, $match);
                    if (isset($match[1]) && $match[1]) {
                        $tableName = preg_replace('/[^a-zA-Z0-9_]\.\$/', '', $match[1]);
                        if (false !== $pos = strpos($tableName, '.')) {
                            $tableName = substr($tableName, $pos + 1);
                        }

                        if (0 === strpos($tableName, $tablePrefix)) {
                            //tablePrefix is in this table name at the beginning, so jump over
                            continue;
                        }
                    }
                }
                $con->exec($query);
            }
        } catch (\PDOException $e) {
            $con->rollBack();
            throw new \PDOException($e->getMessage() . ' in SQL: ' . $query);
        }
        $con->commit();

        return 'ok';
    }


    /**
     * @return bool
     */
    public function collectSchemas()
    {
        $cacheDir = $this->getJarves()->getKernel()->getCacheDir() . '/propel/';

        if (!is_dir($cacheDir)) {
            mkdir($cacheDir);
        }

        $finder = Finder::create()
            ->in($cacheDir)
            ->files()
            ->depth(0)
            ->name('*.schema.xml');

        foreach ($finder as $file) {
            unlink($file->getPathname());
        }

        $prefix = $this->getJarves()->getSystemConfig()->getDatabase()->getPrefix();
        $schemeData = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n  <database name=\"default\" tablePrefix=\"$prefix\" defaultIdMethod=\"native\"\n";

        $jarvesBehavior = '<behavior name="\\Jarves\\Propel\\JarvesBehavior" />';

        $bundles = $this->getJarves()->getKernel()->getBundles();

        foreach ($bundles as $bundleName => $bundle) {
            if (file_exists($schema = $bundle->getPath() . '/Resources/config/jarves.propel.schema.built.xml')) {

                $extension = $bundle->getNamespace();
                $tables = simplexml_load_file($schema);
                $newSchema = $schemeData . ' namespace="' . ucfirst($extension) . '\\Model">';

                foreach ($tables->table as $table) {
                    $newSchema .= $table->asXML() . "\n    ";
                }

                $newSchema .= "$jarvesBehavior</database>";

                $file = $bundleName . '.schema.xml';
                file_put_contents($cacheDir . $file, $newSchema);
            }

        }

        return true;
    }

    /**
     * @return array|string
     */
    public function getSqlDiff()
    {
        $tmp = $this->getJarves()->getKernel()->getCacheDir() . '/';

        if (!file_exists($tmp . 'propel/propel.yml')) {
            self::writeConfig();
            self::writeBuildProperties();
            self::collectSchemas();
        }

        //remove all migration files
        if (is_dir($tmp . 'propel/build/')) {
            $files = Finder::create()
                ->in($tmp . 'propel/build/')
                ->depth(0)
                ->name('PropelMigration_*.php');

            foreach ($files as $file) {
                unlink($file->getPathname());
            }
        }

        $platform = $this->getJarves()->getSystemConfig()->getDatabase()->getMainConnection()->getType();
        $platform = ucfirst($platform) . 'Platform';

        $input = new ArrayInput(array(
            '--config-dir' => $tmp . 'propel/',
            '--schema-dir' => $tmp . 'propel/',
            '--output-dir' => $tmp . 'propel/build/',
            '--platform' => $platform,
            '--verbose' => 'vvv'
        ));
        $command = new MigrationDiffCommand();
        $command->getDefinition()->addOption(
            new InputOption('--verbose', '-v|vv|vvv', InputOption::VALUE_NONE, '') //because migrationDiffCommand access this option
        );

        $output = new StreamOutput(fopen('php://memory', 'rw'));
        $command->run($input, $output);

        if (is_dir($tmp . 'propel/build/')) {
            $files = Finder::create()
                ->in($tmp . 'propel/build/')
                ->depth(0)
                ->name('PropelMigration_*.php');
            foreach ($files as $file) {
                $lastMigrationFile = $file->getPathname();
                break;
            }
        }

        if (!isset($lastMigrationFile) || !$lastMigrationFile) {
            return '';
        }

        preg_match('/(.*)\/PropelMigration_([0-9]*)\.php/', $lastMigrationFile, $matches);
        $clazz = 'PropelMigration_' . $matches[2];
        $uid = str_replace('.', '_', uniqid('', true));
        $newClazz = 'PropelMigration__' . $uid;

        $content = file_get_contents($lastMigrationFile);
        $content = str_replace('class ' . $clazz, 'class PropelMigration__' . $uid, $content);
        file_put_contents($lastMigrationFile, $content);

        include($lastMigrationFile);
        $obj = new $newClazz;

        $sql = $obj->getUpSQL();

        $sql = $sql['default'];
//        unlink($lastMigrationFile);

        // todo
//        if (is_array($protectTables = $this->getJarves()->getSystemConfig()->getDatabase()->getProtectTables())) {
//            foreach ($protectTables as $table) {
//                $table = str_replace('%pfx%', pfx, $table);
//                $sql = preg_replace('/^DROP TABLE (IF EXISTS|) ' . $table . '(\n|\s)(.*)\n+/im', '', $sql);
//            }
//        }
        $sql = preg_replace('/^#.*$/im', '', $sql);

        return trim($sql);
    }

    /**
     * @throws Exception
     */
    public function writeBuildProperties()
    {
        $fs = $this->getJarves()->getCacheFileSystem();

        $platform = $this->getJarves()->getSystemConfig()->getDatabase()->getMainConnection()->getType();
        $platform = ucfirst($platform) . 'Platform';

        $properties = '
propel.mysql.tableType = InnoDB

propel.platform = ' . $platform . '
propel.database.encoding = utf8
propel.project = jarves

propel.namespace.autoPackage = true
propel.packageObjectModel = true
propel.behavior.workspace.class = lib.WorkspaceBehavior
';

        return $fs->write('propel/build.properties', $properties);

    }

}
