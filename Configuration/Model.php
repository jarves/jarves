<?php

namespace Jarves\Configuration;

use Jarves\Jarves;
use \Jarves\Exceptions\FileNotWritableException;

class Model implements \ArrayAccess
{
    /**
     * The element passed in constructor.
     *
     * @var \DOMElement
     */
    protected $element;

    /**
     * The name of the element of this class.
     *
     * @var string
     */
    protected $rootName;

    /**
     * @var \Jarves\Jarves
     */
    protected $jarves;

    /**
     * @var \Jarves\Jarves
     */
    public static $serialisationJarvesCore;

    /**
     * @var array
     */
    protected $_excludeFromExport = [];

    /**
     * Defines which values are attributes of the <rootName> element.
     *
     * @var array
     */
    protected $attributes = [];

    /**
     * Contains the additional (not defined properties) children nodes.
     *
     * @var array
     */
    protected $additionalNodes = [];

    /**
     * Contains the additional (not defined properties) attributes.
     *
     * @var array
     */
    protected $additionalAttributes = [];

    /**
     * Defines the element name in the xml structure of array items in array properties.
     *
     * Scenario:
     *
     *   ConfigClass =>
     *      protected $modules; //@var array
     *      protected $arrayIndexNames = ['modules' => 'module'];
     *
     *   Resulted xml:
     *
     *    <config>
     *      <modules>
     *        <module>value</module>
     *        <module>value2</module>
     *      </modules>
     *    </config>
     *
     *   If you not defined $arrayIndexNames and if you don't have a proper class name as @var
     *   then it will export '<item>' children instead of the '<module>'.
     *
     * @var array
     */
    protected $arrayIndexNames = [];

    /**
     * Defines which properties should be excluded when they have the default value.
     *
     * @var array
     */
    protected $excludeDefaults = [];

    /**
     * Defines which property is used as the nodeValue.
     *
     * @var string
     */
    protected $nodeValueVar;

    /**
     * Defines a key-value array that defines which xml element belongs tho
     * which class (array) property. Useful if you don't group multiple elements.
     *
     * Scenario:
     *   <xml>
     *     <config>
     *       <element></element>
     *       <cache>foo</cache>
     *       <cache>bar</cache>
     *     </config>
     *   </xml>
     *
     * Example:
     *
     * ConfigClass =>
     *   protected $elementToArray = ['cache' => 'caches'];
     *   protected $caches; //@var ConfigCacheClass[]
     *
     * @var array
     */
    protected $elementToArray = [];

    /**
     * If this class should have a custom array key.
     *
     * Scenario:
     *
     *   ConfigClass =>
     *     protected $caches; //@var ConfigCacheClass[]
     *
     *   ConfigCacheClass =>
     *     protected $id;
     *     protected $value;
     *     protected $arrayKey => 'id';
     *
     *    ConfigClass->propertyToArray('caches') -> array('<id>' => $ConfigCacheClass, ...)
     *
     * @var string
     */
    protected $arrayKey;

    /**
     * Defines a header comment for each property (not attributes).
     *
     * Example:
     *
     *  ['caches' => 'blabla']
     *
     * @var array
     */
    protected $docBlocks = [];

    /**
     * Defines a comment for the root element.
     *
     * @var string
     */
    protected $docBlock = '';

    protected $_defaultProperties;
    protected $_modelProperties;

    /**
     * @param \DOMElement|array|string $values
     * @param Jarves                   $jarves
     */
    public function __construct($values = null, Jarves $jarves = null)
    {
        $this->initialize($values, $jarves);
    }

    public function initialize($values = null, $jarves = null)
    {
        if (null === $this->rootName) {
            $array = explode('\\', get_called_class());
            $this->rootName = lcfirst(array_pop($array));
        }

        if (!$jarves) {
            $jarves = static::$serialisationJarvesCore;
        }

        if ($jarves) {
            $this->setJarves($jarves);
        }

        if ($values) {
            if (is_string($values)) {
                $dom = new \DOMDocument();
                $dom->loadXml($values);
                $this->element = $dom->firstChild;
                $this->setupObject($jarves);
            } else if ($values instanceof \DOMElement) {
                $this->element = $values;
                $this->setupObject($jarves);
            } else if (is_array($values)) {
                $this->fromArray($values);
            }
        }
    }

