<?php

namespace Jarves\Configuration;

class ThemeContent extends Model
{
    protected $rootName = 'content';
    protected $requiredProperties = ['file'];

    /**
     * @var string
     */
    protected $label;

    /**
     * File path to a view.
     *
     * Symfony paths recommended like "AppBundle:ControllerName:view.html.twig"
     *
     * @var string
     */
    protected $file;

    /**
     * @param string $file
     */
    public function setFile($file)
    {
        $this->file = $file;
    }

    /**
     * @return string
     */
    public function getFile()
    {
        return $this->file;
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


}