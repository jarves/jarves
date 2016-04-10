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
     * @var AbstractType[]
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
     * @param string $id
     * @param string $fieldTypeServiceId
     */
    public function addType($id, $fieldTypeServiceId)
    {
        $this->types[strtolower($id)] = $fieldTypeServiceId;
    }

    /**
     * @param string $id
     * @return TypeInterface
     * @throws TypeNotFoundException
     */
    public function newType($id)
    {
        if ($serviceId = @$this->types[strtolower($id)]) {
            return $this->container->get($serviceId);
        }

        throw new TypeNotFoundException(sprintf('FieldType `%s` not found. You should create a service that implements ' .
            'Jarves\Admin\FieldTypes\TypeInterface and add a <field-type> configuration', $id));
    }

    /**
     * @param string $id
     * @return bool
     */
    public function hasType($id)
    {
        return isset($this->types[strtolower($id)]);
    }

    /**
     * @return AbstractType[]
     */
    public function getTypes()
    {
        $types = [];

        foreach ($this->types as $id => $service) {
            $types[$id] = $this->container->get($service);
        }

        return $types;
    }

}