<?php

namespace Jarves\Admin\FieldTypes;

class TypeContent extends AbstractSingleColumnType
{
    protected $name = 'Node Contents';

    protected $phpDataType = 'string';

    protected $sqlDataType = 'LONGVARCHAR';

    /**
     * @return array
     */
    public function getSelection()
    {
        return [$this->getFieldDefinition()->getId().'.*', 'layout', 'theme'];
    }
}