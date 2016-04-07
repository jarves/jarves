<?php

namespace Jarves\DependencyInjection;

use \Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Reference;

class FieldTypesCompilerPass implements CompilerPassInterface
{

    public function process(ContainerBuilder $container)
    {
        if (!$container->hasDefinition('jarves.field.types')) {
            return;
        }

        $definition = $container->getDefinition(
            'jarves.field.types'
        );

        $taggedServices = $container->findTaggedServiceIds(
            'jarves.field.type'
        );

        foreach ($taggedServices as $id => $tagAttributes) {
            $tagDef = $container->getDefinition($id);
            $tagDef->setShared(false);

            foreach ($tagAttributes as $attributes) {
                $definition->addMethodCall(
                    'addType',
                    array($attributes['alias'], $id)
                );
            }
        }
    }
}