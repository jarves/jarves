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

namespace Jarves\Router;

use Jarves\Cache\Cacher;
use Jarves\Jarves;
use Jarves\Model\Node;
use Jarves\PageStack;
use Jarves\StopwatchHelper;
use Jarves\Utils;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Jarves\Model\DomainQuery;
use Jarves\Model\Content;
use Jarves\Model\ContentQuery;
use Symfony\Component\Routing\Route as SyRoute;
use Symfony\Component\EventDispatcher\GenericEvent;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\RouteCollection;

class FrontendRouter
{
    /**
     * @var Request|null
     */
    protected $request;

    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @var RouteCollection
     */
    protected $routes;

    /**
     * @var string
     */
    protected $foundPageUrl = null;

    /**
     * @var bool
     */
    protected $editorMode = false;

    /**
     * @var EventDispatcherInterface
     */
    private $eventDispatcher;

    /**
     * @var Cacher
     */
    private $cacher;

    /**
     * @var StopwatchHelper
     */
    private $stopwatch;

    /**
     * @var LoggerInterface
     */
    private $logger;

    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * FrontendRouter constructor.
     * @param Jarves $jarves
     * @param PageStack $pageStack
     * @param StopwatchHelper $stopwatch
     * @param LoggerInterface $logger
     * @param EventDispatcherInterface $eventDispatcher
     * @param Cacher $cacher
     */
    function __construct(Jarves $jarves, PageStack $pageStack, StopwatchHelper $stopwatch,
                         LoggerInterface $logger, EventDispatcherInterface $eventDispatcher, Cacher $cacher)
    {
        $this->jarves = $jarves;
        $this->stopwatch = $stopwatch;
        $this->logger = $logger;
        $this->eventDispatcher = $eventDispatcher;
        $this->cacher = $cacher;
        $this->pageStack = $pageStack;
    }

    /**
     * @param \Symfony\Component\Routing\RouteCollection $routes
     */
    public function setRoutes($routes)
    {
        $this->routes = $routes;
    }

    /**
     * @return \Symfony\Component\Routing\RouteCollection
     */
    public function getRoutes()
    {
        return $this->routes;
    }

    /**
     * @param Request $request
     */
    public function setRequest($request)
    {
        $this->request = $request;
    }

    /**
     * @return Request
     */
    public function getRequest()
    {
        return $this->request;
    }

    /**
     * Check for redirects/access requirements
     *
     * @param RouteCollection $routes
     * @param Node $page
     *
     * @return null|RedirectResponse|Response
     */
    public function loadRoutes(RouteCollection $routes, Node $page)
    {
        $this->routes = $routes;

        if ($this->request) {
            if ($this->pageStack->isAdmin()) {
                return null;
            }

            $this->registerMainPage($page);
            $this->registerPluginRoutes($page);
            if ($response = $this->checkPageAccess($page)) {
                return $response;
            }
        }

        return null;
    }

    public function checkPageAccess(Node $page)
    {
        /** @var Node $oriPage */
        $oriPage = $page;

        if ($page->getAccessFrom() > 0 && ($page->getAccessFrom() > time())) {
            $page = false;
        }

        if ($page->getAccessTo() > 0 && ($page->getAccessTo() < time())) {
            $page = false;
        }

        if ($page->getAccessFromGroups() != '') {

            $access = false;
            $groups = ',' . $page->getAccessFromGroups() . ","; //eg ,2,4,5,

            $cgroups = null;
            if ($page['access_need_via'] == 0) {
                //we need to move this to a extra listener
//                $cgroups =& $this->getJarves()->getClient()->getUser()->getGroups();
            } else {
//                $htuser = $this->getJarves()->getClient()->login($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW']);
//
//                if ($htuser['id'] > 0) {
//                    $cgroups =& $htuser['groups'];
//                }
            }

            if ($cgroups) {
                foreach ($cgroups as $group) {
                    if (strpos($groups, "," . $group['group_id'] . ",") !== false) {
                        $access = true;
                    }
                }
            }

            if (!$access) {
                //maybe we have access through the backend auth?
                if ($this->pageStack->isLoggedIn()) {
                    foreach ($this->pageStack->getUser()->getGroupIdsArray() as $groupId) {
                        if (false !== strpos($groups, "," . $groupId . ",")) {
                            $access = true;
                            break;
                        }
                    }
                }
            }

            if (!$access) {
                $page = false;
            }
        }

        if (!$page && $to = $oriPage->getAccessRedirectTo()) {
            if (intval($to) > 0) {
                $to = $this->pageStack->getNodeUrl($to);
            }

            return new RedirectResponse($to);
        }
//
//        if (!$page && $oriPage->getAccessNeedVia() == 1) {
//            $response = new Response('', 404);
//
//            return $response;
//        }
    }

