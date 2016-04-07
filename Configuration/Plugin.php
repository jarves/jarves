<?php

namespace Jarves\Configuration;

class Plugin extends Model
{
    protected $attributes = ['id', 'preview'];

    /**
     * @var string
     */
    protected $id;

    /**
     * @var string
     */
    protected $label;

    /**
     * The controller php class name or service id.
     *
     * @var string
     */
    protected $controller;

    /**
     * @var Route[]
     */
    protected $routes;

    /**
     * @var Field[]
     */
    protected $options;

    /**
     * Whether the action in the controller is also usable as preview or not.
     * If the controller for examples has requirements in queryString its not possible,
     * but the plugin could use a additional preview method (listing() => listingPreview()) that
     * does not have the requirement.
     *
     * @var bool
     */
    protected $preview = false;

    /**
     * @param Route[] $routes
     */
    public function setRoutes(array $routes = null)
    {
        $this->routes = $routes;
    }

    /**
     * @param Route $route
     */
    public function addRoute(Route $route)
    {
        $this->routes[] = $route;
    }

    /**
     * @return Route[]
     */
    public function getRoutes()
    {
        return $this->routes;
    }

    /**
     * @param string $controller
     */
    public function setController($controller)
    {
        $this->controller = $controller;
    }

    /**
     * @return string
     */
    public function getController()
    {
        return $this->controller;
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
     * @param string $label
     */
    public function setLabel($label)
    {
        $this->label = $label;
    }

    /**
     * @return string
     */
    public function getLabel()
    {
        return $this->label;
    }

    /**
     * @param Field[] $options
     */
    public function setOptions(array $options = null)
    {
        $this->options = $options;
    }

    /**
     * @return Field[]
     */
    public function getOptions()
    {
        return $this->options;
    }

    /**
     * @param Field $field
     */
    public function addOption(Field $field = null)
    {
        $this->options[] = $field;
    }

    /**
     * @param string $id
     * @return Field
     */
    public function getOption($id)
    {
        if ($this->options) {
            foreach ($this->options as $option) {
                if (strtolower($option->getId()) == strtolower($id)) {
                    return $option;
                }
            }
        }
    }

    /**
     * @return boolean
     */
    public function isPreview()
    {
        return $this->preview;
    }

    /**
     * @param boolean $preview
     */
    public function setPreview($preview)
    {
        $this->preview = $this->bool($preview);
    }

}