<?php

namespace Jarves\DependencyInjection;

use Jarves\Configuration\SystemConfig;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\Config\FileLocator;
use Symfony\Component\DependencyInjection\Definition;
use Symfony\Component\HttpKernel\DependencyInjection\Extension;
use Symfony\Component\DependencyInjection\Loader;

class JarvesExtension extends Extension
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

        $configuration = new Configuration();
        $config = $this->processConfiguration($configuration, $configs);

        $definition = $container->getDefinition('jarves.config');
        $systemConfig = new Definition(SystemConfig::class, [$config]);
        $definition->addMethodCall('setSystemConfig', [$systemConfig]);

        if (false === $config['admin']) {
            $container->removeDefinition('jarves.paramFetcher.listener');
            $container->removeDefinition('jarves.rest.routing_loader');
        }

        if (false === $config['router']) {
            $container->removeDefinition('jarves.frontendRoutes.listener');
            $container->removeDefinition('jarves.pluginResponse.listener');
        }

        $definition = $container->getDefinition('jarves.asset_handler.scss');
        $definition->addArgument($config['assets']['sass_path']);
    }
}
