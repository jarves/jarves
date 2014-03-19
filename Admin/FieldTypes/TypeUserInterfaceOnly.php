<?php

namespace Jarves\Admin\FieldTypes;


class TypeUserInterfaceOnly extends AbstractSingleColumnType
{
    public function getRequiredRegex()
    {
        return '.*';
    }

    public function validate()
    {
        return [];
    }


} 