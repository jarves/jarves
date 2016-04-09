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

    public function configure(SessionStorage $storage, ClientAbstract $client)
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