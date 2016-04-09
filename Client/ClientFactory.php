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

use Jarves\Configuration\Client;
use Jarves\JarvesConfig;
use Symfony\Component\DependencyInjection\ContainerInterface;

class ClientFactory
{
    /**
     * @var ContainerInterface
     */
    private $container;
    /**
     * @var JarvesConfig
     */
    private $jarvesConfig;

    /**
     * @param ContainerInterface $container
     * @param JarvesConfig $jarvesConfig
     */
    public function __construct(ContainerInterface $container, JarvesConfig $jarvesConfig)
    {
        $this->container = $container;
        $this->jarvesConfig = $jarvesConfig;
    }

    public function create(Client $client = null)
    {
        if (!$client) {
            $client = $this->jarvesConfig->getSystemConfig()->getClient(true);
        }

        /** @var ClientAbstract $instance */
        $instance = $this->container->get($client->getService());

        /** @var SessionStorageInterface $store */
        $store = $this->container->get($client->getSessionStorage()->getService());
        $store->configure($client->getSessionStorage(), $instance);

        $instance->configure($client, $store);

        return $instance;
    }
}