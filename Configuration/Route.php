<?php

namespace Jarves\Configuration;

class Route extends Model
{
    protected $attributes = ['id', 'pattern'];

    protected $elementToArray = ['requirement' => 'requirements', 'default' => 'defaults'];

    /**
     * @var string
     */
    protected $id;

    /**
     * @var string
     */
    protected $pattern;

    /**
     * @var RouteDefault[]
     */
    protected $defaults;

    /**
     * @var RouteRequirement[]
     */
    protected $requirements;

    /**
     * @param RouteDefault[] $defaults
     */
    public function setDefaults(array $defaults = null)
    {
        $this->defaults = $defaults;
    }

    /**
     * @param RouteDefault $default
     */
    public function addDefault(RouteDefault $default = null)
    {
        $this->defaults[] = $default;
    }

    /**
     * @param RouteRequirement $requirement
     */
    public function addRequirement(RouteRequirement $requirement = null)
    {
        $this->requirements[] = $requirement;
    }

    /**
     * @return RouteDefault[]
     */
    public function getDefaults()
    {
        return $this->defaults;
    }

    /**
     * @param string $key
     * @return RouteDefault
     */
    public function getDefault($key)
    {
        if ($this->defaults) {
            foreach ($this->defaults as $default) {
                if (strtolower($default->getKey()) == strtolower($key)) {
                    return $default;
                }
            }
        }
    }

    /**
     * @param string $key
     * @return string
     */
    public function getDefaultValue($key)
    {
        $default = $this->getDefault($key);
        if ($default) {
            return $default->getValue();
        }
    }

    /**
     * @return array
     */
    public function getArrayDefaults()
    {
        if (null !== $this->defaults) {
            $result = array();
            foreach ($this->defaults as $default) {
                $result[$default->getKey()] = $default->getValue();
            }
            return $result;
        }
    }

    /**
     * @return array
     */
    public function getArrayRequirements()
    {
        if (null !== $this->requirements) {
            $result = array();
            foreach ($this->requirements as $requirement) {
                $result[$requirement->getKey()] = $requirement->getValue();
            }
            return $result;
        }
    }

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
     * @param string $pattern
     */
    public function setPattern($pattern)
    {
        $this->pattern = $pattern;
    }

    /**
     * @return string
     */
    public function getPattern()
    {
        return $this->pattern;
    }

    /**
     * @param RouteRequirement[] $requirements
     */
    public function setRequirements(array $requirements = null)
    {
        $this->requirements = $requirements;
    }

    /**
     * @return RouteRequirement[]
     */
    public function getRequirements()
    {
        return $this->requirements;
    }

}