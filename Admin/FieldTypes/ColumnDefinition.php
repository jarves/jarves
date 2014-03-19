<?php

namespace Jarves\Admin\FieldTypes;


class ColumnDefinition implements ColumnDefinitionInterface {

    /**
     * Column name to select. camelCased.
     *
     * @var string
     */
    protected $name;

    /**
     * @var string
     */
    protected $phpDataType;

    /**
     * @var string
     */
    protected $sqlDataType;

    /**
     * @var string
     */
    protected $requiredRegex;

    /**
     * @param string $name
     */
    public function setName($name)
    {
        $this->name = $name;
    }

    /**
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @param string $phpDataType
     */
    public function setPhpDataType($phpDataType)
    {
        $this->phpDataType = $phpDataType;
    }

    /**
     * @return string
     */
    public function getPhpDataType()
    {
        return $this->phpDataType;
    }

    /**
     * @param string $sqlDataType
     */
    public function setSqlDataType($sqlDataType)
    {
        $this->sqlDataType = $sqlDataType;
    }

    /**
     * @return string
     */
    public function getSqlDataType()
    {
        return $this->sqlDataType;
    }

    /**
     * @return mixed|string
     */
    public function getRequiredRegex()
    {
        if ($this->requiredRegex) {
            return $this->requiredRegex;
        }

        if ('string' === $this->getPhpDataType()) {
            return '.+';

        } else {
            if (static::isInteger($this)) {
                return '[-+]?\d+';

            } else {
                if (static::isFloat($this)) {
                    return '[-+]?(\d*[.])?\d+';

                } else {
                    if (static::isBoolean($this)) {
                        return 'false|true|1|0';
                    }
                }
            }
        }
    }

    /**
     * @param string $requiredRegex
     */
    public function setRequiredRegex($requiredRegex)
    {
        $this->requiredRegex = $requiredRegex;
    }

    /**
     * @param ColumnDefinitionInterface $column
     * @return bool
     */
    public static function isInteger(ColumnDefinitionInterface $column)
    {
        return 'integer' === $column->getPhpDataType();
    }

    /**
     * @param ColumnDefinitionInterface $column
     * @return bool
     */
    public static function isFloat(ColumnDefinitionInterface $column)
    {
        return in_array($column->getPhpDataType(), ['float', 'double', 'real']);
    }

    /**
     * @param ColumnDefinitionInterface $column
     * @return bool
     */
    public static function isBoolean(ColumnDefinitionInterface $column)
    {
        return in_array($column->getPhpDataType(), ['boolean', 'bool']);
    }
}