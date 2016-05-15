<?php

namespace Jarves\DependencyInjection;

use Jarves\Configuration\Connection;
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
        $loader = new Loader\YamlFileLoader($container, new FileLocator(__DIR__ . '/../Resources/config'));
        $loader->load('services.yml');
        $loader->load('services.plugin.yml');
        $loader->load('services/content-types.yml');
        $loader->load('services/field-types.yml');
        $loader->load('services/twig.yml');
        $loader->load('services/storage.yml');
        $loader->load('services/crud.yml');
    }

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
            $systemConfig = new SystemConfig($configXml);
            file_put_contents($cacheFile, $systemConfigHash . "\n" . serialize($systemConfig));
        }

        return $systemConfig;
    }

    public function prepend(ContainerBuilder $container)
    {
        $systemConfig = $this->getSystemConfig($container);

        $propelConfig = $container->getExtensionConfig('propel');

        if (isset($propelConfig[0]['database'])) {
           //propel is already configured, so we don't overwrite it
            return;
        }

        $database = $systemConfig->getDatabase();
        $mainConnection = null;

        if ($database) {
            $mainConnection = $database->getMainConnection();
        }

        if (!$mainConnection) {
            $mainConnection = new Connection();
            $mainConnection->setType($container->getParameter('database_driver'));
            $mainConnection->setServer($container->getParameter('database_host'));
            $mainConnection->setPort($container->getParameter('database_port'));
            $mainConnection->setName($container->getParameter('database_name'));
            $mainConnection->setUsername($container->getParameter('database_user'));
            $mainConnection->setPassword($container->getParameter('database_password'));
        }

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
