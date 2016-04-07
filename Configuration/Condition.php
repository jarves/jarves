<?php

namespace Jarves\Configuration;

use Jarves\Jarves;

class Condition extends Model
{
    /**
     * @var array
     */
    protected $rules = [];

    /**
     * @var string
     */
    protected $tableName;

    /**
     * @var bool
     */
    protected $tableNameSet = false;

    /**
     * @param array|Condition $condition
     */
    public function from($condition)
    {
        $this->rules = $this->normalizeToArray($condition);
    }

    public function fromArray($values, $key = null)
    {
        $this->rules = $values;
    }

    public function importNode(\DOMNode $element)
    {
        $this->rules = $this->extractNode($element);
    }

    public function extractNode(\DOMNode $element)
    {
        $value = [];

        foreach ($element->childNodes as $node) {
            if (!isset($node->tagName)) continue;
            if ('rule' === $node->tagName) {
                $value[] = array(
                    $node->getAttribute('key'),
                    $node->getAttribute('type') ?: '=',
                    $node->nodeValue
                );
            } else if ('group' === $node->tagName) {
                $value[] = $this->extractNode($node);
            } else if ($node->tagName) {
                $value[] = $node->tagName;
            }
        }

        return $value;
    }

    /**
     * @return mixed
     */
    public function getTableName()
    {
        return $this->tableName;
    }

    /**
     * @param mixed $tableName
     */
    public function setTableName($tableName)
    {
        $this->tableNameSet = true;
        $this->tableName = $tableName;
    }

    /**
     * @return boolean
     */
    public function isTableNameSet()
    {
        return $this->tableNameSet;
    }

    /**
     * @param boolean $tableNameSet
     */
    public function setTableNameSet($tableNameSet)
    {
        $this->tableNameSet = $tableNameSet;
    }

    /**
     * @param array|Condition $condition
     */
    public function addAnd($condition = null)
    {
        $this->add('AND', $condition);
    }

    /**
     * @param array|Condition $condition
     */
    public function addOr($condition = null)
    {
        $this->add('OR', $condition);
    }

    /**
     * @param $join
     * @param array|Condition $condition
     */
    public function add($join, $condition = null)
    {
        if ($join && 0 < count($this->rules)) {
            $this->rules[] = $join;
        }
        if (null !== $condition) {
            $this->rules[] = $condition;
        }
    }

    /**
     * @param array|Condition $condition
     */
    public function mergeAnd($condition)
    {
        $this->merge('AND', $condition);
    }

    /**
     * @param array|Condition $condition
     */
    public function mergeOr($condition)
    {
        $this->merge('OR', $condition);
    }

    /**
     * @param string $join
     * @param array|Condition $condition
     */
    public function merge($join, $condition)
    {
        if (!$condition || ($condition instanceof Condition && !$condition->hasRules())) {
            return;
        }
        if (0 < count($this->rules)) {
            $this->rules = array($this->rules, $join, $this->normalizeToArray($condition));
        } else {
            $this->rules = $this->normalizeToArray($condition);
        }
    }

    /**
     * @param string $join
     * @param array|Condition $condition
     */
    public function mergeBegin($join, $condition)
    {
        if (0 < count($this->rules)) {
            $this->rules = array($this->normalizeToArray($condition), $join, $this->rules);
        } else {
            $this->rules = $this->normalizeToArray($condition);
        }
    }

    /**
     * @param Condition|array $condition
     *
     * @return array
     */
    private function normalizeToArray($condition)
    {
        if (!$condition) {
            return [];
        }

        if ($condition instanceof Condition) {
            return $condition->getRules();
        } else {
            if (!is_array($condition[0]) && !($condition[0] instanceof Condition)) {
                $condition = [$condition];
            }
            return $condition;
        }
    }

    /**
     * @param array|Condition $condition
     */
    public function mergeAndBegin($condition)
    {
        $this->mergeBegin('AND', $condition);
    }

    /**
     * @param array|Condition $condition
     */
    public function mergeOrBegin($condition)
    {
        $this->mergeBegin('OR', $condition);
    }

    /**
     * @param mixed $condition
     * @param Jarves $jarves
     *
     * @return Condition
     */
    public static function create($condition = null, Jarves $jarves = null)
    {
        $obj = new static(null, $jarves);
        $obj->from($condition);
        return $obj;
    }

    public function hasRules()
    {
        return !!$this->rules;
    }

    /**
     * Appends the xml structure with our values.
     *
     * @param \DOMNode $node
     * @param boolean $printDefaults
     *
     * @return \DOMElement|void
     *
     * @throws \Exception
     */
    public function appendXml(\DOMNode $node, $printDefaults = false)
    {
        $doc = $node->ownerDocument;
        if ($this->rules) {
            $condition = $doc->createElement('condition');
            foreach ($this->rules as $rule) {
                $this->appendXmlValue(null, $rule, $condition, $doc);
            }
            $node->appendChild($condition);
        }
    }

    /**
     * Appends the xm structure with the given values.
     *
     * @param string $key
     * @param mixed $value
     * @param \DOMNode $node
     * @param boolean $arrayType
     * @param boolean $printDefaults
     *
     * @return \DOMNode|void
     */
    public function appendXmlValue(
        $key,
        $value,
        \DOMNode $node,
        $arrayType = false,
        $printDefaults = false
    )
    {
        $doc = $node->ownerDocument;
        if (is_array($value)) {
            if (is_array($value[0])) {
                //we have a group
                $group = $doc->createElement('group');
                $node->appendChild($group);
                foreach ($value as $rule) {
                    $this->appendXmlValue(null, $rule, $group, $doc);
                }
            } else {
                //we have a rule
                $rule = $doc->createElement('rule');
                $node->appendChild($rule);
                $rule->setAttribute('key', $value[0]);
                $rule->setAttribute('type', $this->getType($value[1]));
                $rule->nodeValue = $value[2];
            }
        } else if (is_string($value)) {
            //we have 'and' or 'or'.
            $andOr = $doc->createElement($value);
            $node->appendChild($andOr);
        }
    }

    /**
     * @param string $type
     * @return string
     */
    public function getType($type)
    {
        switch (strtoupper($type)) {
            case '!=':
                return 'not equal';
            case '=':
                return 'equal';
            case '>':
                return 'greater';
            case '<':
                return 'less';

            case '=<':
            case '<=':
                return 'lessEqual';

            case '=>':
            case '>=':
                return 'greaterEqual';

            case '= CURRENT_USER':
                return 'equal CURRENT_USER';
            case '!= CURRENT_USER':
                return 'not equal CURRENT_USER';
        }

        return $type;
    }

    /**
     * @param bool $printDefaults
     *
     * @return array
     */
    public function toArray($printDefaults = false)
    {
        $result = [];

        $ruleToArray = function ($rule) use (&$ruleToArray) {
            if (is_array($rule)) {
                $result = [];
                foreach ($rule as $v) {
                    $result[] = $ruleToArray($v);
                }
                return $result;
            } else if ($rule instanceof Condition) {
                return $rule->toArray();
            } else {
                return $rule;
            }
        };

        if ($this->rules) {
            return $ruleToArray($this->rules);
        }
        return $result;
    }

    /**
     * @return array
     */
    public function getRules()
    {
        return $this->rules;
    }

    /**
     * @param array $rules
     */
    public function setRules($rules)
    {
        $this->rules = $rules;
    }
}