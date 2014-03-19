<?php

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