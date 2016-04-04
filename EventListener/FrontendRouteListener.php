<?php

namespace Jarves\EventListener;

use Jarves\Jarves;
use Jarves\Model\Base\NodeQuery;
use Jarves\Router\FrontendRouter;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpKernel\Event\GetResponseEvent;
use Symfony\Component\HttpKernel\EventListener\RouterListener;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Routing\Exception\MethodNotAllowedException;
use Symfony\Component\Routing\Matcher\UrlMatcher;
use Symfony\Component\Routing\RequestContext;
use Symfony\Component\Routing\RouteCollection;

class FrontendRouteListener extends RouterListener
{

    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @var RouteCollection
     */
    protected $routes;

    /**
     * @var array
     */
    protected $loaded = [];

    function __construct(Jarves $jarves)
    {
        $this->jarves = $jarves;
        $this->routes = new RouteCollection();

        parent::__construct(
            new UrlMatcher($this->routes, new RequestContext()),
            new RequestStack()
        );
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

    /**
     * @param RouteCollection $routes
     */
    public function setRoutes($routes)
    {
        $this->routes = $routes;
    }

    /**
     * @return RouteCollection
     */
    public function getRoutes()
    {
        return $this->routes;
    }

    public function onKernelRequest(GetResponseEvent $event)
    {
        $request = $event->getRequest();

        if (HttpKernelInterface::MASTER_REQUEST === $event->getRequestType()) {
            //prepare for new master request: clear the PageResponse object
            $this->getJarves()->prepareNewMasterRequest();

            if (!isset($this->loaded[$request->getPathInfo()])) {
                $frontendRouter = new FrontendRouter($this->getJarves(), $request);

                $this->loaded[$request->getPathInfo()] = true;

                //check for redirects/access requirements and populates $this->routes with current page routes and its plugins
                if ($response = $frontendRouter->loadRoutes($this->routes)) {
                    $event->setResponse($response);

                    return;
                }
            }
        }

        try {
            //check routes in $this->route
            parent::onKernelRequest($event);

            if ($event->getRequest()->attributes->has('_route')){
                $name = $request->attributes->get('_route');
                $route = $this->routes->get($name);
                $nodeId = $route->getDefault('nodeId');
                $node = NodeQuery::create()->findPk($nodeId);
                $this->jarves->setCurrentPage($node);
                $this->jarves->setCurrentDomain($node->getDomain());
            }
        } catch (MethodNotAllowedException $e) {
        } catch (NotFoundHttpException $e) {
        }
    }
}