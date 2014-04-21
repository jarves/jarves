<?php

namespace Jarves\Admin\FieldTypes;

class TypePageContents extends AbstractSingleColumnType
{
    protected $name = 'Page Contents';

    /**
     * @return array
     */
    public function getSelection()
    {
        return [$this->getFieldDefinition()->getId().'.*', 'layout', 'theme'];
    }
}