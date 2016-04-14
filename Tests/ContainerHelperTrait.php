<?php
/**
 * This file is part of Jarves.
 *
 * (c) Marc J. Schmidt <marc@marcjschmidt.de>
 *
 *     J.A.R.V.E.S - Just A Rather Very Easy [content management] System.
 *
 *     http://jarves.io
 *
 * To get the full copyright and license information, please view the
 * LICENSE file, that was distributed with this source code.
 */

namespace Jarves\Tests;

use Jarves\Cache\Cacher;
use Jarves\Jarves;
use Jarves\JarvesEventDispatcher;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

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
     * @return JarvesEventDispatcher
     */
    public function getJarvesEventDispatcher()
    {
        return $this->container->get('jarves.event_dispatcher');
    }

    /**
     * @return Cacher
     */
    public function getCacher()
    {
        return $this->container->get('jarves.cache.cacher');
    }

    /**
     * @return \Jarves\ORM\Builder\Builder
     */
    public function getModelBuilder()
    {
        return $this->container->get('jarves.model.builder');
    }

    /**
     * @return \Jarves\Configuration\ConfigurationOperator
     */
    public function getConfigurationOperator()
    {
        return $this->container->get('jarves.configuration_operator');
    }

    /**
     * @return \Jarves\ConditionOperator
     */
    public function getConditionOperator()
    {
        return $this->container->get('jarves.condition_operator');
    }

    /**
     * @return \Jarves\AssetHandler\Container
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
     * @return \Jarves\Objects
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
     * @return \Jarves\PageResponse
     */
    public function getPageResponse()
    {
        return $this->container->get('jarves.page_response.factory')->create();
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
     * @return \Jarves\Navigation
     */
    public function getNavigation()
    {
        return $this->container->get('jarves.navigation');
    }

    /**
     * @return \Jarves\StopwatchHelper
     */
    public function getStopwatch()
    {
        return $this->container->get('jarves.stopwatch');
    }

    /**
     * @return \Jarves\ACL
     */
    public function getACL()
    {
        return $this->container->get('jarves.acl');
    }

    /**
     * @return TokenStorageInterface
     */
    public function getTokenStorage()
    {
        return $this->container->get('security.token_storage');
    }

    /**
     * @return \Jarves\PageStack
     */
    public function getPageStack()
    {
        return $this->container->get('jarves.page_stack');
    }

    /**
     * @return \Symfony\Bundle\FrameworkBundle\Routing\Router
     */
    public function getRouter()
    {
        return $this->container->get('router');
    }

    /**
     * @return \Jarves\Translation\Translator
     */
    public function getTranslator()
    {
        return $this->container->get('jarves.translator');
    }

    /**
     * @return \Jarves\ContentRender
     */
    public function getContentRender()
    {
        return $this->container->get('jarves.content.render');
    }

    /**
     * @return \Jarves\ContentTypes\ContentTypes
     */
    public function getContentTypes()
    {
        return $this->container->get('jarves.content.types');
    }

    /**
     * @return \Jarves\Admin\FieldTypes\FieldTypes
     */
    public function getFieldTypes()
    {
        return $this->container->get('jarves.field.types');
    }

}