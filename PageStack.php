<?php

namespace Jarves;

use Jarves\Cache\Cacher;
use Jarves\Client\ClientAbstract;
use Jarves\Client\ClientFactory;
use Jarves\Configuration\Client;
use Jarves\Model\Domain;
use Jarves\Model\Node;
use Jarves\Model\NodeQuery;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;

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
     * @var JarvesConfig
     */
    private $jarvesConfig;

    /**
     * Client instance in administration area.
     *
     * @var ClientAbstract
     */
    protected $adminClient;

    /**
     * Frontend client instance.
     *
     * @var ClientAbstract
     */
    protected $client;
    /**
     * @var RequestStack
     */
    private $requestStack;

    /**
     * @var Request
     */
    private $lastRequest;

    /**
     * @var ClientFactory
     */
    private $clientFactory;

    /**
     * @var Cacher
     */
    private $cacher;

    /**
     * @param string $adminPrefix
     * @param RequestStack $requestStack
     * @param ClientFactory $clientFactory
     * @param Cacher $cacher
     */
    public function __construct($adminPrefix, RequestStack $requestStack, ClientFactory $clientFactory, Cacher $cacher)
    {
        $this->adminPrefix = $adminPrefix;
        $this->requestStack = $requestStack;
        $this->clientFactory = $clientFactory;
        $this->cacher = $cacher;
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

    public function reset()
    {
        $this->pageResponse = null;
        $this->node = null;
        $this->domain = null;
        $this->adminClient = null;
        $this->client = null;
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
     * Returns the current session client instance for administration.
     * If not exists, we create it and start the session process.
     *
     * Note that this method creates a new AbstractClient instance and starts
     * the whole session process mechanism (with sending sessions ids etc)
     * if the adminClient does not exists already.
     *
     * @return ClientAbstract
     */
    public function getAdminClient()
    {
        if (null === $this->adminClient) {
            $this->adminClient = $this->clientFactory->create();
            $this->adminClient->start();
        }

        return $this->adminClient;
    }

    /**
     * Returns the current session client for front end.
     *
     * If not exists, we create it and start the session process.
     *
     * Note that this method creates a new AbstractClient instance and starts
     * the whole session process mechanism (with sending sessions ids etc)
     * if the adminClient does not exists already.
     *
     * @return ClientAbstract
     *
     */
    public function getClient()
    {
        if (null === $this->client) {
            $config = $this->getCurrentDomain() ? $this->getCurrentDomain()->getSessionProperties() : null;
            $this->client = $this->clientFactory->create($config);
        }

        return $this->client;
    }

    /**
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
     * Returns Domain object
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
     * @param        $nodeOrId
     * @param bool $fullUrl
     * @param bool $suppressStartNodeCheck
     * @param Domain $domain
     *
     * @return string
     */
    public function getNodeUrl($nodeOrId, $fullUrl = false, $suppressStartNodeCheck = false, Domain $domain = null)
    {
        $id = $nodeOrId;

        if (!$nodeOrId) {
            $nodeOrId = $this->getCurrentPage();
        }

        if ($nodeOrId instanceof Node) {
            $id = $nodeOrId->getId();
        }

        $domainId = $nodeOrId instanceof Node ? $nodeOrId->getDomainId() : $this->getDomainOfPage($id);
        $currentDomain = $domain ?: $this->getCurrentDomain();

        if (!$suppressStartNodeCheck && $currentDomain->getStartnodeId() === $id) {
            $url = '/';
        } else {
            $urls = $this->getCachedPageToUrl($domainId);
            $url = isset($urls[$id]) ? $urls[$id] : '';
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

        if ($fullUrl || !$currentDomain || $domainId != $currentDomain->getId()) {
            $domain = $currentDomain ?: $this->getDomain($domainId);

            $domainName = $domain->getRealDomain();
            if ($domain->getMaster() != 1) {
                $url = $domainName . $domain->getPath() . $domain->getLang() . '/' . $url;
            } else {
                $url = $domainName . $domain->getPath() . $url;
            }

            $isSecure = $this->getRequest() ? $this->getRequest()->isSecure() : false;

            $url = 'http' . ($isSecure ? 's' : '') . '://' . $url;
        }

        //crop last /
        if (substr($url, -1) == '/') {
            $url = substr($url, 0, -1);
        }

        //crop first /
        if (substr($url, 0, 1) == '/') {
            $url = substr($url, 1);
        }

        if ($url == '/') {
            $url = '.';
        }

        return $url;
    }


    /**
     * Returns a super fast cached Page object.
     *
     * @param  int $pageId If not defined, it returns the current page.
     *
     * @return Node
     */
    public function getPage($pageId = null)
    {
        if (!$pageId) {
            return $this->getCurrentPage();
        }

        $data = $this->cacher->getDistributedCache('core/object/node/' . $pageId);

        if (!$data) {
            $page = NodeQuery::create()->findPk($pageId);
            $this->cacher->setDistributedCache('core/object/node/' . $pageId, serialize($page));
        } else {
            $page = unserialize($data);
        }

        return $page ?: false;
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

        $page2Domain = $this->cacher->getDistributedCache('core/node/toDomains');

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

        $this->cacher->setDistributedCache('core/node/toDomains', $r2d);

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