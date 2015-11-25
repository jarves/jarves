<?php

namespace Jarves\Configuration;

class EntryPoint extends Model
{
    protected $attributes = ['path', 'type', 'icon', 'multi', 'link', 'system', 'templateUrl'];

    protected $_excludeFromExport = ['parentInstance', 'fullPath', 'bundle'];

    /**
     * @var string
     */
    protected $path;

    /**
     * @var string
     */
    protected $type = 'acl';

    /**
     * @var bool
     */
    protected $system = false;

    /**
     * @var string
     */
    protected $class;

    /**
     * @var string
     */
    protected $icon;

    /**
     * @var boolean
     */
    protected $link = false;

    /**
     * @var string
     */
    protected $label;

    /**
     * @var Bundle
     */
    protected $bundle;

    /**
     * @var boolean
     */
    protected $multi = false;

    /**
     * @var EntryPoint[]
     */
    protected $children;

    /**
     * @var EntryPoint
     */
    protected $parentInstance;

    /**
     * @var string
     */
    protected $templateUrl;

    /**
     * @var string
     */
    protected $fullPath;

    /**
     * @param \Jarves\Configuration\Bundle $bundle
     */
    public function setBundle(Bundle $bundle = null)
    {
        $this->bundle = $bundle;
        if ($this->children) {
            foreach ($this->children as $child) {
                $child->setBundle($bundle);
            }
        }
    }

    /**
     * @return \Jarves\Configuration\Bundle
     */
    public function getBundle()
    {
        return $this->bundle;
    }

    /**
     * @param EntryPoint[] $children
     */
    public function setChildren(array $children = null)
    {
        if (null !== $children) {
            foreach ($children as $child) {
                $child->setParentInstance($this);
            }
        }
        $this->children = $children;
    }

    /**
     * @return EntryPoint[]
     */
    public function getChildren()
    {
        return $this->children;
    }

    /**
     * @return array
     */
    public function getChildrenArray()
    {
        if (null !== $this->children) {
            $entryPoints = array();
            foreach ($this->children as $entryPoint) {
                $entryPoints[$entryPoint->getPath()] = $entryPoint->toArray();
            }
            return $entryPoints;
        }
    }

    public function setParentInstance(EntryPoint $parentInstance = null)
    {
        $this->parentInstance = $parentInstance;
        $this->setBundle($parentInstance->getBundle());
    }

    public function getParentInstance()
    {
        return $this->parentInstance;
    }

    public function toArray($element = null)
    {
        $result = parent::toArray($element);
        $result['fullPath'] = $this->getFullPath();
        return $result;
    }

    /**
     * @return string
     */
    public function getFullPath()
    {
        if (null === $this->fullPath) {
            $path[] = $this->getPath();
            $instance = $this;
            while ($instance = $instance->getParentInstance()) {
                if (!($instance instanceof EntryPoint)) {
                    break;
                }
                array_unshift($path, $instance->getPath());
            }
            $this->fullPath = implode('/', $path);
        }

        return $this->fullPath;
    }

    /**
     * @param string $fullPath
     */
    public function setFullPath($fullPath)
    {
        $this->fullPath = $fullPath;
    }

    /**
     * @param $path
     *
     * @return EntryPoint
     */
    public function getChild($path)
    {
        $first = (false === ($pos = strpos($path, '/'))) ? $path : substr($path, 0, $pos);

        if (null !== $this->children) {
            foreach ($this->children as $child) {
                if ($first == $child->getPath()) {
                    if (false !== strpos($path, '/')) {
                        return $child->getChild(substr($path, $pos + 1));
                    } else {
                        return $child;
                    }
                }
            }
        }
    }

    /**
     * @param string $type
     */
    public function setType($type)
    {
        $this->type = $type;
    }

    /**
     * @return string
     */
    public function getType()
    {
        return $this->type;
    }

    public function isFrameworkWindow()
    {
        return in_array($this->type, ['combined', 'list', 'edit', 'add']);
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
     * @param boolean $link
     */
    public function setLink($link)
    {
        $this->link = $this->bool($link);
    }

    /**
     * @return boolean
     */
    public function getLink()
    {
        return $this->link;
    }

    public function isLink()
    {
        return true === $this->link;
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
     * @param boolean $multi
     */
    public function setMulti($multi)
    {
        $this->multi = $this->bool($multi);
    }

    /**
     * @return boolean
     */
    public function getMulti()
    {
        return $this->multi;
    }

    /**
     * @param string $icon
     */
    public function setIcon($icon)
    {
        $this->icon = $icon;
    }

    /**
     * @return string
     */
    public function getIcon()
    {
        return $this->icon;
    }

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
     * @param boolean $system
     */
    public function setSystem($system)
    {
        $this->system = $this->bool($system);
    }

    /**
     * @return boolean
     */
    public function getSystem()
    {
        return $this->system;
    }

    public function isSystem()
    {
        return true === $this->system;
    }

    /**
     * @return string
     */
    public function getTemplateUrl()
    {
        return $this->templateUrl;
    }

    /**
     * @param string $templateUrl
     */
    public function setTemplateUrl($templateUrl)
    {
        $this->templateUrl = $templateUrl;
    }

}