<?php
/**
 * This file is part of Jarves.
 *
 * (c) Marc J. Schmidt <marc@marcjschmidt.de>
 *
 *     J.A.R.V.E.S - Just A Rather Very Easy [content management] System.
 *
 *     http://jarves.io
 *
 * To get the full copyright and license information, please view the
 * LICENSE file, that was distributed with this source code.
 */

namespace Jarves\Configuration;

class Route extends Model
{
    protected $attributes = ['id', 'pattern', 'methods', 'controller'];

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
     * Per default all methods are allowed. Use 'GET', 'POST', or 'GET|POST' to limit it.
     *
     * @var string[]
     */
    protected $methods;

    /**
     * Overwrites the controller for this route. Per default the controller of the plugin is used.
     *
     * @var string
     */
    protected $controller;

    /**
     * @return string[]
     */
    public function getMethods()
    {
        return $this->methods;
    }

    /**
     * @param string[] $methods
     */
    public function setMethods($methods)
    {
        $this->methods = $methods;
    }

    /**
     * @return string
     */
    public function getController()
    {
        return $this->controller;
    }

    /**
     * @param string $controller
     */
    public function setController($controller)
    {
        $this->controller = $controller;
    }

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