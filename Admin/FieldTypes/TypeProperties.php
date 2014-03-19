<?php

namespace Jarves\Admin\FieldTypes;

class TypeProperties extends AbstractSingleColumnType
{
    protected $name = 'Properties';

    protected $phpDataType = 'object';

    protected $sqlDataType = 'OBJECT';
}