<?php

namespace Jarves;

use Symfony\Component\DependencyInjection\ContainerInterface;

trait ContainerHelperTrait
{
    /**
     * @return Jarves
     */
    public function getJarves()
    {
        return $this->container->get('jarves');
    }

    /**
     * @return ORM\Builder\Builder
     */
    public function getModelBuilder()
    {
        return $this->container->get('jarves.model.builder');
    }

    /**
     * @return AssetHandler\Container
     */
    public function getAssetCompilerContainer()
    {
        return $this->container->get('jarves.asset_handler.container');
    }

    /**
     * Returns a Filesystem interface for the root folder (where your composer.json is placed)
     *
     * @return \Jarves\Filesystem\FilesystemInterface
     */
    public function getFileSystem()
    {
        return $this->container->get('jarves.filesystem.local');
    }

    /**
     * Returns a Filesystem interface for the current cache directory.
     *
     * @return \Jarves\Filesystem\FilesystemInterface
     */
    public function getCacheFileSystem()
    {
        return $this->container->get('jarves.filesystem.cache');
    }

    /**
     * Returns a Filesystem interface with mount-capability for the /web directory.
     *
     * @return \Jarves\Filesystem\WebFilesystem
     */
    public function getWebFileSystem()
    {
        return $this->container->get('jarves.filesystem.web');
    }

    /**
     * @return Objects
     */
    public function getObjects()
    {
        return $this->container->get('jarves.objects');
    }

    /**
     * @return \Symfony\Component\HttpKernel\Log\LoggerInterface
     */
    public function getLogger()
    {
        return $this->container->get('logger');
    }

    /**
     * @return \Symfony\Component\HttpFoundation\Request
     */
    public function getRequest()
    {
        return $this->container->get('request_stack')->getCurrentRequest();
    }

    /**
     * @return \Symfony\Component\HttpFoundation\RequestStack
     */
    public function getRequestStack()
    {
        return $this->container->get('request_stack');
    }

    /**
     * @return PageResponse
     */
    public function getPageResponse()
    {
        return $this->container->get('jarves.page.response');
    }

    /**
     * @return \AppKernel
     */
    public function getKernel()
    {
        return $this->container->get('kernel');
    }

    /**
     * @return ContainerInterface
     */
    public function getContainer()
    {
        return $this->container;
    }

    /**
     * @return \Symfony\Component\EventDispatcher\EventDispatcherInterface
     */
    public function getEventDispatcher()
    {
        return $this->container->get('event_dispatcher');
    }

    /**
     * @return \Jarves\Cache\CacheInterface
     */
    public function getFastCache()
    {
        return $this->container->get('jarves.cache.fast');
    }

    /**
     * @return Navigation
     */
    public function getNavigation()
    {
        return $this->container->get('jarves.navigation');
    }

    /**
     * @return StopwatchHelper
     */
    public function getStopwatch()
    {
        return $this->container->get('jarves.stopwatch');
    }

    /**
     * @return ACL
     */
    public function getACL()
    {
        return $this->container->get('jarves.acl');
    }

    /**
     * @return \Symfony\Bundle\FrameworkBundle\Routing\Router
     */
    public function getRouter()
    {
        return $this->container->get('router');
    }

    /**
     * @return Translation\Translator
     */
    public function getTranslator()
    {
        return $this->container->get('jarves.translator');
    }

    /**
     * @return ContentRender
     */
    public function getContentRender()
    {
        return $this->container->get('jarves.content.render');
    }

    /**
     * @return ContentTypes\ContentTypes
     */
    public function getContentTypes()
    {
        return $this->container->get('jarves.content.types');
    }

    /**
     * @return Admin\FieldTypes\FieldTypes
     */
    public function getFieldTypes()
    {
        return $this->container->get('jarves.field.types');
    }

}