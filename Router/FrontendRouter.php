<?php

namespace Jarves\Router;

use Jarves\Jarves;
use Jarves\Model\Node;
use Jarves\Model\NodeQuery;
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

    function __construct(Jarves $jarves, Request $request)
    {
        $this->request = $request;
        $this->jarves = $jarves;
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
     * @param Jarves $jarves
     */
    public function setJarves($jarves)
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
     *
     * @return null|RedirectResponse|Response
     */
    public function loadRoutes(RouteCollection $routes)
    {
        $this->routes = $routes;

        if ($this->request) {
            if ($this->getJarves()->isAdmin()) {
                return null;
            }

            if ($this->searchDomain() && $page = $this->searchPage($this->request->getPathInfo())) {
                $this->registerMainPage($page);
                $this->registerPluginRoutes($page);
                if ($response = $this->checkPageAccess($page)) {
                    return $response;
                }
            }
        }
    }

    public function checkPageAccess(Node $page)
    {
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
                if ($this->getJarves()->getAdminClient()->hasSession()) {
//                    foreach ($this->getJarves()->getAdminClient()->getUser()->getGroups() as $group) {
//                        if (strpos($groups, "," . $group . ",") !== false) {
//                            $access = true;
//                            break;
//                        }
//                    }
                }
            }

            if (!$access) {
                $page = false;
            }
        }

        if (!$page && $to = $oriPage->getAccessRedirectto()) {
            if (intval($to) > 0) {
                $to = $this->getJarves()->getNodeUrl($to);
            }

            return new RedirectResponse($to);
        }

        if (!$page && $oriPage->getAccessNeedVia() == 1) {
            $response = new Response();

            return $response;
            //create
//            container(
//                'WWW-Authenticate: Basic realm="' .
//                ('Access denied. Maybe you are not logged in or have no access.') . '"'
//            );
//            container('HTTP/1.0 401 Unauthorized');

        }
