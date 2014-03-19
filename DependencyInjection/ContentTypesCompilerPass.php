<?php

namespace Jarves\DependencyInjection;

use \Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Reference;

class ContentTypesCompilerPass implements CompilerPassInterface {

    public function process(ContainerBuilder $container)
    {
        if (!$container->hasDefinition('jarves.content.types')) {
            return;
        }

        $definition = $container->getDefinition(
            'jarves.content.types'
        );

        $taggedServices = $container->findTaggedServiceIds(
            'jarves.content.type'
        );

        foreach ($taggedServices as $id => $tagAttributes) {
            foreach ($tagAttributes as $attributes) {
                $definition->addMethodCall(
                    'addType',
                    array($attributes['alias'], new Reference($id))
                );
            }
        }
    }
}