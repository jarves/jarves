<?php

namespace Jarves\Admin\FieldTypes;


interface RelationReferenceDefinitionInterface
{
    /**
     * @return ColumnDefinitionInterface
     */
    public function getLocalColumn();

    /**
     * @return ColumnDefinitionInterface
     */
    public function getForeignColumn();
} 