//        return $page;
    }

    public function registerMainPage(Node $page)
    {
        $domain = $page->getDomain();

        $clazz = 'Jarves\\Controller\\PageController';
        $domainUrl = $domain->getMaster() ? '' : '/' . $domain->getLang();

        $url = $this->jarves->getNodeUrl($page->getId(), null, null, $domain);

        $controller = $clazz . '::handleAction';

        if (!$this->editorMode && '' !== $url && '/' !== $url && $domain && $domain->getStartnodeId() == $page->getId(
            )
        ) {
            //This is the start page, so add a redirect controller
            $this->routes->add(
                'jarves_page_redirect_to_startpage',
                new SyRoute(
                    $url,
                    array(
                        '_controller' => $clazz . '::redirectToStartPageAction',
                        'jarvesFrontend' => true,
                        'nodeId' => $page->getId()
                    )
                )
            );

            $url = $domainUrl;
        }

        $this->routes->add(
            'jarves_page_' . $page->getId() . '-' . preg_replace('/\W/', '_', $page->getUrn()),
            new SyRoute(
                $url,
                array('_controller' => $controller, 'jarvesFrontend' => true, 'nodeId' => $page->getId())
            )
        );
    }

    public function registerPluginRoutes(Node $page)
    {
        $domain = $page->getDomain();
        $this->getJarves()->getStopwatch()->start('Register Plugin Routes');
        //add all router to current router and fire sub-request
        $cacheKey = 'core/node/plugins-' . $page->getId();
        $plugins = $this->getJarves()->getDistributedCache($cacheKey);

        if (null === $plugins) {
            $plugins = ContentQuery::create()
                ->filterByNodeId($page->getId())
                ->filterByType('plugin')
                ->find();

            $this->getJarves()->setDistributedCache($cacheKey, serialize($plugins));
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
                $this->getJarves()->getLogger()->addAlert(
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

            $config = $this->getJarves()->getConfig($bundleName);
            if (!$config) {
                $this->getJarves()->getLogger()->alert(
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
                $this->getJarves()->getLogger()->addAlert(
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

                    $clazz = $pluginDefinition->getClass();
                    if (false !== strpos($clazz, '\\')) {
                        $controller = $clazz . '::' . $pluginDefinition->getMethod();
                    } else {
                        $controller = $clazz . '\\' . $pluginDefinition->getClass(
                            ) . '::' . $pluginDefinition->getMethod();
                    }

                    $defaults = array(
                        '_controller' => $controller,
                        '_content' => $plugin,
                        '_title' => sprintf('%s: %s', $bundleName, $pluginDefinition->getLabel()),
                        'options' => isset($data['options']) && is_array($data['options']) ? $data['options'] : [],
                        'jarvesFrontend' => true,
                        'nodeId' => $page->getId()
                    );

                    if ($route->getDefaults()) {
                        $defaults = array_merge($defaults, $route->getArrayDefaults());
                    }

                    $url = $this->jarves->getNodeUrl($page->getId(), null, null, $domain);

                    $this->routes->add(
                        'jarves_plugin_' . ($route->getId() ?: $plugin->getId()) . '_' . $idx,
                        new SyRoute(
                            $url . '/' . $route->getPattern(),
                            $defaults,
                            $route->getArrayRequirements() ?: array()
                        )
                    );
                }
            }
        }
        $this->getJarves()->getStopwatch()->stop('Register Plugin Routes');
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
     * @param string $lang
     *
     * @return bool
     * @internal
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
     * @param bool $noRefreshCache
     *
     * @return \Jarves\Model\Domain|null
     *
     * @throws \Propel\Runtime\Exception\PropelException
     */
    public function searchDomain($noRefreshCache = false)
    {
        $request = $this->getRequest();
        $dispatcher = $this->getJarves()->getEventDispatcher();

        if ($domainId = $request->get('_jarves_editor_domain')) {
            $hostname = DomainQuery::create()->select('domain')->findOneById($domainId);
        } else {
            $hostname = $request->getHost();
        }
        $stopwatch = $this->getJarves()->getStopwatch();

        $title = sprintf('Searching Domain [%s]', $hostname);
        $stopwatch->start($title);

        /** @var \Jarves\Model\Domain $foundDomain */
        $foundDomain = null;
        $possibleLanguage = $this->getPossibleLanguage();
        $hostnameWithLanguage = $hostname . '/' . $possibleLanguage;

        $cachedDomains = $this->getJarves()->getDistributedCache('core/domains');

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
                    $langKey = '/' . $domain->getLanguage();
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

            $this->getJarves()->setDistributedCache('core/domains', serialize($cachedDomains));
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

        $this->getJarves()->setCurrentDomain($foundDomain);
        $foundDomain->setRealDomain($hostname);

        $stopwatch->stop($title);

        return $foundDomain;
    }

    /**
     * Returns the id of given path-info. Null if not existent.
     *
     * @param string $pathInfo
     *
     * @return Node|null
     */
    protected function searchPage($pathInfo)
    {
        $url = $this->getRequest()->getPathInfo();
        $stopwatch = $this->getJarves()->getStopwatch();

        $page = null;
        $title = sprintf('Searching Page [%s]', $url);

        if ($nodeId = (int)$this->getRequest()->get('_jarves_editor_node')) {
            if ($this->getJarves()->isEditMode($nodeId)) {
                $title = sprintf('Use Page from Editor [%s]', $nodeId);
                $page = NodeQuery::create()->findPk($nodeId);
                $this->editorMode = true;
                if ($layout = $this->getRequest()->get('_jarves_editor_layout')) {
                    $page->setLayout($layout);
                }
                $this->getJarves()->setCurrentPage($page);
            }
        }

        $stopwatch->start($title);
        if (!$page) {
            $domain = $this->getJarves()->getCurrentDomain();
            $urls = $this->getJarves()->getUtils()->getCachedUrlToPage($domain->getId());

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
                $pageId = $this->getJarves()->getCurrentDomain()->getStartnodeId();

                if (!$pageId > 0) {
                    $this->getJarves()->getEventDispatcher()->dispatch('core/domain-no-start-page');
                }
            } else {
                $pageId = $id;
            }
            /** @var \Jarves\Model\Node $page */
            $page = $this->getJarves()->getUtils()->getPage($pageId);
            $this->getJarves()->setCurrentPage($page);
        }

        $stopwatch->stop($title);

        return $page;
    }

}