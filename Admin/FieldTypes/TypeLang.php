<?php

namespace Jarves\Admin\FieldTypes;

class TypeLang extends AbstractSingleColumnType
{
    protected $name = 'Language';

    protected $phpDataType = 'string';

    protected $sqlDataType = 'VARCHAR(7)';
}