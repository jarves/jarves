<?php

/**
 * This is the main bundle class for
 *
 * Jarves - content management.
 *
 *   J.A.R.V.E.S - Just a rather very easy (content management) system.
 */

namespace Jarves;

use Doctrine\Common\Annotations\AnnotationRegistry;
use Jarves\Cache\Cacher;
use Jarves\Configuration\Model;
use Jarves\Configuration\SystemConfig;
use Jarves\DependencyInjection\AssetCompilerCompilerPass;
use Jarves\DependencyInjection\ContentTypesCompilerPass;
use Jarves\DependencyInjection\FieldTypesCompilerPass;
use Jarves\DependencyInjection\ModelBuilderCompilerPass;
use Jarves\DependencyInjection\TwigGlobalsCompilerPass;
use Jarves\Propel\PropelHelper;
use Symfony\Component\ClassLoader\UniversalClassLoader;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\HttpKernel\Bundle\Bundle;

class JarvesBundle extends Bundle
{
    /**
     * @var SystemConfig
     */
    public static $systemConfig;

    public function build(ContainerBuilder $container)
    {
        parent::build($container);
        $container->addCompilerPass(new ContentTypesCompilerPass());
        $container->addCompilerPass(new FieldTypesCompilerPass());
        $container->addCompilerPass(new ModelBuilderCompilerPass());
        $container->addCompilerPass(new AssetCompilerCompilerPass());
//        $container->addCompilerPass(new TwigGlobalsCompilerPass());
    }

    public function boot()
    {
        parent::boot();

        /** @var $jarves Jarves */
        $jarves = $this->container->get('jarves');

        /** @var Cacher $cacher */
        $cacher = $this->container->get('jarves.cache.cacher');

        /** @var $jarvesEventDispatcher JarvesEventDispatcher */
        $jarvesEventDispatcher = $this->container->get('jarves.event_dispatcher');

        static::$systemConfig = $jarves->getSystemConfig();
        $jarves->loadBundleConfigs($cacher);

        $jarvesEventDispatcher->registerBundleEvents($jarves->getConfigs());

        $twig = $this->container->get('twig');
        $twig->addGlobal('jarves_content_render', $this->container->get('jarves.content.render'));


        $jarves->prepareWebSymlinks();

        if ($jarves->getSystemConfig()->getLogs(true)->isActive()) {
            /** @var $logger \Symfony\Bridge\Monolog\Logger */
            $logger = $this->container->get('logger');
            $logger->pushHandler($this->container->get('jarves.logger.handler'));
        }
    }
}
