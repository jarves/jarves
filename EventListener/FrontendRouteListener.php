<?php

namespace Jarves\EventListener;

use Jarves\EditMode;
use Jarves\Jarves;
use Jarves\PageResponseFactory;
use Jarves\PageStack;
use Jarves\Router\FrontendRouter;
use Psr\Log\LoggerInterface;
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
     * @var boolean[]
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
     * @var UrlMatcher
     */
    private $urlMatcher;

    /**
     * @var RequestContext
     */
    private $requestContext;

    /**
     * @var LoggerInterface
     */
    private $logger;

    /**
     * @param Jarves $jarves
     * @param PageStack $pageStack
     * @param EditMode $editMode
     * @param FrontendRouter $frontendRouter
     * @param PageResponseFactory $pageResponseFactory
     * @param RequestContext $requestContext
     * @param LoggerInterface $logger
     * @internal param PageResponse $pageResponse
     */
    function __construct(Jarves $jarves, PageStack $pageStack, EditMode $editMode,
                         FrontendRouter $frontendRouter, PageResponseFactory $pageResponseFactory,
                         RequestContext $requestContext, LoggerInterface $logger)
    {
        $this->jarves = $jarves;
        $this->routes = new RouteCollection();
        $this->frontendRouter = $frontendRouter;
        $this->pageStack = $pageStack;
        $this->urlMatcher = new UrlMatcher($this->routes, $requestContext);

        parent::__construct(
            $this->urlMatcher,
            $pageStack->getRequestStack()
        );
        $this->editMode = $editMode;
        $this->pageResponseFactory = $pageResponseFactory;
        $this->requestContext = $requestContext;
        $this->logger = $logger;
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

            //we need to reset all routes. They will anyway replaced by FrontendRouter::loadRoutes,
            //but to prevent caching conflicts, when a user removes a plugin for example
            //from a page, we need to know that without using actual caching.
            $this->routes = new RouteCollection();
            $this->urlMatcher->__construct($this->routes, $this->requestContext);

            //prepare for new master request: clear the PageResponse object
            $this->pageStack->setCurrentPage(null);
            $this->pageStack->setCurrentDomain(null);
            $this->pageStack->setPageResponse($this->pageResponseFactory->create());
            $this->frontendRouter->setRequest($request);

            $editorNodeId = (int)$this->pageStack->getRequest()->get('_jarves_editor_node');
            $editorDomainId = (int)$this->pageStack->getRequest()->get('_jarves_editor_domain');

            $domain = null;
            if ($editorDomainId) {
                $domain = $this->pageStack->getDomain($editorDomainId);
                if (!$domain) {
                    //we haven't found any domain that is responsible for this request
                    return;
                }
                $this->pageStack->setCurrentDomain($domain);
            }

            if ($editorNodeId) {
                //handle jarves content editor stuff
                //access is later checked
                if (!$editorNodeId && $domain) {
                    $editorNodeId = $domain->getStartnodeId();
                }

                $page = $this->pageStack->getPage($editorNodeId);
                if (!$page || !$page->isRenderable()) {
                    //we haven't found any page that is responsible for this request
                    return;
                }

                if (!$domain) {
                    $domain = $this->pageStack->getDomain($page->getDomainId());
                }

                $this->pageStack->setCurrentPage($page);
                $this->pageStack->setCurrentDomain($domain);

                $request->attributes->set('_controller', 'jarves.page_controller:handleAction');
            } else {
                //regular frontend route search
                //search domain
                if (!$domain) {
                    $domain = $this->frontendRouter->searchDomain();
                    if (!$domain) {
                        //we haven't found any domain that is responsible for this request
                        return;
                    }
                    $this->pageStack->setCurrentDomain($domain);
                }

                //search page
                $page = $this->frontendRouter->searchPage();
                if (!$page || !$page->isRenderable()) {
                    //we haven't found any page that is responsible for this request
                    return;
                }
                $this->pageStack->setCurrentPage($page);

                if ($response = $this->frontendRouter->loadRoutes($this->routes, $page)) {
                    //loadRoutes return in case of redirects and permissions a redirect or 404 response.
                    $event->setResponse($response);

                    return;
                }

                try {
                    //check routes in $this->route
                    parent::onKernelRequest($event);
                } catch (MethodNotAllowedException $e) {
                } catch (NotFoundHttpException $e) {
                    $this->logger->debug(sprintf('No frontend route found for %s.', $event->getRequest()->getHost().'/'.$event->getRequest()->getPathInfo()));
                }
            }
        }
    }
}