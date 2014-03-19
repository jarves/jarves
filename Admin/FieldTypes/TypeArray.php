<?php

namespace Jarves\Admin\FieldTypes;

class TypeArray extends AbstractSingleColumnType
{
    protected $name = 'Array';

    //#todo
    protected $phpDataType = 'string';

    protected $sqlDataType = 'VARCHAR(255)';

}