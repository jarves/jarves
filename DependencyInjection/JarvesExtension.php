<?php

namespace Jarves\DependencyInjection;

use Jarves\Configuration\SystemConfig;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\Config\FileLocator;
use Symfony\Component\DependencyInjection\Extension\PrependExtensionInterface;
use Symfony\Component\HttpKernel\DependencyInjection\Extension;
use Symfony\Component\DependencyInjection\Loader;

/**
 * This is the class that loads and manages your bundle configuration
 *
 * To learn more see {@link http://symfony.com/doc/current/cookbook/bundles/extension.html}
 */
class JarvesExtension extends Extension implements PrependExtensionInterface
{
    /**
     * {@inheritDoc}
     */
    public function load(array $configs, ContainerBuilder $container)
    {
//        $configuration = new Configuration();
//        $config = $this->processConfiguration($configuration, $configs);

        $loader = new Loader\YamlFileLoader($container, new FileLocator(__DIR__ . '/../Resources/config'));
        $loader->load('services.yml');
        $loader->load('services/content-types.yml');
        $loader->load('services/field-types.yml');
        $loader->load('services/twig.yml');
    }

//    public function prepend(ContainerBuilder $container)
//    {
//        $bundles = $container->getParameter('kernel.bundles');
//
//        if (!isset($bundles['PropelBundle'])) {
//            // disable AcmeGoodbyeBundle in bundles
//            $config = array('use_acme_goodbye' => false);
//            foreach ($container->getExtensions() as $name => $extension) {
//                switch ($name) {
//                    case 'acme_something':
//                    case 'acme_other':
//                        // set use_acme_goodbye to false in the config of
//                        // acme_something and acme_other note that if the user manually
//                        // configured use_acme_goodbye to true in the app/config/config.yml
//                        // then the setting would in the end be true and not false
//                        $container->prependExtensionConfig($name, $config);
//                        break;
//                }
//            }
//        }
//
//        // process the configuration of AcmeHelloExtension
//        $configs = $container->getExtensionConfig($this->getAlias());
//        // use the Configuration class to generate a config array with
//        // the settings "acme_hello"
//        $config = $this->processConfiguration(new Configuration(), $configs);
//
//        // check if entity_manager_name is set in the "acme_hello" configuration
//        if (isset($config['entity_manager_name'])) {
//            // prepend the acme_something settings with the entity_manager_name
//            $config = array('entity_manager_name' => $config['entity_manager_name']);
//            $container->prependExtensionConfig('acme_something', $config);
//        }
//    }

    /**
     * @param ContainerBuilder $container
     * @return SystemConfig|mixed|null
     */
    protected function getSystemConfig(ContainerBuilder $container)
    {
        $reflection = new \ReflectionClass('\AppKernel');
        $rootDir = dirname($reflection->getFileName());
        $environment = $container->getParameter('kernel.environment');

        $configFile = $rootDir . '/config/config.jarves.xml';
        $configEnvFile = $rootDir . '/config/config.jarves_' . $environment . '.xml';

        if (file_exists($configEnvFile)) {
            $configFile = $configEnvFile;
        }

        $cacheFile = $configFile . '.cache.php';
        $systemConfigCached = @file_get_contents($cacheFile);

        $cachedSum = 0;
        if ($systemConfigCached) {
            $cachedSum = substr($systemConfigCached, 0, 32);
            $systemConfigCached = substr($systemConfigCached, 33);
        }

        $systemConfigHash = file_exists($configFile) ? md5(filemtime($configFile)) : -1;

        $systemConfig = null;

        if ($systemConfigCached && $cachedSum === $systemConfigHash) {
            $systemConfig = @unserialize($systemConfigCached);
        }

        if (!$systemConfig) {
            $configXml = file_exists($configFile) ? file_get_contents($configFile) : [];
            $systemConfig = new SystemConfig($configXml, $this);
            file_put_contents($cacheFile, $systemConfigHash . "\n" . serialize($systemConfig));
        }

        return $systemConfig;
    }

    public function prepend(ContainerBuilder $container)
    {
        $systemConfig = $this->getSystemConfig($container);

//        if (!$systemConfig->getDatabase()) {
//            $database = $container->get('jarves.configuration.database');
//            $systemConfig->setDatabase($database);
//        } else {

        if ($systemConfig->getDatabase()) {
            /*
             *
                propel:
                    database:
                        connections:
                            default:
                                adapter:    "%database_driver%"
                                user:       "%database_user%"
                                password:   "%database_password%"
                                dsn:        "%database_driver%:host=%database_host%;dbname=%database_name%;charset=UTF8"
             */
            $database = $systemConfig->getDatabase();
            $mainConnection = $database->getMainConnection();

            $defaultValues = [
                'adapter' => $mainConnection->getType(),
                'user' => $mainConnection->getUsername(),
                'password' => $mainConnection->getPassword(),
                'dsn' => $mainConnection->getDsn(),
            ];

            $array = [
                'database' => [
                    'connections' => [
                        'default' => $defaultValues
                    ]
                ]
            ];

            $container->prependExtensionConfig('propel', $array);
        }
    }
}
