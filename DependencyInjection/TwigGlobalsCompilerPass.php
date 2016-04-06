<?php

namespace Jarves\DependencyInjection;

use \Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Reference;

class TwigGlobalsCompilerPass implements CompilerPassInterface {

    public function process(ContainerBuilder $container)
    {
        $twig = $container->getDefinition(
            'twig'
        );

        $twig->addMethodCall('addGlobal', ['jarves_content_render', new Reference('jarves.content.render')]);
    }
}