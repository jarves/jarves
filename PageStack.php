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

namespace Jarves;

use Jarves\Cache\Cacher;
use Jarves\Model\Domain;
use Jarves\Model\Node;
use Jarves\Model\NodeQuery;
use Jarves\Model\User;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Security\Core\Authentication\Token\AnonymousToken;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Encoder\EncoderFactoryInterface;

/**
 * Contains current requested node and current domain, and the current PageResponse.
 *
 */
class PageStack
{
    /**
     * @var Domain
     */
    protected $domain;

    /**
     * @var Node
     */
    protected $node;

    /**
     * @var PageResponse
     */
    protected $pageResponse;

    /**
     * @var string
     */
    protected $adminPrefix;

    /**
     * @var RequestStack
     */
    private $requestStack;

    /**
     * @var Request
     */
    private $lastRequest;

    /**
     * @var Cacher
     */
    private $cacher;

    /**
     * @var TokenStorageInterface
     */
    private $tokenStorage;

    /**
     * @param string $adminPrefix
     * @param RequestStack $requestStack
     * @param Cacher $cacher
     * @param TokenStorageInterface $tokenStorage
     */
    public function __construct($adminPrefix, RequestStack $requestStack, Cacher $cacher,
                                TokenStorageInterface $tokenStorage)
    {
        $this->adminPrefix = $adminPrefix;
        $this->requestStack = $requestStack;
        $this->cacher = $cacher;
        $this->tokenStorage = $tokenStorage;
    }

    /**
     * Returns always the master request.
     *
     * @return null|\Symfony\Component\HttpFoundation\Request
     */
    public function getRequest()
    {
        if (null === $this->lastRequest) {
            $this->lastRequest = $this->requestStack->getMasterRequest();
        }


        return $this->lastRequest;
    }

    /**
     * @return RequestStack
     */
    public function getRequestStack()
    {
        return $this->requestStack;
    }

    public function reset()
    {
        $this->pageResponse = null;
        $this->node = null;
        $this->domain = null;
        $this->lastRequest = null;
    }

    /**
     * @return PageResponse
     */
    public function getPageResponse()
    {
        return $this->pageResponse;
    }

    /**
     * @param PageResponse $pageResponse
     */
    public function setPageResponse(PageResponse $pageResponse)
    {
        $this->pageResponse = $pageResponse;
    }

    /**
     * @return string
     */
    public function getAdminPrefix()
    {
        return $this->adminPrefix;
    }

    /**
     * @return Domain
     */
    public function getCurrentDomain()
    {
        return $this->domain;
    }

    /**
     * @param Domain $domain
     */
    public function setCurrentDomain($domain)
    {
        $this->domain = $domain;
    }

    /**
     * @return Node
     */
    public function getCurrentPage()
    {
        return $this->node;
    }

    /**
     * @param Node $node
     */
    public function setCurrentPage($node)
    {
        $this->node = $node;
    }

    /**
     * Returns the current logged in User if available. Null if not or another token than Jarves' is active.
     *
     * @return User|null
     */
    public function getUser()
    {
        $token = $this->tokenStorage->getToken();
        if ($token && !($token instanceof AnonymousToken)) {
            return $token->getUser();
        }

        return null;
    }

    /**
     * @return null|\Symfony\Component\Security\Core\Authentication\Token\TokenInterface
     */
    public function getToken()
    {
        return $this->tokenStorage->getToken();
    }

    /**
     * Returns true when a non AnonymousToken is set (which primarily means a real User is logged in)
     *
     * @return boolean
     */
    public function isLoggedIn()
    {
        return !($this->tokenStorage->getToken() instanceof AnonymousToken);
    }

    /**
     * Returns the current session. if available.
     *
     * @return null|\Symfony\Component\HttpFoundation\Session\SessionInterface
     */
    public function getSession()
    {
        return $this->getRequest()->getSession();
    }

    /**
     * When a route is loading within /jarves
     *
     * @return bool
     */
    public function isAdmin()
    {
        $adminPrefix = $this->adminPrefix;
        if ('/' === substr($adminPrefix, -1)) {
            $adminPrefix = substr($adminPrefix, 0, -1);
        }

        if (!$this->getRequest()) {
            return false;
        }

        return (0 === strpos($this->getRequest()->getPathInfo(), $adminPrefix));
    }

