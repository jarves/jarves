<?php

namespace Jarves\Admin\FieldTypes;

class TypeFilelist extends AbstractSingleColumnType
{
    protected $name = 'File list';

    protected $phpDataType = 'string';

    protected $sqlDataType = 'LONGVARCHAR';

}