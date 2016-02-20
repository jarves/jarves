<?php

namespace Jarves\Admin\FieldTypes;

class TypeText extends AbstractSingleColumnType
{
    protected $name = 'Text';

    protected $phpDataType = 'string';

    protected $sqlDataType = 'VARCHAR(255)';
}