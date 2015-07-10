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
use Jarves\Configuration\Model;
use Jarves\Configuration\SystemConfig;
use Jarves\DependencyInjection\AssetCompilerCompilerPass;
use Jarves\DependencyInjection\ContentTypesCompilerPass;
use Jarves\DependencyInjection\FieldTypesCompilerPass;
use Jarves\DependencyInjection\ModelBuilderCompilerPass;
use Jarves\Propel\PropelHelper;
use Symfony\Component\ClassLoader\UniversalClassLoader;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\HttpKernel\Bundle\Bundle;

class JarvesBundle extends Bundle
{
    /**
     * @var UniversalClassLoader
     */
    protected $additionalLoader;

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
    }

    public function boot()
    {
        parent::boot();
//        $this->additionalLoader = new UniversalClassLoader();
//        $this->additionalLoader->registerNamespaceFallback($this->container->get('kernel')->getCacheDir().'/propel-classes/');
//        $this->additionalLoader->register();

        /** @var $jarves Jarves */
        $jarves = $this->container->get('jarves');
        static::$systemConfig = $jarves->getSystemConfig();
        Model::$serialisationJarvesCore = $jarves;

        $jarves->prepareWebSymlinks();
        $jarves->loadBundleConfigs();

//        /*
//         * Propel orm initialisation.
//         */
//        $propelHelper = new PropelHelper($jarves);
//        $propelHelper->loadConfig();

//        $jarves->getModelBuilder()->boot();

        if ($jarves->getSystemConfig()->getLogs(true)->isActive()) {
            /** @var $logger \Symfony\Bridge\Monolog\Logger */
            $logger = $this->container->get('logger');
            $logger->pushHandler($this->container->get('jarves.logger.handler'));
        }
    }

    /**
     * Shutdowns the Bundle.
     */
    public function shutdown()
    {
        unset($this->additionalLoader);
    }
}
