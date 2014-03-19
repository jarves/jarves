<?php

namespace Jarves\Configuration;

class Options extends Model
{
    /**
     * @var array
     */
    protected $options;

    protected $rootName = 'options';
    protected $optionName = 'option';
    protected $keyName = 'key';

    public function setupObject($jarves = null)
    {
        if ($jarves) {
            $this->setJarves($jarves);
        }

        $this->options = array();
        foreach ($this->element->childNodes as $child) {
            if ('#' !== substr($child->nodeName, 0, 1)){
                $this->extractOptions($child, $this->options);
            }
        }
    }

    public function extractOptions(\DOMNode $child, array &$options)
    {
        $key = $child->attributes->getNamedItem($this->keyName);
        $key ? $key = $key->nodeValue : null;

        $valueText = null;
        $valueNodes = array();
        foreach ($child->childNodes as $element) {
            if ('#text' === $element->nodeName) {
                $valueText = $element->nodeValue;
            } else if ('#' !== substr($element->nodeName, 0, 1)) {
                $this->extractOptions($element, $valueNodes);
            }
        }

        $value = 0 == count($valueNodes) ? $valueText : $valueNodes;

        if ($key) {
            $options[$key] = $value;
        } else {
            $options[] = $value;
        }
    }

    public function fromArray($values, $key = null)
    {
        $this->options = $values;
    }

    /**
     * @param $element
     * @return array
     */
    public function toArray($element = NULL)
    {
        return $this->options ?: [];
    }

    /**
     * @param \DOMNode     $node
     * @param bool         $printDefaults
     */
    protected function appendOptionsXml(\DOMNode $node, $printDefaults = false)
    {
        if (null === $this->options || 0 === count($this->options)) {
            return;
        }

        $this->appendOptions($this->options, $node);
    }

    /**
     * @param array    $values
     * @param \DOMNode $node
     * @param string   $name
     */
    protected function appendOptions(array $values, \DOMNode $node, $name = null)
    {
        $doc = $node->ownerDocument;
        foreach ($values as $key => $value) {
            $element = $doc->createElement($name ? : $this->optionName);
            if (!is_integer($key)) {
                $element->setAttribute($this->keyName, $key);
            }
            $node->appendChild($element);

            if (is_array($value)) {
                $this->appendOptions($value, $element, $name);
            } else {
                $value = is_bool($value) ? $value?'true':'false' : (string)$value;
                $element->nodeValue = $value;
            }
        }
    }

    /**
     * @param array $options
     */
    public function setOptions(array $options)
    {
        $this->options = $options;
    }

    /**
     * @return array
     */
    public function getOptions()
    {
        return $this->options;
    }

    public function getLength()
    {
        return count($this->options);
    }

    /**
     * @param string $key
     */
    public function removeOption($key)
    {
        unset($this->options[$key]);
    }

    /**
     * @param string $key
     * @param $val
     */
    public function setOption($key, $val)
    {
        $this->options[$key] = $val;
    }

    /**
     * @param string $key
     * @return mixed
     */
    public function getOption($key)
    {
        return $this->options[$key];
    }
}