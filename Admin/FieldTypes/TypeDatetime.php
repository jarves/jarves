<?php

namespace Jarves\Admin\FieldTypes;

class TypeDatetime extends AbstractSingleColumnType
{
    protected $name = 'Datetime';

    protected $phpDataType = 'integer';

    protected $sqlDataType = 'bigint';
}