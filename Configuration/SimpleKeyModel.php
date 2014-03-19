<?php

namespace Jarves\Configuration;

/**
 * Class SimpleModel
 *
 * Model with two fields:
 *  key and value.
 *
 * <item key="$key">$value</item>
 *
 * @package Core\Config
 */
class SimpleKeyModel extends Model
{
    protected $attributes = ['key'];

    protected $nodeValueVar = 'value';
    protected $arrayKey = 'key';

    /**
     * @var string
     */
    protected $key;

    /**
     * @var string
     */
    protected $value;

    /**
     * @param string $key
     */
    public function setKey($key)
    {
        $this->key = $key;
    }

    /**
     * @return string
     */
    public function getKey()
    {
        return $this->key;
    }

    /**
     * @param string $value
     */
    public function setValue($value)
    {
        $this->value = $value;
    }

    /**
     * @return string
     */
    public function getValue()
    {
        return $this->value;
    }

    public function toArray($printDefaults = false)
    {
        return $this->getValue();
    }

}