    /**
     * @param \Jarves\Jarves $jarves
     */
    public function setJarves($jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @return \Jarves\Jarves
     */
    public function getJarves()
    {
        return $this->jarves;
    }

    /**
     * @param string $key
     *
     * @return mixed
     */
    public function getAdditional($key)
    {
        return $this->additionalNodes[$key];
    }

    /**
     * @param string $key
     *
     * @return mixed
     */
    public function getAdditionalAttribute($key)
    {
        return $this->additionalAttributes[$key];
    }

    /**
     * @param mixed $val
     *
     * @return bool
     */
    public function bool($val)
    {
        return filter_var($val, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Initialize the object.
     */
    public function setupObject($jarves = null)
    {
        if ($jarves) {
            $this->setJarves($jarves);
        }

        if ($this->element) {
            $this->importNode($this->element);
        }
    }

    /**
     * @param \DOMNode $element
     * @return array imported properties
     */
    public function importNode(\DOMNode $element)
    {
        $reflection = new \ReflectionClass($this);
        $imported = [];

        /** @var \DOMNode $child */
        foreach ($element->childNodes as $child) {
            $nodeName = $child->nodeName;
            $value    = $child->nodeValue;

            if ('#comment' === $nodeName){
                continue;
            }
            if ('#text' === $nodeName){
                if (null == $this->nodeValueVar) {
                    continue;
                } else {
                    $nodeName = $this->nodeValueVar;
                }
            }

            $elementToArrayProperty = isset($this->elementToArray[$nodeName]) ? $this->elementToArray[$nodeName] : null;
            $propertyName = $elementToArrayProperty ?: $nodeName;
            $setter = 'set' . ucfirst($propertyName);
            $getter = 'get' . ucfirst($propertyName);
            $setterValue = $value;

            $namespace = $this->getNamespacePath();

            if (method_exists($this, $setter)) {
                $reflectionMethod = $reflection->getMethod($setter);
                $parameters = $reflectionMethod->getParameters();
                $phpDocs = $this->getMethodMetaData($reflectionMethod);

                if (1 <= count($parameters)) {
                    $firstParameter = $parameters[0];
                    if ($firstParameter->getClass() && $className = $firstParameter->getClass()->name) {
                        $setterValue = new $className($child, $this->getJarves());
                    }
                    $result = str_replace(array('[', ']'), '', $phpDocs['param']['type']);
                    $types = explode('|', $result);
                    $clazz = '';
                    if (1 === count($types)) {
                        $returnType = $types[0];

                        if (!class_exists($clazz = $namespace . $returnType)) {
                            if (!class_exists($clazz = $returnType)) {
                                if (!'string' == ($clazz = $returnType)) {
                                    $clazz = null;
                                }
                            }
                        }
                    }

                    $noClazz = !$clazz;
                    if ($firstParameter->isArray()){
                        if ($elementToArrayProperty) {
                            //for elements without plural parent: <route><req><req></route>
                            $setterValue = $this->$getter() ?: [];
                            if ($noClazz) {
                                $clazz = $namespace . ucfirst($nodeName);
                            }

                            if (class_exists($clazz)) {
                                $obj = new $clazz($child, $this->getJarves());
                                $setterValue[] = $obj;
                            } else {
                                if ($key = $child->attributes->getNamedItem('key')) {
                                    $setterValue[$key->nodeValue] = $value;
                                } else {
                                    $setterValue[] = $value;
                                }
                            }
                        } else {
                            $setterValue = array();
                            //for elements with plural parent: <route><reqs><req><req></reqs></route>
                            foreach ($child->childNodes as $subChild) {
                                if ('#' !== substr($subChild->nodeName, 0, 1)) {
                                    if ($noClazz) {
                                        $clazz = $namespace . ucfirst($subChild->nodeName);
                                    }
                                    if (class_exists($clazz)) {
                                        $object = new $clazz($subChild, $this->getJarves());
                                        $setterValue[] = $object;
                                    } else {
                                        if ($key = $subChild->attributes->getNamedItem('key')) {
                                            $setterValue[$key->nodeValue] = $subChild->nodeValue;
                                        } else {
                                            $setterValue[] = $subChild->nodeValue;
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        if (class_exists($clazz)) {
                            $setterValue = new $clazz($child, $this->getJarves());
                        }
                    }
                }
            }

            if (is_callable(array($this, $setter))) {
                $this->$setter($setterValue);
            } else if (!isset($this->$nodeName)) {
                $this->extractExtraNodes($child, $this->additionalNodes);
            }

            $imported[] = $propertyName;
        }

        foreach ($element->attributes as $attribute) {
            $nodeName = $attribute->nodeName;
            $value    = $attribute->nodeValue;

            $setter = 'set' . ucfirst($nodeName);
            if (is_callable(array($this, $setter))) {
                $this->$setter($value);
            } else if (!isset($this->$nodeName)) {
                $this->additionalAttributes[$nodeName] = $value;
            }

            $imported[] = $nodeName;
        }

        return $imported;
    }

    public function getNamespacePath()
    {
        return substr(get_called_class(), 0, strrpos(get_called_class(), '\\') + 1);
    }

    private function char2Camelcase($value, $char = '_')
    {
        $ex = explode($char, $value);
        $return = '';
        foreach ($ex as $str) {
            $return .= ucfirst($str);
        }
        return $return;
    }

    /**
     * @param \DOMNode $child
     * @param array    $options
     */
    public function extractExtraNodes(\DOMNode $child, array &$options)
    {
        $key = $child->attributes->getNamedItem('key');
        $key = $key ? $key->nodeValue : ('item' === $child->nodeName ? null : $child->nodeName);

        $valueText = null;
        $valueNodes = array();
        foreach ($child->childNodes as $element) {
            if ('#text' === $element->nodeName) {
                $valueText = $element->nodeValue;
            } else if ('#' !== substr($element->nodeName, 0, 1)) {
                $this->extractExtraNodes($element, $valueNodes);
            }
        }

        $value = 0 == count($valueNodes) ? $valueText : $valueNodes;

        if ($key) {
            $options[$key] = $value;
        } else {
            $options[] = $value;
        }
    }

    /**
     * <parameters>
     *    <parameter>first</parameter>
     *    <parameter>second</parameter>
     *    <parameter id="foo">bar</parameter>
     *    <parameter id="ho">sa</parameter>
     * </parameters>
     *
     * => array(
     *    0 => 'first',
     *    1 => 'second',
     *    'foo' => 'bar',
     *    'ho' => 'sa',
     * )
     *
     * @param string $element
     * @param string $childrenElement
     * @param string $keyName
     *
     * @return array
     */
    public function getParameterValues($element = 'parameters', $childrenElement = 'parameter', $keyName = 'id')
    {
        $values = array();
        $params = $this->getDirectChild($element);
        if ($params) {
            foreach ($params->childNodes as $param) {
                /** @var $param \DOMNode */
                if ($childrenElement === $param->nodeName) {
                    if ($id = $param->attributes->getNamedItem($keyName)->nodeValue) {
                        $values[$id] = $param->nodeValue;
                    } else {
                        $values[] = $param->nodeValue;
                    }
                }
            }
        }
        return $values;
    }

    /**
     * @param string $variableName
     */
    public function setVar($variableName)
    {
        $element = $this->getDirectChild($variableName);
        if ($element) {
            $setter = 'set' . ucfirst($variableName);
            $value = $element->nodeValue;

            if (method_exists($this, $setter)) {
                $this->$setter($value);
            }
        }
    }

    /**
     * @param string $variableName
     */
    public function setAttributeVar($variableName)
    {
        $element = $this->element->attributes->getNamedItem($variableName);
        if ($element) {
            $setter = 'set' . ucfirst($variableName);
            $value = $element->nodeValue;

            if (method_exists($this, $setter)) {
                $this->$setter($value);
            }
        }
    }

    /**
     * @param \DOMElement $element
     */
    public function setElement($element)
    {
        $this->element = $element;
    }

    /**
     * @return \DOMElement
     */
    public function getElement()
    {
        return $this->element;
    }

    /**
     * @param string $tag
     *
     * @return \DOMElement[]
     */
    public function getDirectChildren($tag)
    {
        $children = array();
        $root = $this->element->firstChild && $this->element->firstChild->nodeName == 'bundle'
            ? $this->element->firstChild
            : $this->element;

        foreach ($root->childNodes as $child) {
            if ($child->nodeName == $tag) {
                $children[] = $child;
            }
        }
        return $children;
    }

    /**
     * @param string $tag
     *
     * @return \DOMElement
     */
    public function getDirectChild($tag)
    {
        $root = $this->element->firstChild && $this->element->firstChild->nodeName == 'bundle'
            ? $this->element->firstChild
            : $this->element;

        if ($root->childNodes) {
            foreach ($root->childNodes as $child) {
                if ($child->nodeName == $tag) {
                    return $child;
                }
            }
        }
    }

    /**
     * @return string
     */
    public function __toString()
    {
        return $this->toXml();
    }

    /**
     * Generates a XML string with all current values.
     *
     * @param boolean $printDefaults
     *
     * @return string
     */
    public function toXml($printDefaults = false)
    {
        $doc = new \DOMDocument();
        $doc->formatOutput = true;

        $this->appendXml($doc, $printDefaults);

        return trim(str_replace("<?xml version=\"1.0\"?>\n", '', $doc->saveXML()));
    }

    /**
     * Saves the xml into a file.
     *
     * @param string  $path
     * @param boolean $withDefaults
     *
     * @return boolean
     * @throws FileNotWritableException
     */
    public function save($path, $withDefaults = false)
    {
        $string = $this->toXml($withDefaults);
        if ((!file_exists($path) && !is_writable(dirname($path))) || (file_exists($path) && !is_writable($path))) {
            throw new FileNotWritableException(sprintf('The file `%s` is not writable.', $path));
        }
        return false !== file_put_contents($path, $string);
    }

    /**
     * Appends the xml structure with our values.
     *
     * @param \DOMNode     $node
     * @param boolean      $printDefaults
     * @throws \Exception
     *
     * @return \DOMElement
     */
    public function appendXml(\DOMNode $node, $printDefaults = false)
    {
        $doc = $node instanceof \DOMDocument ? $node : $node->ownerDocument;

        if ($this->docBlock) {
            $comment = $doc->createComment($this->docBlock);
            $node->appendChild($comment);
        }

        try {
            $rootNode = $doc->createElement($this->rootName);
            $node->appendChild($rootNode);
        } catch (\DOMException $e ){
            throw new \Exception(sprintf('Can not create xml element `%s`', $this->rootName), 0, $e);
        }

        foreach ($this as $key => $val) {
            $this->appendXmlProperty($key, $rootNode, $printDefaults);
        }

        foreach ($this->additionalNodes as $k => $v) {
            $this->appendXmlValue($k, $v, $rootNode);
        }

        foreach ($this->additionalAttributes as $k => $v) {
            $rootNode->setAttribute($k, (string)$v);
        }

        return $rootNode;
    }

    /**
     * @param string   $key
     * @param \DOMNode $parentNode
     * @param bool     $printDefaults
     */
    public function appendXmlProperty($key, \DOMNode $parentNode, $printDefaults)
    {
        if (!$this->canPropertyBeExported($key)) return;

        if (!$this->_defaultProperties) {
            $reflection = new \ReflectionClass($this);
            $this->_defaultProperties = $reflection->getDefaultProperties();
        }

        if (!$this->_modelProperties) {
            $reflectionModel = new \ReflectionClass(__CLASS__);
            $this->_modelProperties = $reflectionModel->getDefaultProperties();
        }

        $getter = 'get' . ucfirst($key);
        if (!method_exists($this, $getter)) {
            return;
        }

        $method = new \ReflectionMethod($this, $getter);
        $parameters = $method->getParameters();
        if (isset($parameters[0]) && 'orCreate' === $parameters[0]->getName()) {
            $val = $this->$getter($printDefaults);
        } else {
            $val = $this->$getter();
        }

        if ($this->_defaultProperties[$key] == $val && (!$printDefaults || in_array($key, $this->excludeDefaults))) {
            return;
        }

        if (array_key_exists($key, $this->_modelProperties)) {
            return;
        }

        $setter = 'append' . ucfirst($key) . 'Xml';

        if (is_callable(array($this, $setter))) {
            return $this->$setter($parentNode, $printDefaults);
        } else {
            return $this->appendXmlValue($key, $val, $parentNode, null, $printDefaults);
        }
    }

    /**
     * Appends the xm structure with the given values.
     *
     * @param string       $key
     * @param mixed        $value
     * @param \DOMNode     $node
     * @param boolean      $arrayType
     * @param boolean      $printDefaults
     *
     * @return \DOMNode
     */
    public function appendXmlValue(
        $key,
        $value,
        \DOMNode $node,
        $arrayType = false,
        $printDefaults = false
    )
    {
        $doc = $node instanceof \DOMDocument ? $node : $node->ownerDocument;

        $append = function($el) use ($node){
            return $node->appendChild($el);
        };

        if (null === $value || (is_scalar($value) && !in_array($key, $this->attributes)) || is_array($value) || $value instanceof Model) {
            if (isset($this->docBlocks[$key]) && $comment = $this->docBlocks[$key]) {
                $comment = $doc->createComment($comment);
                $append($comment);
            }
        }

        if (null !== $this->nodeValueVar && $key == $this->nodeValueVar){
            $textNode = $doc->createTextNode($value);
            $result = $append($textNode);
        } else if (is_scalar($value) || null === $value) {
            $value = is_bool($value) ? $value?'true':'false' : (string)$value;
            if ($arrayType) {
                $element = $doc->createElement(@$this->arrayIndexNames[$arrayType] ?: 'item');
                if (!is_integer($key)) {
                    $element->setAttribute('key', (string)$key);
                }
                $element->nodeValue = $value;
                $result = $append($element);
            } else {
                if (in_array($key, $this->attributes)) {
                    $result = $node->setAttribute($key, $value);
                } else {
                    $element = $doc->createElement(is_integer($key) ? ($this->arrayIndexNames[$arrayType] ?: 'item') : $key);
                    $element->nodeValue = $value;
                    $result = $append($element);
                }
            }
        } else if (is_array($value)) {
            if ($arrayName = $this->getElementArrayName($key)) {
                $element = $node;
            } else {
                $element = $doc->createElement(is_integer($key) ? ($this->arrayIndexNames[$arrayType] ?: 'item') : $key);
            }
            foreach ($value as $k => $v) {
                $this->appendXmlValue($k, $v, $element, $key, $printDefaults);
            }
            if (!$arrayName) {
                $result = $append($element);
            } else {
                $result = $element;
            }
        } else if ($value instanceof Model) {
            $result = $value->appendXml($node, $printDefaults);
        }

        return $result;
    }

    public function getElementArrayName($property) {
        foreach ($this->elementToArray as $elementName => $propertyName) {
            if ($propertyName == $property) {
                return $elementName;
            }
        }
    }

    /**
     * @param bool $printDefaults
     *
     * @return array
     */
    public function toArray($printDefaults = false)
    {
        $result = array();

        $reflection = new \ReflectionClass($this);
        $blacklist = array('config', 'element', 'jarves');

        foreach ($reflection->getProperties() as $property) {
            $k = $property->getName();
            if ($property->isPrivate()) continue;
            if (in_array($k, $blacklist)) {
                continue;
            }

            $value = $this->propertyToArray($k, $printDefaults);
            if (null === $value){
                continue;
            }

            $result[$k] = $value;
        }

        return $result;
    }

    /**
     * @param $k             name of the property
     * @param $printDefaults
     * @return mixed
     */
    public function propertyToArray($k, $printDefaults = false)
    {
        if (!$this->canPropertyBeExported($k)) return;

        $reflection = new \ReflectionClass($this);

        $properties = $reflection->getDefaultProperties();

        $getter = 'get' . ucfirst($k) . 'Array';
        if (!method_exists($this, $getter) || !is_callable(array($this, $getter))) {
            $getter = 'get' . ucfirst($k);
            if (!method_exists($this, $getter) || !is_callable(array($this, $getter))) {
                return null;
            }
        }
        $value = $this->$getter();

        if (!$printDefaults && $value === $properties[$k]) {
            return null;
        }

        if (is_array($value)) {
            $result = [];
            foreach ($value as $key => $item) {
                if (is_object($item)) {
                    if ($item instanceof Model) {
                        $result[$item->getArrayKey() ? $item->getArrayKeyValue() : $key] = $item->toArray($printDefaults);
                    } else {
                        $result[$key] = (array)$item;
                    }
                } else {
                    $result[$key] = $item;
                }
            }
            return $result;
        } else if (is_object($value) && $value instanceof Model){
            $value = $value->toArray($printDefaults);
        }

        return $value;
    }

    public function canPropertyBeExported($key)
    {
        return !in_array($key, $this->_excludeFromExport);
    }

    public function getArrayKey()
    {
        return $this->arrayKey;
    }

    public function getArrayKeyValue()
    {
        if (!$this->arrayKey) return;
        $getter = 'get' . ucfirst($this->arrayKey);
        return $this->$getter();
    }

    public function setArrayKeyValue($value)
    {
        if (!$this->arrayKey) return;
        $setter = 'set' . ucfirst($this->arrayKey);
        $this->$setter($value);
    }


    /**
     * @param mixed  $values
     * @param string $arrayKeyValue
     */
    public function fromArray($values, $arrayKeyValue = null)
    {

        if ($this->arrayKey && null !== $arrayKeyValue) {
            $this->setArrayKeyValue($arrayKeyValue);
        }

        if (!is_array($values)) {
            if (null !== $this->nodeValueVar) {
                $setter = 'set' . ucfirst($this->nodeValueVar);
                if (method_exists($this, $setter)) {
                    $this->$setter($values);
                }
            }
        } else {
            foreach ($values as $key => $value) {
                $this->propertyFromArray($key, $value);
            }
        }
    }

    /**
     * @param string $key
     * @param mixed $value
     */
    public function propertyFromArray($key, $value)
    {
        $reflection = new \ReflectionClass($this);

        $setter = 'set' . ucfirst($key);
        $getter = 'get' . ucfirst($key);
        $setterValue = $value;
        $namespace = $this->getNamespacePath();

        if (method_exists($this, $setter)) {
            $reflectionMethod = $reflection->getMethod($setter);
            $reflectionMethodGet = $reflection->getMethod($getter);
            $parameters = $reflectionMethod->getParameters();
            $phpDocs = $this->getMethodMetaData($reflectionMethodGet);
            if (1 <= count($parameters)) {
                $firstParameter = $parameters[0];
                if ($firstParameter->getClass() && $className = $firstParameter->getClass()->name) {
                    $setterValue = new $className(null, $this->getJarves());
                    $setterValue->fromArray($value, $key);
                }
                if ($firstParameter->isArray() && is_array($value)){
                    $setterValue = array();

                    $result = str_replace(array('[', ']'), '', $phpDocs['return']['type']);
                    $returnType = explode('|', $result)[0];

                    if (!class_exists($clazz = $returnType)) {
                        if (!class_exists($clazz = $namespace . $returnType)) {
                            if (!class_exists($clazz = $namespace . $key)) {
                                $clazz = null;
                            }
                        }
                    }

                    if (is_array($value)) {
                        foreach ($value as $subKey => $subValue) {
                            if ($clazz) {
                                $object = new $clazz(null, $this->getJarves());
                                $object->fromArray($subValue, $subKey);
                                $setterValue[] = $object;
                            } else {
                                $setterValue[] = $subValue;
                            }
                        }
                    }
                }
            }
        }

        if (is_callable(array($this, $setter))) {
            $this->$setter($setterValue);
        }
    }

    public function getMethodMetaData(\ReflectionMethod $method)
    {
        $file = $method->getFileName();
        $startLine = $method->getStartLine();

        $fh = fopen($file, 'r');
        if (!$fh) return false;

        $lineNr = 1;
        $lines = array();
        while (($buffer = fgets($fh)) !== false) {
            if ($lineNr == $startLine) break;
            $lines[$lineNr] = $buffer;
            $lineNr++;
        }
        fclose($fh);

        $phpDoc = '';
        $blockStarted = false;
        while ($line = array_pop($lines)) {

            if ($blockStarted) {
                $phpDoc = $line.$phpDoc;

                //if start comment block: /*
                if (preg_match('/\s*\t*\/\*/', $line)) {
                    break;
                }
                continue;
            } else {
                //we are not in a comment block.
                //if class def, array def or close bracked from fn comes above
                //then we dont have phpdoc
                if (preg_match('/^\s*\t*[a-zA-Z_&\s]*(\$|{|})/', $line)) {
                    break;
                }
            }

            $trimmed = trim($line);
            if ($trimmed == '') continue;

            //if end comment block: */
            if (preg_match('/\*\//', $line)) {
                $phpDoc = $line.$phpDoc;
                $blockStarted = true;
                //one line php doc?
                if (preg_match('/\s*\t*\/\*/', $line)) {
                    break;
                }
            }
        }

        return $this->parsePhpDoc($phpDoc);
    }

    /**
     * Parse phpDoc string and returns an array.
     *
     * @param  string $string
     * @return array
     */
    public function parsePhpDoc($string)
    {
        preg_match('#^/\*\*(.*)\*/#s', trim($string), $comment);

        $comment = trim($comment[1]);

        preg_match_all('/^\s*\*(.*)/m', $comment, $lines);
        $lines = $lines[1];

        $tags = array();
        $currentTag = '';
        $currentData = '';

        foreach ($lines as $line) {
            $line = trim($line);

            if (substr($line, 0, 1) == '@') {

                if ($currentTag)
                    $tags[$currentTag][] = $currentData;
                else
                    $tags['description'] = $currentData;

                $currentData = '';
                preg_match('/@([a-zA-Z_]*)/', $line, $match);
                $currentTag = $match[1];
            }

            $currentData = trim($currentData.' '.$line);

        }
        if ($currentTag)
            $tags[$currentTag][] = $currentData;
        else
            $tags['description'] = $currentData;

        //parse tags
        $regex = array(
            'param' => array('/^@param\s*\t*([a-zA-Z_\\\[\]|]*)\s*\t*\$([a-zA-Z_]*)\s*\t*(.*)/', array('type', 'name', 'description')),
            'return' => array('/^@return\s*\t*([a-zA-Z_\\\[\]|]*)\s*\t*(.*)/', array('type', 'description')),
        );
        foreach ($tags as $tag => &$data) {
            if ($tag == 'description') continue;
            foreach ($data as &$item) {
                if ($regex[$tag]) {
                    preg_match($regex[$tag][0], $item, $match);
                    $item = array();
                    $c = count($match);
                    for ($i =1; $i < $c; $i++) {
                        if ($regex[$tag][1][$i-1]) {
                            $item[$regex[$tag][1][$i-1]] = $match[$i];

                        }
                    }
                }
            }
            if (count($data) == 1)
                $data = $data[0];

        }

        return $tags;
    }

    /**
     * @param mixed $offset
     * @param mixed $value
     */
    public function offsetSet($offset, $value)
    {
        if (null !== $offset) {
            $setter = 'set' . ucfirst($offset);
            if (is_array($value) && is_array(current($value))) {
                if (is_callable(array($this, $setter . 'Array'))) {
                    $setter .= 'Array';
                }
            }
            $this->$setter($value);
        }
    }

    /**
     * @param mixed $offset
     *
     * @return bool
     */
    public function offsetExists($offset)
    {
        $setter = 'get' . ucfirst($offset);
        return is_callable(array($this, $setter)) || is_callable(array($this, $setter . 'Array'));
    }

    /**
     * @param mixed $offset
     */
    public function offsetUnset($offset)
    {
        $this->offsetSet($offset, null);
    }

    /**
     * @param mixed $offset
     *
     * @return mixed
     */
    public function offsetGet($offset)
    {
        if (null !== $offset) {
            $getter = 'get' . ucfirst($offset);
            if (is_callable(array($this, $getter . 'Array'))) {
                $getter .= 'Array';
            }
            if (is_callable(array($this, $getter))) {
                return $this->$getter();
            }
        }
    }

    public function __sleep()
    {
        $vars = [];

        $reflection = new \ReflectionClass($this);
        $properties = $reflection->getDefaultProperties();
        $static = array_keys($reflection->getStaticProperties());
        $blacklist = ['element', 'jarves'];

        foreach ($properties as $property => $val) {
            if ($reflection->getProperty($property) && $reflection->getProperty($property)->isPrivate()) continue;
            if (in_array($property, $static)) continue;
            if (!in_array($property, $blacklist)){
                $vars[] = $property;
            }
        }

        return $vars;
    }

//    public function __clone()
//    {
//        $properties = $this->__sleep();
//        foreach ($properties as $property) {
//            if (is_array($this->$property)) {
//                foreach ($this->$property as &$value) {
//                    if (is_object($value)) {
//                        $value = clone $value;
//                    }
//                }
//            } else if (is_object($this->$property)) {
//                $this->$property = clone $this->$property;
//            }
//        }
//    }

    public function __wakeup()
    {
        $this->jarves = Model::$serialisationJarvesCore;
    }
}