<?php

namespace Jarves\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

class Configuration implements ConfigurationInterface
{
    /**
     * {@inheritDoc}
     */
    public function getConfigTreeBuilder()
    {
        $treeBuilder = new TreeBuilder();
        $rootNode = $treeBuilder->root('jarves');

        $rootNode
            ->children()
                ->scalarNode('admin')
                    ->defaultValue(true)
                ->end()
                ->scalarNode('router')
                    ->defaultValue(true)
                ->end()
                ->scalarNode('systemTitle')
                    ->defaultValue('Fresh Installation')
                ->end()
                ->scalarNode('languages')
                    ->defaultValue('en')
                ->end()
                ->arrayNode('cache')
                    ->addDefaultsIfNotSet()
                    ->children()
                        ->scalarNode('service')
                            ->defaultValue('jarves.cache.backend.files')
                        ->end()
                        ->arrayNode('options')
                        ->end()
                    ->end()
                ->end()
                ->arrayNode('mountpoints')
                ->end()
                ->arrayNode('file')
                    ->addDefaultsIfNotSet()
                    ->children()
                        ->scalarNode('groupPermission')
                            ->defaultValue('rw')
                        ->end()
                        ->scalarNode('everyonePermission')
                            ->defaultValue('r')
                        ->end()
                        ->scalarNode('disableModeChange')
                            ->defaultValue(false)
                        ->end()
                        ->scalarNode('groupOwner')
                        ->end()
                    ->end()
                ->end()
            ->end();

        return $treeBuilder;
    }
}
