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

namespace Jarves\Storage;

use Symfony\Component\DependencyInjection\ContainerInterface;

class StorageFactory
{
    /**
     * @var ContainerInterface
     */
    private $container;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    public function createStorage(\Jarves\Configuration\Object $object)
    {
        $storageService = $object->getStorageService();
        $instance = $this->container->get($storageService);
        $instance->configure($object->getKey(), $object);

        return $instance;
    }
}