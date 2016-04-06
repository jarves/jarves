<?php

namespace Jarves\EventListener;

use Jarves\Jarves;
use Jarves\PageResponseFactory;
use Jarves\PageStack;
use Jarves\PluginResponse;
use Symfony\Component\HttpFoundation\ParameterBag;
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

    /**
     * PluginResponseListener constructor.
     * @param Jarves $jarves
     * @param PageStack $pageStack
     * @param FrontendRouteListener $frontendRouteListener
     * @param KernelInterface $kernel
     * @param PageResponseFactory $pageResponseFactory
     */
    function __construct(Jarves $jarves, PageStack $pageStack, FrontendRouteListener $frontendRouteListener,
                         KernelInterface $kernel, PageResponseFactory $pageResponseFactory)
    {
        $this->jarves = $jarves;
        $this->pageStack = $pageStack;
        $this->frontendRouteListener = $frontendRouteListener;
        $this->kernel = $kernel;
        $this->pageResponseFactory = $pageResponseFactory;
    }

    public function onKernelResponse(FilterResponseEvent $event)
    {
        $response = $event->getResponse();
        if (null !== $response && $response instanceof PluginResponse) {
            $response->setControllerRequest($event->getRequest());
            $response = $this->pageStack->getPageResponse()->setPluginResponse($response);

            if (HttpKernelInterface::MASTER_REQUEST === $event->getRequestType()) {
                $response->setRenderFrontPage(true);
                $response->renderContent();
            }

            $event->setResponse($response);
        }
    }

    public function onKernelView(GetResponseForControllerResultEvent $event)
    {

        $data = $event->getControllerResult();
        $request = $event->getRequest();
        if (!$request->attributes->has('_content')) {
            return;
        }

        $content = $request->attributes->get('_content');

        if (null !== $data) {
            if ($data instanceof PluginResponse) {
                $response = $data;
            } else {
                $response = $this->pageResponseFactory->createPluginResponse($data);
            }
            $response->setControllerRequest($event->getRequest());
            $event->setResponse($response);
        } else {
            $foundRoute = false;

            $routes = $this->frontendRouteListener->getRoutes();

            foreach ($routes as $idx => $route) {
                /** @var \Symfony\Component\Routing\Route $route */
                if ($content == $route->getDefault('_content')) {
                    $routes->remove($idx);
                    $foundRoute = true;
                    break;
                }
            }
            if ($foundRoute) {
                //we've remove the route and fire now again a sub request
                $request = clone $this->pageStack->getRequest();
                $request->attributes = new ParameterBag();
                $response = $this->kernel->handle(
                    $request,
                    HttpKernelInterface::SUB_REQUEST
                );
                $event->setResponse($response);

                return;
            }
        }
    }
}