    /**
     * Returns Domain object. This tries to cache the domain, so its a faster access method than using
     * DomainQuery classes.
     *
     * @param int $domainId If not defined, it returns the current domain.
     *
     * @return \Jarves\Model\Domain
     */
    public function getDomain($domainId = null)
    {
        if (!$domainId) {
            return $this->getCurrentDomain();
        }

        if ($domainSerialized = $this->cacher->getDistributedCache('core/object-domain/' . $domainId)) {
            return unserialize($domainSerialized);
        }

        $domain = Model\DomainQuery::create()->findPk($domainId);

        if (!$domain) {
            return false;
        }

        $this->cacher->setDistributedCache('core/object-domain/' . $domainId, serialize($domain));

        return $domain;
    }

    /**
     * @param bool $full
     * 
     * @return string
     */
    public function getCurrentUrl($full = false)
    {
        return $this->getNodeUrl($this->getCurrentPage(), $full);
    }

    /**
     * Returns the affix relative to current page.
     * 
     * If the current page is : /documentation/field,
     * but the actual loaded route is: /documentation/field/field-name,
     * then '/field-name' is returned. 
     * 
     * This can be the case, when a plugin added own routes and returned a result for '/field-name'.
     * 
     * @return string
     */
    public function getCurrentUrlAffix()
    {
        $pathInfo = $this->getRequest()->getPathInfo(); //with leading /
        $currentUrl = $this->getCurrentUrl(); //without leading /

       return substr(ltrim($pathInfo, '/'), strlen($currentUrl));
    }

    /**
     * @param Node|int|string   $nodeOrId
     * @param bool $fullUrl with http://
     * @param bool $suppressStartNodeCheck
     *
     * @return string
     */
    public function getNodeUrl($nodeOrId, $fullUrl = false, $suppressStartNodeCheck = false)
    {
        $id = $nodeOrId;

        if (!$nodeOrId) {
            $nodeOrId = $this->getCurrentPage();
        }

        if ($nodeOrId instanceof Node) {
            $id = $nodeOrId->getId();
        }

        $domain = $this->getCurrentDomain();

        if (!is_numeric($id)) {
            //url given
            $url = $id;
        } else {
            $domainId = $nodeOrId instanceof Node ? $nodeOrId->getDomainId() : $this->getDomainOfPage($id);

            if (!$domain || $domainId !== $domain->getId()) {
                $domain = $this->getDomain($domainId);
            }

            if (!$suppressStartNodeCheck && $domain->getStartnodeId() === $id) {
                $url = '/';
            } else {
                $urls = $this->getCachedPageToUrl($domainId);
                $url = isset($urls[$id]) ? $urls[$id] : '';
            }
        }

        //do we need to add app_dev.php/ or something?
        $prefix = '';
        if ($request = $this->getRequest()) {
            $prefix = substr(
                $request->getBaseUrl(),
                strlen($request->getBasePath())
            );
        }

        if (false !== $prefix) {
            $url = substr($prefix, 1) . $url;
        }

        $domainName = $domain->getRealDomain();

        //crop first /
        if (substr($url, 0, 1) == '/') {
            $url = substr($url, 1);
        }

        if ($fullUrl) {
            $isSecure = $this->getRequest() ? $this->getRequest()->isSecure() : false;

            $url = 'http' . ($isSecure ? 's' : '') . '://' . $domainName . $url;
        } else {
            //check that we have first starting slash
            if ('/' !== substr($url, 0, 1)) {
                $url = '/' . $url;
            }
        }

        //crop last /
        if (substr($url, -1) == '/') {
            $url = substr($url, 0, -1);
        }

        return $url;
    }

    /**
     * @param Node|integer $nodeOrId
     * @param bool $suppressStartNodeCheck
     * @return string
     */
    public function getRouteUrl($nodeOrId, $suppressStartNodeCheck = false)
    {
        $id = $nodeOrId;

        if (!$nodeOrId) {
            $nodeOrId = $this->getCurrentPage();
        }

        if ($nodeOrId instanceof Node) {
            $id = $nodeOrId->getId();
        }

        $domainId = $nodeOrId instanceof Node ? $nodeOrId->getDomainId() : $this->getDomainOfPage($id);
        $domain = $this->getCurrentDomain();

        if (!$domain || $domainId !== $domain->getId()) {
            $domain = $this->getDomain($domainId);
        }

        if (!$suppressStartNodeCheck && $domain->getStartnodeId() === $id) {
            $url = '/';
        } else {
            $urls = $this->getCachedPageToUrl($domainId);
            $url = isset($urls[$id]) ? $urls[$id] : '';
        }

        //crop first /
        if (substr($url, 0, 1) == '/') {
            $url = substr($url, 1);
        }

        if ($domain->getMaster() != 1) {
            $url = $domain->getPath() . $domain->getLang() . '/' . $url;
        } else {
            $url = $domain->getPath() . $url;
        }

        return $url;
    }


