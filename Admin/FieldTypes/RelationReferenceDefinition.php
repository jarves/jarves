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

class RelationReferenceDefinition implements RelationReferenceDefinitionInterface
{

    /**
     * @var ColumnDefinitionInterface
     */
    protected $localColumn;

    /**
     * @var ColumnDefinitionInterface
     */
    protected $foreignColumn;

    /**
     * @param \Jarves\Admin\FieldTypes\ColumnDefinitionInterface $localColumn
     */
    public function setLocalColumn($localColumn)
    {
        $this->localColumn = $localColumn;
    }

    /**
     * @return \Jarves\Admin\FieldTypes\ColumnDefinitionInterface
     */
    public function getLocalColumn()
    {
        return $this->localColumn;
    }

    /**
     * @param \Jarves\Admin\FieldTypes\ColumnDefinitionInterface $foreignColumn
     */
    public function setForeignColumn($foreignColumn)
    {
        $this->foreignColumn = $foreignColumn;
    }

    /**
     * @return \Jarves\Admin\FieldTypes\ColumnDefinitionInterface
     */
    public function getForeignColumn()
    {
        return $this->foreignColumn;
    }

} 