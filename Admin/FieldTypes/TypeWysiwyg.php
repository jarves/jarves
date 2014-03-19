<?php

namespace Jarves\Admin\FieldTypes;

class TypeWysiwyg extends AbstractSingleColumnType
{
    protected $name = 'Wysiwyg';

    protected $phpDataType = 'string';

    protected $sqlDataType = 'LONGVARCHAR';

}