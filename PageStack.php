<?php

namespace Jarves;

use Jarves\Client\ClientAbstract;
use Jarves\Client\ClientFactory;
use Jarves\Configuration\Client;
use Jarves\Model\Domain;
use Jarves\Model\Node;
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
     * @param string $adminPrefix
     * @param RequestStack $requestStack
     * @param ClientFactory $clientFactory
     */
    public function __construct($adminPrefix, RequestStack $requestStack, ClientFactory $clientFactory)
    {
        $this->adminPrefix = $adminPrefix;
        $this->requestStack = $requestStack;
        $this->clientFactory = $clientFactory;
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
}