    public function registerMainPage(Node $page)
    {
        $domain = $this->pageStack->getDomain($page->getDomainId());

        $clazz = 'jarves.page_controller';
        $domainUrl = $domain->getMaster() ? '' : '/' . $domain->getLang();

        $url = $this->pageStack->getRouteUrl($page->getId());

        $controller = $clazz . ':handleAction';

        if ('' !== $url && '/' !== $url && $domain && $domain->getStartnodeId() == $page->getId()) {
            //This is the start page, so add a redirect controller
            $this->routes->add(
                'jarves_frontend_page_redirect_to_startpage_' . $domain->getId(),
                new SyRoute(
                    $url,
                    array(
                        '_controller' => $clazz . ':redirectToStartPageAction',
                        'jarvesFrontend' => true,
                        'nodeId' => $page->getId()
                    )
                )
            );

            $url = $domainUrl;
        }

        $this->routes->add(
            'jarves_frontend_page_' . $page->getId() . '-' . preg_replace('/\W/', '_', $page->getUrn()),
            new SyRoute(
                $url,
                array('_controller' => $controller, 'jarvesFrontend' => true, 'nodeId' => $page->getId())
            )
        );
    }

    public function registerPluginRoutes(Node $page)
    {
        $domain = $this->pageStack->getDomain($page->getDomainId());

        $this->stopwatch->start('Register Plugin Routes');
        //add all router to current router and fire sub-request
        $cacheKey = 'core/node/plugins-' . $page->getId();
        $plugins = $this->cacher->getDistributedCache($cacheKey);

        if (null === $plugins) {
            $plugins = ContentQuery::create()
                ->filterByNodeId($page->getId())
                ->filterByType('plugin')
                ->find();

            $this->cacher->setDistributedCache($cacheKey, serialize($plugins));
        } else {
            $plugins = unserialize($plugins);
        }

        /** @var $plugins Content[] */
        foreach ($plugins as $plugin) {
            if (!$plugin->getContent()) {
                continue;
            }
            $data = json_decode($plugin->getContent(), true);

            if (!$data) {
                $this->logger->alert(
                    sprintf(
                        'On page `%s` [%d] is a invalid plugin `%d`.',
                        $page->getTitle(),
                        $page->getId(),
                        $plugin->getId()
                    )
                );
                continue;
            }

            $bundleName = isset($data['module']) ? $data['module'] : @$data['bundle'];

            $config = $this->jarves->getConfig($bundleName);
            if (!$config) {
                $this->logger->alert(
                    sprintf(
                        'Bundle `%s` for plugin `%s` on page `%s` [%d] does not not exist.',
                        $bundleName,
                        @$data['plugin'],
                        $page->getTitle(),
                        $page->getId()
                    )
                );
                continue;
            }

            $pluginDefinition = $config->getPlugin(@$data['plugin']);

            if (!$pluginDefinition) {
                $this->logger->alert(
                    sprintf(
                        'In bundle `%s` the plugin `%s` on page `%s` [%d] does not not exist.',
                        $bundleName,
                        @$data['plugin'],
                        $page->getTitle(),
                        $page->getId()
                    )
                );
                continue;
            }

            if ($pluginRoutes = $pluginDefinition->getRoutes()) {
                foreach ($pluginRoutes as $idx => $route) {

                    $controller = $pluginDefinition->getController();

                    $defaults = array(
                        '_controller' => $route->getController() ?: $controller,
                        '_jarves_is_plugin' => true,
                        '_content' => $plugin,
                        '_title' => sprintf('%s: %s', $bundleName, $pluginDefinition->getLabel()),
                        'options' => isset($data['options']) && is_array($data['options']) ? $data['options'] : [],
                        'jarvesFrontend' => true,
                        'nodeId' => $page->getId()
                    );

                    if ($route->getDefaults()) {
                        $defaults = array_merge($defaults, $route->getArrayDefaults());
                    }

                    $url = $this->pageStack->getRouteUrl($page->getId());

                    $this->routes->add(
                        'jarves_frontend_plugin_' . ($route->getId() ?: $plugin->getId()) . '_' . $idx,
                        new SyRoute(
                            $url . '/' . $route->getPattern(),
                            $defaults,
                            $route->getArrayRequirements() ?: array(),
                            [],
                            '',
                            [],
                            $route->getMethods() ?: []
                        )
                    );
                }
            }
        }
        $this->stopwatch->stop('Register Plugin Routes');
    }

    /**
     * Reads the requested URL and try to extract the requested language.
     *
     * @return string Empty string if nothing found.
     * @internal
     */
    public function getPossibleLanguage()
    {
        $uri = $this->getRequest()->getRequestUri();

        if (strpos($uri, '/') > 0) {
            $first = substr($uri, 0, strpos($uri, '/'));
        } else {
            $first = $uri;
        }

        if ($this->isValidLanguage($first)) {
            return $first;
        }

        return '';
    }

    /**
     * Check whether specified pLang is a valid language
     *
     * @param $lang
     *
     * @return bool
     */
    public function isValidLanguage($lang)
    {
        return false;
        //todo
//        if (!isset($this->getJarves()->$config['languages']) && $lang == 'en') {
//            return true;
//        } //default
//
//        if ($this->getJarves()->$config['languages']) {
//            return array_search($lang, $this->getJarves()->$config['languages']) !== true;
//        } else {
//            return $lang == 'en';
//        }
    }

