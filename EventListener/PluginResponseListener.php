<?php

namespace Jarves\EventListener;

use Jarves\Jarves;
use Jarves\PluginResponse;
use Symfony\Component\HttpFoundation\ParameterBag;
use Symfony\Component\HttpKernel\Event\FilterResponseEvent;
use Symfony\Component\HttpKernel\Event\GetResponseForControllerResultEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;

/**
 * Class PluginSubRequest
 *
 * This converts a PluginResponse to a PageResponse.
 */
class PluginResponseListener {

    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @var FrontendRouteListener
     */
    protected $frontendRouteListener;

    function __construct(Jarves $jarves, FrontendRouteListener $frontendRouteListener)
    {
        $this->jarves = $jarves;
        $this->frontendRouteListener = $frontendRouteListener;
    }

    /**
     * @param Jarves $jarves
     */
    public function setJarves(Jarves $jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @return Jarves
     */
    public function getJarves()
    {
        return $this->jarves;
    }

    public function onKernelResponse(FilterResponseEvent $event)
    {
        $response = $event->getResponse();
        if (null !== $response && $response instanceof PluginResponse) {
            $response->setControllerRequest($event->getRequest());
            $response = $this->getJarves()->getPageResponse()->setPluginResponse($response);

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
                $response = new PluginResponse($data);
            }
            $response->setControllerRequest($event->getRequest());
            $event->setResponse($response);
        } else {
            $foundRoute = false;

//            $router = $this->getJarves()->getRouter();
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
                $request = clone $this->getJarves()->getRequest();
                $request->attributes = new ParameterBag();
                $response = $this->getJarves()->getKernel()->handle(
                    $request,
                    HttpKernelInterface::SUB_REQUEST
                );
                $event->setResponse($response);

                return;
            }
        }
    }
}