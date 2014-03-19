<?php

namespace Jarves\Configuration;

/**
 * Class SimpleModel
 *
 * Model with two fields:
 *  id and value.
 *
 * <item id="$id">$value</item>
 *
 * @package Core\Config
 */
class SimpleModel extends Model
{
    protected $attributes = ['id'];

    protected $nodeValueVar = 'value';
    protected $arrayKey = 'id';

    /**
     * @var string
     */
    protected $id;

    /**
     * @var string
     */
    protected $value;

    /**
     * @param string $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return string
     */
    public function getId()
    {
        return $this->id;
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