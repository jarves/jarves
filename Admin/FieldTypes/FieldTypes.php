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

namespace Jarves\Admin\FieldTypes;

use Symfony\Component\DependencyInjection\ContainerInterface;

class FieldTypes {

    /**
     * @var AbstractSingleColumnType[]
     */
    protected $types;

    /**
     * @var ContainerInterface
     */
    protected $container;

    function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }


    /**
     * @param string $alias
     * @param string $fieldTypeServiceId
     */
    public function addType($alias, $fieldTypeServiceId)
    {
        $this->types[strtolower($alias)] = $fieldTypeServiceId;
    }

    /**
     * @param string $alias
     * @return TypeInterface
     * @throws TypeNotFoundException
     */
    public function newType($alias)
    {
        if ($serviceId = @$this->types[strtolower($alias)]) {
            return $this->container->get($serviceId);
        }

        throw new TypeNotFoundException(sprintf('FieldType `%s` not found. You should create a service that implements Jarves\Admin\FieldTypes\TypeInterface and tag it with `jarves.field.type`', $alias));
    }

}