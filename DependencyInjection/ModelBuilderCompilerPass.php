<?php

namespace Jarves\DependencyInjection;

use \Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Reference;

class ModelBuilderCompilerPass implements CompilerPassInterface
{

    public function process(ContainerBuilder $container)
    {
        if (!$container->hasDefinition('jarves.model.builder')) {
            return;
        }

        $definition = $container->getDefinition(
            'jarves.model.builder'
        );

        $taggedServices = $container->findTaggedServiceIds(
            'jarves.model.builder'
        );

        foreach ($taggedServices as $id => $tagAttributes) {
            foreach ($tagAttributes as $attributes) {
                $definition->addMethodCall(
                    'addBuilder',
                    array($attributes['alias'], new Reference($id))
                );
            }
        }
    }
}