<?php

namespace Jarves\DependencyInjection\Compiler;

use Jarves\Filesystem\Adapter\Flysystem;
use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;

class FlysystemCompilerPass implements CompilerPassInterface
{
    /**
     * {@inheritdoc}
     */
    public function process(ContainerBuilder $container)
    {
        $definition = $container->getDefinition('jarves.filesystem.adapter.flysystem');
    }
}
