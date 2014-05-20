<?php

namespace Jarves\Configuration;

use Symfony\Component\DependencyInjection\ContainerAwareInterface;

class Stream extends Model
{
    protected $attributes = ['path'];

    /**
     * @var string
     */
    protected $class;

    /**
     * @var string
     */
    protected $method;

    /**
     * @var string
     */
    protected $label;

    /**
     * @var string
     */
    protected $path;

    /**
     * @param string $class
     */
    public function setClass($class)
    {
        $this->class = $class;
    }

    /**
     * @return string
     */
    public function getClass()
    {
        return $this->class;
    }

    /**
     * @param string $path
     */
    public function setPath($path)
    {
        $this->path = $path;
    }

    /**
     * @return string
     */
    public function getPath()
    {
        return $this->path;
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
     * @param string $method
     */
    public function setMethod($method)
    {
        $this->method = $method;
    }

    /**
     * @return string
     */
    public function getMethod()
    {
        return $this->method;
    }

    public function run(&$response, array $params = array())
    {
        $clazz = $this->getClass();
        $method = $this->getMethod();
        $controller = new $clazz();

        if ($controller instanceof ContainerAwareInterface) {
            $controller->setContainer($this->getJarves()->getContainer());
        }

        $callable = array($controller, $method);
        $parameters = array(&$response, $params);
        call_user_func_array($callable, $parameters);
    }

}