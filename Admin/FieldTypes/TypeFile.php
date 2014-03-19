<?php

namespace Jarves\Admin\FieldTypes;

use Jarves\Tools;

class TypeFile extends AbstractSingleColumnType
{
    protected $name = 'File';

    protected $phpDataType = 'string';

    protected $sqlDataType = 'LONGVARCHAR';

    public function setValue($value)
    {
        parent::setValue(Tools::urlDecode($value));
    }

}