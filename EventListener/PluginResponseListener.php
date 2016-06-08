<?php

namespace Jarves\EventListener;

use Jarves\EditMode;
use Jarves\Jarves;
use Jarves\Model\Content;
use Jarves\PageResponseFactory;
use Jarves\PageStack;
use Jarves\PluginResponse;
use Jarves\PluginResponseInterface;
use Symfony\Component\HttpFoundation\ParameterBag;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\FilterResponseEvent;
use Symfony\Component\HttpKernel\Event\GetResponseForControllerResultEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\HttpKernel\KernelInterface;

/**
 * Class PluginSubRequest
 *
 * This converts a PluginResponse to a PageResponse.
 */
class PluginResponseListener
{
    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @var FrontendRouteListener
     */
    protected $frontendRouteListener;

    /**
     * @var KernelInterface
     */
    private $kernel;

    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * @var PageResponseFactory
     */
    private $pageResponseFactory;

    function __construct(Jarves $jarves, PageStack $pageStack, FrontendRouteListener $frontendRouteListener,
                         KernelInterface $kernel, PageResponseFactory $pageResponseFactory, EditMode $editMode)
    {
        $this->jarves = $jarves;
        $this->pageStack = $pageStack;
        $this->frontendRouteListener = $frontendRouteListener;
        $this->kernel = $kernel;
        $this->pageResponseFactory = $pageResponseFactory;
        $this->editMode = $editMode;
    }

    public function onKernelResponse(FilterResponseEvent $event)
    {
        $response = $event->getResponse();
        if (null !== $response && $response instanceof PluginResponseInterface) {

            //when a route from a plugin is hit
            if (!$event->getRequest()->attributes->get('_jarves_is_plugin')) {
                //we accept only plugin routes.
                return;
            }

            $pageResponse = $this->pageStack->getPageResponse();

            /** @var $content Content */
            $content = $event->getRequest()->attributes->get('_content');

            //this is later used in ContentTypes\TypePlugin, so it won't execute
            //the same plugin again.
            $pageResponse->setPluginResponse($content->getId(), $response);

            if (HttpKernelInterface::MASTER_REQUEST === $event->getRequestType()) {
                //when this was a master request, we need to render the actual content of the page,
                //so HttpKernel can return a valid ready rendered response

                //if a plugin route has been successfully requested
                //we need to handle also the Jarves editor
                if ($this->editMode->isEditMode()) {
                    $this->editMode->registerEditor();
                }

                $pageResponse->renderContent();
            }

            //maintain the actual PageResponse
            $event->setResponse($pageResponse);
        }
    }

    public function onKernelView(GetResponseForControllerResultEvent $event)
    {
        $data = $event->getControllerResult();
        $request = $event->getRequest();

        if (!$event->getRequest()->attributes->get('_jarves_is_plugin')) {
            //we accept only plugin responses.
            return;
        }

        $content = $request->attributes->get('_content');

        if (null !== $data) {
            if ($data instanceof PluginResponseInterface) {
                $response = $data;
            } else {
                $response = $this->pageResponseFactory->createPluginResponse($data);
            }

            //it's required to place a PluginResponseInterface as response, so
            //PluginResponseListener::onKernelResponse can correctly identify it
            //and set it as response for this plugin content, so ContentTypes\TypePlugin
            //can place the correct response at the correct position, without executing
            //the plugin twice.
            $event->setResponse($response);
        } else {

            //we hit a plugin route, but it has responsed with NULL
            //this means it is not responsible for this route/slug.
            //we need now to remove this plugin route from the route collection
            //and fire again a sub request until all plugins on this page
            //are handled. If no plugin is responsible for this url pattern
            //and the main page route is also not responsible
            //no response is set in the $event and a 404 is thrown by the HttpKernel.
            $foundRoute = false;

            $routes = $this->frontendRouteListener->getRoutes();

            foreach ($routes as $idx => $route) {
                /** @var \Symfony\Component\Routing\Route $route */
                if ($content === $route->getDefault('_content')) {
                    //remove exactly only the current plugin that was hit in this sub request
                    $routes->remove($idx);
                    $foundRoute = true;
                    break;
                }
            }

            if ($foundRoute) {
                //we've removed the route and fire now again a sub request
                $request = clone $this->pageStack->getRequest();
                $request->attributes = new ParameterBag();
                $response = $this->kernel->handle(
                    $request,
                    HttpKernelInterface::SUB_REQUEST
                );
                $event->setResponse($response);
            }

            //we do not need to restore routes in the frontendRouteListener, because
            //it reload all routes on every master request
        }
    }
}