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

/**
 * This configuration class configures a new field-type for crud views and other administration fields.
 *
 */
class FieldType extends Model
{
    protected $rootName = 'field-type';

    protected $attributes = ['id', 'service', 'userInterfaceOnly'];

    protected $requiredProperties = ['id'];

    /**
     * Needs to be unique across all bundles.
     *
     * @var string
     */
    protected $id;

    /**
     * @var string
     */
    protected $label;

    /**
     * @var string
     */
    protected $description;

    /**
     * The Symfony service to chose for the rendering (Jarves\ContentRender)
     *
     * @var string
     */
    protected $service;

    /**
     * Javascript asset path to a file that should be included to provide the field interface for the user interface.
     * The javascript class inside the javascript file should extend `jarves.FieldAbstract`.
     *
     * @var string
     */
    protected $javascript;

    /**
     * Not yet implemented.
     *
     * @var Field[]
     */
    protected $options;

    /**
     * @var bool
     */
    protected $userInterfaceOnly = false;

    /**
     * @return string
     */
    public function getDescription()
    {
        return $this->description;
    }

    /**
     * @param string $description
     */
    public function setDescription($description)
    {
        $this->description = $description;
    }

    /**
     * @return string
     */
    public function getService()
    {
        return $this->service;
    }

    /**
     * @param string $service
     */
    public function setService($service)
    {
        $this->service = $service;
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
    public function isUserInterfaceOnly()
    {
        return $this->userInterfaceOnly;
    }

    /**
     * @return boolean
     */
    public function getUserInterfaceOnly()
    {
        return $this->userInterfaceOnly;
    }

    /**
     * @param boolean $userInterfaceOnly
     */
    public function setUserInterfaceOnly($userInterfaceOnly)
    {
        $this->userInterfaceOnly = $this->bool($userInterfaceOnly);
    }

    /**
     * @return string
     */
    public function getJavascript()
    {
        return $this->javascript;
    }

    /**
     * @param string $javascript
     */
    public function setJavascript($javascript)
    {
        $this->javascript = $javascript;
    }
}