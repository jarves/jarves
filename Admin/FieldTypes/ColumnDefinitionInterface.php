<?php

namespace Jarves\Admin\FieldTypes;

interface ColumnDefinitionInterface
{
    public function getName();

    /**
     * @return string
     */
    public function getPhpDataType();

    /**
     * @return string
     */
    public function getSqlDataType();

    /**
     * @return mixed
     */
    public function getRequiredRegex();
}