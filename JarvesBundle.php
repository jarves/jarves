<?php
/**
 * This file is part of Jarves.
 *
 * (c) Marc J. Schmidt <marc@marcjschmidt.de>
 *
 *     J.A.R.V.E.S - Just A Rather Very Easy [content management] System.
 *
 *     http://jarves.io
 *
 * To get the full copyright and license information, please view the
 * LICENSE file, that was distributed with this source code.
 */

namespace Jarves;

use Jarves\Cache\Cacher;
use Jarves\Configuration\Connection;
use Jarves\Configuration\Database;
use Jarves\Configuration\EntryPoint;
use Jarves\DependencyInjection\AssetCompilerCompilerPass;
use Jarves\DependencyInjection\ModelBuilderCompilerPass;
use Propel\Runtime\Connection\ConnectionManagerMasterSlave;
use Propel\Runtime\Connection\ConnectionManagerSingle;
use Propel\Runtime\Propel;
use Propel\Runtime\ServiceContainer\StandardServiceContainer;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\ContainerInterface;
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
        $container->addCompilerPass(new ModelBuilderCompilerPass());
        $container->addCompilerPass(new AssetCompilerCompilerPass());

        //necessary to get fos_rest_bundle working
        $container->loadFromExtension('framework', [
            'serializer' => ['enabled' => true]
        ]);

        $container->loadFromExtension('security', [
            'encoders' => ['Jarves\Model\User' => 'bcrypt'],
            'providers' => ['jarves' => ['id' => 'jarves.user_provider']]
        ]);

        if ($container->hasParameter('jarves_admin_prefix')) {
            $container->setParameter('jarves_admin_prefix', 'jarves/');
        }
    }

    public function boot()
    {
        parent::boot();

        $this->configure();

        if (function_exists('ppm_log')) {
            //In an environment like PPM with several workers Propel's not distributed cache will
            //lead to inconsistent states across all workers, so we need to disable it here completely.
            //Jarves already caches using a distributed cache where all workers are notified when
            //a change changes, so we don't really need Propel's cache here.
            Propel::disableInstancePooling();
        }

        if (!$this->booted) {
            /** @var ContainerInterface $container */
            $container = $this->container;

            /** @var $jarves Jarves */
            $jarves = $container->get('jarves');

            /** @var JarvesConfig $jarvesConfig */
            $jarvesConfig = $container->get('jarves.config');

            $twig = $container->get('twig');
            $twig->addGlobal('jarves_content_render', $container->get('jarves.content.render'));
            $twig->addGlobal('pageStack', $container->get('jarves.page_stack'));


            if ($jarvesConfig->getSystemConfig()->getLogs(true)->isActive()) {
                /** @var $logger \Symfony\Bridge\Monolog\Logger */
                $logger = $container->get('logger');

                $logger->pushHandler($container->get('jarves.logger.handler'));
            }
        }

        $this->booted = true;
    }

    /**
     * Configures jarves, reads config files. Necessary when .xml configs changed.
     */
    public function configure()
    {
        /** @var ContainerInterface $container */
        $container = $this->container;

        /** @var $jarves Jarves */
        $jarves = $container->get('jarves');

        /** @var Cacher $cacher */
        $cacher = $container->get('jarves.cache.cacher');

        /** @var JarvesConfig $jarvesConfig */
        $jarvesConfig = $container->get('jarves.config');

        /** @var $jarvesEventDispatcher JarvesEventDispatcher */
        $jarvesEventDispatcher = $container->get('jarves.event_dispatcher');

        $bootNeededCallback = $jarves->loadBundleConfigs($cacher);
        $this->registerContentTypes($jarves, $container);
        $this->registerFieldTypes($jarves, $container);

        if ($bootNeededCallback) {
            $jarves->getConfigs()->boot();
            $this->setupObjects($jarves->getConfigs()->getConfigs());
            $bootNeededCallback();
        }

        $jarves->prepareWebSymlinks();
        $this->loadPropelConfig($jarvesConfig->getSystemConfig()->getDatabase());

        $jarvesEventDispatcher->registerBundleEvents($jarves->getConfigs());
    }

    /**
     * Setup AutoCrud
     *
     * @param \Jarves\Configuration\Bundle[] $bundleConfigs
     */
    protected function setupObjects(array $bundleConfigs) {

        $objectsEntryPoint = $bundleConfigs['jarves']->getEntryPoint('object');

        foreach ($bundleConfigs as $bundleConfig) {

            /** @var EntryPoint[][] $objectEntryPoints */
            $objectEntryPoints = [];
            //read all entry points for each object
            if ($bundleConfig->getEntryPoints()) {
                foreach ($bundleConfig->getEntryPoints() as $entryPoint) {
                    if ($entryPoint->getObject()) {
                        $objectEntryPoints[$entryPoint->getObject()][$entryPoint->getType()] = $entryPoint;
                    }
                }
            }

            $entryPointsForThisBundle = [];
            if ($bundleConfig->getObjects()) {
                foreach ($bundleConfig->getObjects() as $object) {
                    if (!isset($objectEntryPoints[$object->getKey()])) {
                        //this object does not have any entry point to manage.

                        if (!$object->getAutoCrud()) {
                            //jarves should not autobuild entry points
                            continue;
                        }

                        $entryPoint = new EntryPoint();
                        $entryPoint->setPath(lcfirst($object->getId()));
                        $entryPoint->setType('combine');
                        $entryPoint->setObject($object->getKey());
                        $entryPoint->setLink(true);
                        $entryPoint->setIcon('#' . ($object->isNested() ? 'icon-list-nested' : 'icon-list'));
                        $entryPoint->setLabel(($object->getLabel() ?: $object->getKey()));
                        $entryPointsForThisBundle[] = $entryPoint;

                        $objectEntryPoints[$entryPoint->getObject()][$entryPoint->getType()] = $entryPoint;
                    }
                }
            }

            if ($entryPointsForThisBundle) {
                //we added some autoCrud entry points
                $bundleObjectContainerEntryPoint = new EntryPoint();
                $bundleObjectContainerEntryPoint->setPath($bundleConfig->getName());
                $bundleObjectContainerEntryPoint->setLink(true);
                $bundleObjectContainerEntryPoint->setLabel($bundleConfig->getLabel() ?: $bundleConfig->getBundleName());
                $objectsEntryPoint->addChildren($bundleObjectContainerEntryPoint);

                foreach ($entryPointsForThisBundle as $entryPoint) {
                    $bundleObjectContainerEntryPoint->addChildren($entryPoint);
                }
            }

            if ($bundleConfig->getObjects()) {
                foreach ($bundleConfig->getObjects() as $object) {
                    //setup addEntrypoint, editEntrypoint, listEntrypoint if not set already
                    if (isset($objectEntryPoints[$object->getKey()]['combine'])) {

                        if (!$object->getAddEntryPoint()) {
                            $object->setAddEntryPoint($objectEntryPoints[$object->getKey()]['combine']->getFullPath());
                        }
                        if (!$object->getEditEntryPoint()) {
                            $object->setEditEntryPoint($objectEntryPoints[$object->getKey()]['combine']->getFullPath());
                        }
                        if (!$object->getListEntryPoint()) {
                            $object->setListEntryPoint($objectEntryPoints[$object->getKey()]['combine']->getFullPath());
                        }
                    }
                    if ($object->getAddEntryPoint() && isset($objectEntryPoints[$object->getKey()]['add'])) {
                        $object->setAddEntryPoint($objectEntryPoints[$object->getKey()]['add']->getFullPath());
                    }

                    if ($object->getEditEntryPoint() && isset($objectEntryPoints[$object->getKey()]['edit'])) {
                        $object->setEditEntryPoint($objectEntryPoints[$object->getKey()]['edit']->getFullPath());
                    }

                    if ($object->getListEntryPoint() && isset($objectEntryPoints[$object->getKey()]['list'])) {
                        $object->setListEntryPoint($objectEntryPoints[$object->getKey()]['list']->getFullPath());
                    }
                }
            }
        }
    }

    protected function registerFieldTypes(Jarves $jarves, ContainerInterface $container)
    {
        foreach ($jarves->getConfigs() as $bundleConfig) {
            if ($bundleConfig->getFieldTypes()) {
                foreach ($bundleConfig->getFieldTypes() as $fieldType) {

                    if ($fieldType->isUserInterfaceOnly()) {
                        continue;
                    }
                    
                    if (!$fieldType->getService()) {
                        throw new \RuntimeException(sprintf(
                            'For field type %s:%s is no service defined. If it does not handle model related persisting, ' .
                            'you should add interface-only="true"',
                            $bundleConfig->getName(),
                            $fieldType->getId()
                        ));
                    }
                    
                    if (!$container->has($fieldType->getService())) {
                        throw new \RuntimeException(sprintf(
                            'Service `%s` for field type %s:%s does not exist',
                            $fieldType->getService(),
                            $bundleConfig->getName(),
                            $fieldType->getId()
                        ));
                    }

                    $jarves->getFieldTypes()->addType(
                        $fieldType->getId(),
                        $fieldType->getService()
                    );
                }
            }
        }
    }
    
    
    protected function registerContentTypes(Jarves $jarves, ContainerInterface $container)
    {
        /** @var ContentRender $jarvesContentRender */
        $jarvesContentRender = $container->get('jarves.content.render');

        foreach ($jarves->getConfigs() as $bundleConfig) {
            if ($bundleConfig->getContentTypes()) {
                foreach ($bundleConfig->getContentTypes() as $contentType) {

                    if ('stopper' === $contentType->getId()) {
                        continue;
                    }

                    if (!$contentType->getService()) {
                        throw new \RuntimeException(sprintf(
                            'For content type %s:%s is no service defined',
                            $bundleConfig->getName(),
                            $contentType->getId()
                        ));
                    }
                    if (!$container->has($contentType->getService())) {
                        throw new \RuntimeException(sprintf(
                            'Service `%s` for content type %s:%s does not exist',
                            $contentType->getService(),
                            $bundleConfig->getName(),
                            $contentType->getId()
                        ));
                    }

                    $instance = $container->get($contentType->getService());

                    if ($instance instanceof ContentTypes\AbstractType) {
                        $jarvesContentRender->addType(
                            $contentType->getId(),
                            $container->get($contentType->getService())
                        );
                    } else {
                        throw new \RuntimeException(sprintf(
                            'Content type %s:%s with service %s has wrong parent class',
                            $bundleConfig->getName(),
                            $contentType->getId(),
                            $contentType->getService()
                        ));
                    }
                }
            }
        }
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
