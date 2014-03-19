<?php

namespace Jarves\Client;

use Jarves\Configuration\SessionStorage;

abstract class AbstractStore implements SessionStorageInterface {

    /**
     * @var ClientAbstract
     */
    protected $client;

    /**
     * @var SessionStorage
     */
    protected $storage;

    function __construct(SessionStorage $storage, ClientAbstract $client)
    {
        $this->storage = $storage;
        $this->client = $client;
    }

    /**
     * @param ClientAbstract $client
     */
    public function setClient($client)
    {
        $this->client = $client;
    }

    /**
     * @return ClientAbstract
     */
    public function getClient()
    {
        return $this->client;
    }

    /**
     * @param SessionStorage $storage
     */
    public function setStorage($storage)
    {
        $this->storage = $storage;
    }

    /**
     * @return SessionStorage
     */
    public function getStorage()
    {
        return $this->storage;
    }

}