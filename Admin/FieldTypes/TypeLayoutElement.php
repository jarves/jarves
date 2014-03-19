<?php

namespace Jarves\Admin\FieldTypes;

class TypeLayoutElement extends AbstractSingleColumnType
{
    protected $name = 'LayoutElement';

    protected $phpDataType = 'string';

    protected $sqlDataType = 'LONGVARCHAR';

    //todo, we need a other way to tell the ormSyncer which columns we need
    //as we need here also tables

}