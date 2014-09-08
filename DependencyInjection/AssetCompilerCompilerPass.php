<?php

namespace Jarves\DependencyInjection;

use \Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Reference;

class AssetCompilerCompilerPass implements CompilerPassInterface
{

    public function process(ContainerBuilder $container)
    {
        $definition = $container->getDefinition(
            'jarves.asset_handler.container'
        );

        $compilerServices = $container->findTaggedServiceIds(
            'jarves.asset_handler.compiler'
        );

        foreach ($compilerServices as $id => $tagAttributes) {
            foreach ($tagAttributes as $attributes) {
                if (isset($attributes['contentType'])) {
                    foreach (explode(',', $attributes['contentType']) as $contentType) {
                        $definition->addMethodCall(
                            'registerCompileHandlerByContentType',
                            array($contentType, $id)
                        );
                    }
                }
                if (isset($attributes['extension'])) {
                    foreach (explode(',', $attributes['extension']) as $extension) {
                        $definition->addMethodCall(
                            'registerCompileHandlerByExtension',
                            array($extension, $id)
                        );
                    }
                }
            }
        }

        $loaderServices = $container->findTaggedServiceIds(
            'jarves.asset_handler.loader'
        );

        foreach ($loaderServices as $id => $tagAttributes) {
            foreach ($tagAttributes as $attributes) {
                if (isset($attributes['contentType'])) {
                    foreach (explode(',', $attributes['contentType']) as $contentType) {
                        $definition->addMethodCall(
                            'registerLoaderHandlerByContentType',
                            array($contentType, $id)
                        );
                    }
                }
                if (isset($attributes['extension'])) {
                    foreach (explode(',', $attributes['extension']) as $extension) {
                        $definition->addMethodCall(
                            'registerLoaderHandlerByExtension',
                            array($extension, $id)
                        );
                    }
                }
            }
        }
    }
}