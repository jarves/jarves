<?php

namespace Jarves\Admin\FieldTypes;

class TypeSelect extends AbstractSingleColumnType
{
    protected $name = 'Select';

    protected $phpDataType = 'string';

    protected $sqlDataType = 'string';
}