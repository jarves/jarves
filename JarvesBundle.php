<?php

/**
 * This is the main bundle class for
 *
 * Jarves - content management.
 *
 *   J.A.R.V.E.S - Just a rather very easy (content management) system.
 */
namespace Jarves;

use Jarves\Cache\Cacher;
use Jarves\Configuration\Connection;
use Jarves\Configuration\Database;
use Jarves\DependencyInjection\AssetCompilerCompilerPass;
use Jarves\DependencyInjection\ContentTypesCompilerPass;
use Jarves\DependencyInjection\FieldTypesCompilerPass;
use Jarves\DependencyInjection\ModelBuilderCompilerPass;
use Propel\Runtime\Connection\ConnectionManagerMasterSlave;
use Propel\Runtime\Connection\ConnectionManagerSingle;
use Propel\Runtime\Propel;
use Propel\Runtime\ServiceContainer\StandardServiceContainer;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\HttpKernel\Bundle\Bundle;

class JarvesBundle extends Bundle
{
    /**
     * @var boolean
     */
    protected $booted = false;

    public function build(ContainerBuilder $container)
    {
        parent::build($container);
        $container->addCompilerPass(new ContentTypesCompilerPass());
        $container->addCompilerPass(new FieldTypesCompilerPass());
        $container->addCompilerPass(new ModelBuilderCompilerPass());
        $container->addCompilerPass(new AssetCompilerCompilerPass());
//        $container->addCompilerPass(new TwigGlobalsCompilerPass());

        //necessary to get fos_rest_bundle working
        $container->loadFromExtension('framework', [
            'serializer' => ['enabled' => true]
        ]);

        if ($container->hasParameter('jarves_admin_prefix')) {
            $container->setParameter('jarves_admin_prefix', 'jarves/');
        }
    }

    public function boot()
    {
        parent::boot();

        $this->configure();

        if (!$this->booted) {

            /** @var $jarves Jarves */
            $jarves = $this->container->get('jarves');

            /** @var JarvesConfig $jarvesConfig */
            $jarvesConfig = $this->container->get('jarves.config');

            $twig = $this->container->get('twig');
            $twig->addGlobal('jarves_content_render', $this->container->get('jarves.content.render'));


            if ($jarvesConfig->getSystemConfig()->getLogs(true)->isActive()) {
                /** @var $logger \Symfony\Bridge\Monolog\Logger */
                $logger = $this->container->get('logger');

                $logger->pushHandler($this->container->get('jarves.logger.handler'));
            }
        }

        $this->booted = true;
    }

    /**
     * Configures jarves, reads config files. Necessary when .xml configs changed.
     */
    public function configure()
    {
        /** @var $jarves Jarves */
        $jarves = $this->container->get('jarves');

        /** @var Cacher $cacher */
        $cacher = $this->container->get('jarves.cache.cacher');

        /** @var JarvesConfig $jarvesConfig */
        $jarvesConfig = $this->container->get('jarves.config');

        /** @var $jarvesEventDispatcher JarvesEventDispatcher */
        $jarvesEventDispatcher = $this->container->get('jarves.event_dispatcher');

        $jarves->prepareWebSymlinks();
        $jarves->loadBundleConfigs($cacher);
        $this->loadPropelConfig($jarvesConfig->getSystemConfig()->getDatabase());

        $jarvesEventDispatcher->registerBundleEvents($jarves->getConfigs());
    }

    /**
     * @param Database $database
     */
    public function loadPropelConfig(Database $database)
    {
        /** @var StandardServiceContainer $serviceContainer */
        $serviceContainer = Propel::getServiceContainer();

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
}
