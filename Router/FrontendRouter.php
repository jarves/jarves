<?php

namespace Jarves\Router;

use Jarves\Jarves;
use Jarves\Model\NodeQuery;
use Jarves\Model\Node;
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
     * @var Request
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
    protected $foundPageUrl;

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

    public function loadRoutes(RouteCollection $routes)
    {
        $pathInfo = $this->getRequest()->getPathInfo();

        if ($this->getJarves()->isAdmin()) {
            return null;
        }

        if ($this->searchDomain() && $this->searchPage($pathInfo)) {
            if ($response = $this->checkPageAccess()) {
                return $response;
            }
            $this->routes = $routes;
            $this->registerMainPage();
            $this->registerPluginRoutes();
        }
    }

    public function checkPageAccess()
    {
        $page = $this->getJarves()->getCurrentPage();

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
//            header(
//                'WWW-Authenticate: Basic realm="' .
//                ('Access denied. Maybe you are not logged in or have no access.') . '"'
//            );
//            header('HTTP/1.0 401 Unauthorized');

        }

//        return $page;
    }

    public function registerMainPage()
    {
        $page = $this->getJarves()->getCurrentPage();
        $domain = $this->getJarves()->getCurrentDomain();

        $clazz = 'Jarves\\Controller\\PageController';
        $domainUrl = (!$domain->getMaster()) ? '/' . $domain->getLang() : '';

        $url = $this->foundPageUrl;

        $controller = $clazz . '::handleAction';

        if (!$this->editorMode && '' !== $url && '/' !== $url && $domain && $domain->getStartnodeId() == $page->getId()) {
            //This is the start page, so add a redirect controller
            $this->routes->add(
                'jarves_page_redirect_to_startpage',
                new SyRoute(
                    $url,
                    array('_controller' => $clazz . '::redirectToStartPageAction')
                )
            );

            $url = $domainUrl;
        }

        $this->routes->add(
            'jarves_page_' . $page->getId().'-'.preg_replace('/\W/', '_', $page->getUrn()),
            new SyRoute(
                $url,
                array('_controller' => $controller)
            )
        );
    }

    public function registerPluginRoutes()
    {
        $this->getJarves()->getStopwatch()->start('Register Plugin Routes');
        //add all router to current router and fire sub-request
        $cacheKey = 'core/node/plugins-' . $this->getJarves()->getCurrentPage()->getId();
        $plugins = $this->getJarves()->getDistributedCache($cacheKey);

        if (null === $plugins) {
            $plugins = ContentQuery::create()
                ->filterByNodeId($this->getJarves()->getCurrentPage()->getId())
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
                continue;
            }

            if (!$data) {
                $this->getJarves()->getLogger()->addAlert(
                    sprintf(
                        'On page `%s` [%d] is a invalid plugin `%d`.',
                        $this->getJarves()->getCurrentPage()->getTitle(),
                        $this->getJarves()->getCurrentPage()->getId(),
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
                        $this->getJarves()->getCurrentPage()->getTitle(),
                        $this->getJarves()->getCurrentPage()->getId()
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
                        $this->getJarves()->getCurrentPage()->getTitle(),
                        $this->getJarves()->getCurrentPage()->getId()
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
                        $controller = $clazz . '\\' . $pluginDefinition->getClass() . '::' . $pluginDefinition->getMethod();
                    }

                    $defaults = array(
                        '_controller' => $controller,
                        '_content' => $plugin,
                        'options' => @$data['options']
                    );

                    if ($route->getDefaults()) {
                        $defaults = array_merge($defaults, $route->getArrayDefaults());
                    }

                    $this->routes->add(
                        'jarves_plugin_' . ($route->getId() ? : $plugin->getId()).'_'.$idx,
                        new SyRoute(
                            $this->foundPageUrl . '/' . $route->getPattern(),
                            $defaults,
                            $route->getArrayRequirements() ? : array()
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

    public function searchDomain($noRefreshCache = false)
    {
        $request = $this->getRequest();
        $dispatcher = $this->getJarves()->getEventDispatcher();

        if ($domainId = $request->get('_jarves_editor_domain')) {
            $hostname = DomainQuery::create()->select('domain')->findPk($domainId);
        } else {
            $hostname = $request->getHost();
        }

        $stopwatch = $this->getJarves()->getStopwatch();

        $title = sprintf('Searching Domain [%s]', $hostname);
        $stopwatch->start($title);

        /** @var \Jarves\Model\Domain $domain */
        $domain = null;
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
            $domain = $cachedDomains[$redirectToDomain];
            $dispatcher->dispatch('core/domain-redirect', new GenericEvent($domain));

            return null;
        }

        //search alias
        if (isset($cachedDomains['!aliases']) &&
            (($aliasHostname = $cachedDomains['!aliases'][$hostnameWithLanguage]) ||
                ($aliasHostname = $cachedDomains['!aliases'][$hostname]))
        ) {
            $domain = $cachedDomains[$aliasHostname];
            $hostname = $aliasHostname;
        } else {
            if (isset($cachedDomains[$hostname])) {
                $domain = $cachedDomains[$hostname];
            }
        }

        if (!$domain) {
            $dispatcher->dispatch('core/domain-not-found', new GenericEvent($hostname));
            return null;
        }

        $this->getJarves()->setCurrentDomain($domain);
        $this->getJarves()->getPageResponse()->setResourceCompression($domain->getResourceCompression());
        $domain->setRealDomain($hostname);

        $stopwatch->stop($title);

        return $domain;
    }

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
                $this->foundPageUrl = $pathInfo;
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

            $this->foundPageUrl = $possibleUrl;

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

        return $page ? $page->getId() : null;
    }

}