    /**
     * Returns a super fast cached Page object.
     *
     * @param Node|string|int $node Node model, url or node id
     *
     * @return Node|null
     */
    public function getPage($node)
    {
        $pageId = $node;

        if ($node instanceof Node) {
            return $node;
        }

        if (!is_numeric($node)) {
            $urlsToPage = $this->getCachedUrlToPage($this->getCurrentDomain()->getId());
            if (isset($urlsToPage[$node])) {
                $pageId = $urlsToPage[$node];
            } else {
                return null;
            }
        }

        $data = $this->cacher->getDistributedCache('core/object/node/' . $pageId);

        if (!$data) {
            $page = NodeQuery::create()->findPk($pageId);
            $this->cacher->setDistributedCache('core/object/node/' . $pageId, serialize($page));
        } else {
            $page = unserialize($data);
        }

        return $page ?: null;
    }

    /**
     * Returns the domain of the given $id page.
     *
     * @param  integer $id
     *
     * @return integer|null
     */
    public function getDomainOfPage($id)
    {
        $id2 = null;

        $page2Domain = $this->cacher->getDistributedCache('core/node/to-domain');

        if (!is_array($page2Domain)) {
            $page2Domain = $this->updatePage2DomainCache();
        }

        $id = ',' . $id . ',';
        foreach ($page2Domain as $domain_id => &$pages) {
            $pages = ',' . $pages . ',';
            if (strpos($pages, $id) !== false) {
                $id2 = $domain_id;
            }
        }

        return $id2;
    }

    public function updatePage2DomainCache()
    {
        $r2d = array();
        $items = NodeQuery::create()
            ->select(['Id', 'DomainId'])
            ->find();

        foreach ($items as $item) {
            $r2d[$item['DomainId']] = (isset($r2d[$item['DomainId']]) ? $r2d[$item['DomainId']] : '') . $item['Id'] . ',';
        }

        $this->cacher->setDistributedCache('core/node/to-domain', $r2d);

        return $r2d;
    }

    /**
     * Returns a array map nodeId -> url
     *
     * @param  integer $domainId
     *
     * @return array
     */
    public function getCachedPageToUrl($domainId)
    {
        return array_flip($this->getCachedUrlToPage($domainId));
    }

    /**
     * Returns a array map url -> nodeId
     *
     * @param integer $domainId
     *
     * @return array
     *
     * @throws \Propel\Runtime\Exception\PropelException
     */
    public function getCachedUrlToPage($domainId)
    {
        $cacheKey = 'core/urls/' . $domainId;
        $urls = $this->cacher->getDistributedCache($cacheKey);

        if (!$urls) {

            $nodes = NodeQuery::create()
                ->select(array('id', 'urn', 'lvl', 'type'))
                ->filterByDomainId($domainId)
                ->orderByBranch()
                ->find();

            //build urls array
            $urls = array();
            $level = array();

            foreach ($nodes as $node) {
                if ($node['lvl'] == 0) {
                    continue;
                } //root

                if ($node['type'] == 3) {
                    continue;
                } //deposit

                if ($node['type'] == 2 || $node['urn'] == '') {
                    //folder or empty url
                    $level[$node['lvl'] + 0] = isset($level[$node['lvl'] - 1]) ? $level[$node['lvl'] - 1] : '';
                    continue;
                }

                $url = isset($level[$node['lvl'] - 1]) ? $level[$node['lvl'] - 1] : '';
                $url .= '/' . $node['urn'];

                $level[$node['lvl'] + 0] = $url;

                $urls[$url] = $node['id'];
            }

            $this->cacher->setDistributedCache($cacheKey, $urls);
        }

        return $urls;
    }

}