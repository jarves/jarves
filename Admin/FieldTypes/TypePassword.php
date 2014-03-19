<?php

namespace Jarves\Admin\FieldTypes;

class TypePassword extends AbstractSingleColumnType
{
    protected $name = 'Password';

    protected $phpDataType = 'string';

    protected $sqlDataType = 'VARCHAR(255)';

    public function isDiffAllowed()
    {
        return false;
    }
}