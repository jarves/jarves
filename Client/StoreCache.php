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
use Jarves\Model\Session;

class StoreCache extends AbstractStore
{
    /**
     * @var \Jarves\Cache\CacheInterface
     */
    protected $cache;

    function __construct(SessionStorage $storage, ClientAbstract $client)
    {
        parent::__construct($storage, $client);

        $clazz = $client->getClientConfig()->getSessionStorage()->getOption('class');
        $this->cache = new $clazz();
        if (!$this->cache instanceof \Jarves\Cache\CacheInterface) {
            throw new \LogicException('Session storage cache class not a instance of \Jarves\Cache\CacheInterface.');
        }
    }


    public function save($key, Session $session)
    {
        $cacheKey = $this->getClient()->getTokenId() . '_' . $key;
        return $this->cache->set(
            $cacheKey,
            $session->exportTo('JSON'),
            $this->getClient()->getConfig()['timeout']
        );
    }

    public function get($key)
    {
        $cacheKey = $this->getClient()->getTokenId() . '_' . $key;
        return $this->cache->get($cacheKey);
    }

    public function delete($key)
    {
        $cacheKey = $this->getClient()->getTokenId() . '_' . $key;
        $this->cache->delete($cacheKey);
    }

}