<?php

namespace Jarves\EventListener;

use Jarves\EditMode;
use Jarves\Exceptions\AccessDeniedException;
use Jarves\Jarves;
use Jarves\Model\Base\NodeQuery;
use Jarves\PageResponse;
use Jarves\PageResponseFactory;
use Jarves\PageStack;
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

    /**
     * @var FrontendRouter
     */
    private $frontendRouter;

    /**
     * @var PageStack
     */
    private $pageStack;
    /**
     * @var EditMode
     */
    private $editMode;
    /**
     * @var PageResponseFactory
     */
    private $pageResponseFactory;

    /**
     * @param Jarves $jarves
     * @param PageStack $pageStack
     * @param EditMode $editMode
     * @param FrontendRouter $frontendRouter
     * @param PageResponseFactory $pageResponseFactory
     * @internal param PageResponse $pageResponse
     */
    function __construct(Jarves $jarves, PageStack $pageStack, EditMode $editMode,
                         FrontendRouter $frontendRouter, PageResponseFactory $pageResponseFactory)
    {
        $this->jarves = $jarves;
        $this->routes = new RouteCollection();
        $this->frontendRouter = $frontendRouter;
        $this->pageStack = $pageStack;

        parent::__construct(
            new UrlMatcher($this->routes, new RequestContext()),
            new RequestStack()
        );
        $this->editMode = $editMode;
        $this->pageResponseFactory = $pageResponseFactory;
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
            $this->pageStack->setPageResponse($this->pageResponseFactory->create());

            if (!isset($this->loaded[$request->getPathInfo()])) {
                $this->frontendRouter->setRequest($request);

                $this->loaded[$request->getPathInfo()] = true;

                //check for redirects/access requirements and populates $this->routes with current page routes and its plugins
                if ($response = $this->frontendRouter->loadRoutes($this->routes)) {
                    $event->setResponse($response);

                    return;
                }
            }
        }

        try {
            if ($nodeId = (int)$this->pageStack->getRequest()->get('_jarves_editor_node')) {
                if ($this->editMode->isEditMode($nodeId)) {
                    $node = NodeQuery::create()->joinWithDomain()->findPk($nodeId);
                    if ($node) {
                        $this->pageStack->setCurrentPage($node);
                        $this->pageStack->setCurrentDomain($node->getDomain());

                        if (!$request->attributes->has('_controller')) {
                            $request->attributes->set('_controller', 'jarves.page_controller:handleAction');
                        }
                    }
                } else {
                    throw new AccessDeniedException('Access denied.');
                }
            } else {
                //check routes in $this->route
                parent::onKernelRequest($event);

                if ($request->attributes->has('_route')) {
                    $name = $request->attributes->get('_route');
                    $route = $this->routes->get($name);
                    $nodeId = $route->getDefault('nodeId');

                    $node = NodeQuery::create()->joinWithDomain()->findPk($nodeId);
                    $this->pageStack->setCurrentPage($node);
                    $this->pageStack->setCurrentDomain($node->getDomain());
                }
            }
        } catch (MethodNotAllowedException $e) {
        } catch (NotFoundHttpException $e) {
        }
    }
}