    /**
     * Returns the domain if found
     *
     * @return \Jarves\Model\Domain|null
     *
     * @throws \Propel\Runtime\Exception\PropelException
     */
    public function searchDomain()
    {
        $request = $this->getRequest();
        $dispatcher = $this->eventDispatcher;

        if ($domainId = $request->get('_jarves_editor_domain')) {
            $hostname = DomainQuery::create()->select('domain')->findOneById($domainId);
        } else {
            $hostname = $request->getHost();
        }

        $title = sprintf('Searching Domain [%s]', $hostname);
        $this->stopwatch->start($title);

        /** @var \Jarves\Model\Domain $foundDomain */
        $foundDomain = null;
        $possibleLanguage = $this->getPossibleLanguage();
        $hostnameWithLanguage = $hostname . '/' . $possibleLanguage;

        $cachedDomains = $this->cacher->getDistributedCache('core/domains');

        if ($cachedDomains) {
            $cachedDomains = @unserialize($cachedDomains);
        }

        if (!is_array($cachedDomains)) {
            $cachedDomains = array();

            $domains = DomainQuery::create()->find();
            foreach ($domains as $domain) {
                $key = $domain->getDomain();
                $langKey = '';

                if (!$domain->getMaster()) {
                    $langKey = '/' . $domain->getLang();
                }

                $cachedDomains[$key . $langKey] = $domain;

                if ($domain->getRedirect()) {
                    $redirects = $domain->getRedirect();
                    $redirects = explode(',', str_replace(' ', '', $redirects));
                    foreach ($redirects as $redirectDomain) {
                        $cachedDomains['!redirects'][$redirectDomain . $langKey] = $key . $langKey;
                    }
                }

                if ($domain->getAlias()) {
                    $aliases = $domain->getAlias();
                    $aliases = explode(',', str_replace(' ', '', $aliases));
                    foreach ($aliases as $aliasDomain) {
                        $cachedDomains['!aliases'][$aliasDomain . $langKey] = $key . $langKey;
                    }
                }
            }

            $this->cacher->setDistributedCache('core/domains', serialize($cachedDomains));
        }

        //search redirect
        if (isset($cachedDomains['!redirects'])
            && (isset($cachedDomains['!redirects'][$hostnameWithLanguage]) && $redirectToDomain = $cachedDomains['!redirects'][$hostnameWithLanguage])
            || (isset($cachedDomains['!redirects'][$hostname]) && $redirectToDomain = $cachedDomains['!redirects'][$hostname])
        ) {
            $foundDomain = $cachedDomains[$redirectToDomain];
            $dispatcher->dispatch('core/domain-redirect', new GenericEvent($foundDomain));

            return null;
        }

        //search alias
        if (isset($cachedDomains['!aliases']) &&
            ((isset($cachedDomains['!aliases'][$hostnameWithLanguage]) && $aliasHostname = $cachedDomains['!aliases'][$hostnameWithLanguage]) ||
                (isset($cachedDomains['!aliases'][$hostname]) && $aliasHostname = $cachedDomains['!aliases'][$hostname]))
        ) {
            $foundDomain = $cachedDomains[$aliasHostname];
            $hostname = $aliasHostname;
        } else {
            if (isset($cachedDomains[$hostname])) {
                $foundDomain = $cachedDomains[$hostname];
            }
        }

        if (!$foundDomain) {
            $dispatcher->dispatch('core/domain-not-found', new GenericEvent($hostname));

            return null;
        }

        $foundDomain->setRealDomain($hostname);
        $this->stopwatch->stop($title);

        return $foundDomain;
    }

    /**
     * Returns the id of given path-info. Null if not existent.
     * 
     * @return Node|null
     */
    public function searchPage()
    {
        $url = $this->getRequest()->getPathInfo();

        $page = null;
        $title = sprintf('Searching Page [%s]', $url);

        $this->stopwatch->start($title);
        if (!$page) {
            $domain = $this->pageStack->getCurrentDomain();
            $urls = $this->pageStack->getCachedUrlToPage($domain->getId());

            $possibleUrl = $url;
            $id = false;

            while (1) {
                if (isset($urls[$possibleUrl])) {
                    $id = $urls[$possibleUrl];
                    break;
                }

                if (false !== $pos = strrpos($possibleUrl, '/')) {
                    $possibleUrl = substr($possibleUrl, 0, $pos);
                } else {
                    break;
                }
            }

            if (!$id) {
                //set to startpage
                $id = $domain->getStartnodeId();
                $possibleUrl = '/';
            }

            $url = $possibleUrl;

            if ($url == '/') {
                $pageId = $this->pageStack->getCurrentDomain()->getStartnodeId();

                if (!$pageId > 0) {
                    $this->eventDispatcher->dispatch('core/domain-no-start-page');
                }
            } else {
                $pageId = $id;
            }
            /** @var \Jarves\Model\Node $page */
            $page = $this->pageStack->getPage($pageId);
        }

        $this->stopwatch->stop($title);

        return $page;
    }

}