<?php

namespace Jarves\Admin\FieldTypes;

use Jarves\Tools;

class TypeImage extends AbstractSingleColumnType
{
    protected $name = 'Image';

    protected $phpDataType = 'string';

    protected $sqlDataType = 'LONGVARCHAR';

    public function setValue($value)
    {
        parent::setValue(Tools::urlDecode($value));
    }

}