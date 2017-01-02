<?php

namespace Jarves\DependencyInjection\Compiler;

use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Definition;

class FilesystemAdapterCompilerPass implements CompilerPassInterface
{
    public function process(ContainerBuilder $container)
    {
        /** @var Definition[] $services */
        $services = $container->findTaggedServiceIds('jarves.filesystem.adapter');
        $adapterMap = [];

        foreach ($services as $id => $tags) {
            foreach ($tags as $tag) {
                if (!isset($tag['type'])) {
                    throw new \Exception('You tagged the server ' . $id . ' as jarves.filesystem.adapter but not "type" is given.');
                }

                $adapterMap[$tag['type']] = $id;
            }
        }

        $config = $container->getExtensionConfig('jarves')[0];

        if (isset($config['mounts'])) {
            foreach ($config['mounts'] as $name => $mount) {
                if (!isset($adapterMap[$mount['type']])) {
                    throw new \Exception("You specified a filesystem mount with type '{$mount['type']}', but there is not adapter for that type.");
                }

                $adapterServiceId = $adapterMap[$mount['type']];
                $mountDefinition = clone $container->getDefinition($adapterServiceId);

                $mountDefinition->addMethodCall('initialize', [
                     $name, $mount['type'], $mount['baseUrl'], isset($mount['options']) ? $mount['options'] : []
                ]);

                $mountServiceId = 'jarves.filesystem.mount.' . $name;
                $container->setDefinition($mountServiceId, $mountDefinition);
            }
        }
    }

}