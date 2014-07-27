<?php

namespace Jarves\Configuration;

use Jarves\Tools;


/**
 * Class Asset
 *
 * Paths are relative to `
 *
 * @bundlePath/Resources/public`.
 */
class  Condition extends Model
{
    /**
     * @var array
     */
    protected $rules = [];

    protected $tableName;

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
                    $node->getAttribute('type') ? : '=',
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
     * @param array $condition
     * @param string $objectKey
     */
    public function fromPk($condition, $objectKey)
    {
        $this->rules = $this->primaryKeyToCondition($condition, $objectKey);
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

    private function normalizeToArray($condition)
    {
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
     * @param array $params
     * @param string $objectKey
     * @param array $usedFieldNames
     *
     * @return string
     */
    public function toSql(&$params, $objectKey, &$usedFieldNames = array())
    {
        if (!$this->rules) {
            return '';
        }
        $condition = $this->rules;

//        $tableName = null;
//        $def = null;
//
//        if ($objectKey) {
//            $def = $this->getJarves()->getObjects()->getDefinition($objectKey);
//            if ($def) {
//                $tableName = $this->getJarves()->getSystemConfig()->getDatabase()->getPrefix() . $def->getTable();
//            }
//        }
//
//        if (!$tableName) {
//            $tableName = $objectKey;
//        }

        if (is_array($condition) && !is_numeric(key($condition))) {
            //array( 'bla' => 'hui' );
            return static::create($this->primaryKeyToCondition($condition, $objectKey), $this->getJarves())->toSql(
                $params,
                $objectKey,
                $usedFieldNames
            );
        }

        if ($condition[0] && is_array($condition[0]) && !is_numeric(key($condition[0]))) {
            //array( array('bla' => 'bla', ... );
            return static::create($this->primaryKeyToCondition($condition, $objectKey), $this->getJarves())->toSql(
                $params,
                $objectKey,
                $usedFieldNames
            );
        }

        if (!is_array($condition[0]) && !$condition[0] instanceof Condition) {
            //array( 1, 2, 3 );
            return static::create($this->primaryKeyToCondition($condition, $objectKey), $this->getJarves())->toSql(
                $params,
                $objectKey,
                $usedFieldNames
            );
        }

        return $this->conditionToSql($condition, $params, $objectKey, $pFieldNames);
    }

    /**
     * @param array  $conditions
     * @param array  $params
     * @param string $objectName
     * @param array  $usedFieldNames
     * @return string
     */
    public function conditionToSql($conditions, &$params, $objectName, &$usedFieldNames)
    {
        $result = '';
        if (is_array($conditions)) {
            foreach ($conditions as $condition) {

                if (is_array($condition) && is_string($condition[0]) && is_string($condition[1])) {
                    $result .= $this->singleConditionToSql($condition, $params, $objectName, $usedFieldNames);
                } elseif (is_string($condition)) {
                    $result .= ' ' . $condition . ' ';
                } elseif ($condition instanceof Condition) {
                    $result .= ' ' . $condition->toSql($params, $objectName, $usedFieldNames) . ' ';
                } elseif (is_array($condition)) {
                    $result .= ' (' . $this->conditionToSql($condition, $params, $objectName, $usedFieldNames) . ')';
                }

            }
        }

        return $result;
    }

    /**
     * @param array  $condition
     * @param array  $params
     * @param string $objectKey
     * @param array  $usedFieldNames
     * @return string
     */
    public function singleConditionToSql($condition, &$params, $objectKey, &$usedFieldNames = null)
    {
        if ($condition[0] === null) {
            return '';
        }

        $tableName = $this->tableName;
        $def = null;

        if (!$tableName && $objectKey) {
            $def = $this->getJarves()->getObjects()->getDefinition($objectKey);
            if ($def) {
                $tableName = $this->getJarves()->getSystemConfig()->getDatabase()->getPrefix() . $def->getTable();
            }
        }

        $columnName = $fieldName = $condition[0];
        if (false !== ($pos = strpos($fieldName, '.'))) {
            $tableName = substr($fieldName, 0, $pos);
            $columnName = $fieldName = substr($fieldName, $pos + 1);
        }

        if ($def) {
            $field = $def->getField($fieldName);
            if ($field) {
                $columns = $field->getFieldType()->getColumns();
                $columnName = Tools::camelcase2Underscore($columns[0]->getName());
            }
        } else {
            $columnName = Tools::camelcase2Underscore($fieldName);
        }

        if (!is_numeric($condition[0])) {
            $result = ($tableName ? Tools::dbQuote($tableName) . '.' : '') . Tools::dbQuote($columnName) . ' ';
            if ($usedFieldNames !== null) {
                $usedFieldNames[] = $condition[0];
            }
        } else {
            $result = $condition[0];
        }

        if (strtolower($condition[1]) == 'regexp') {
            $result .= strtolower($this->getJarves()->getSystemConfig()->getDatabase()->getMainConnection()->getType()) == 'mysql' ? 'REGEXP' : '~';
        } else {
            $result .= $condition[1];
        }

        if (!is_numeric($condition[0])) {
            if (isset($condition[2]) && $condition[2] !== null) {
                if ($condition[2] instanceof ConditionSubSelect) {
                    $result .= ' (' . $condition[2]->toSql($params, $objectKey, $usedFieldNames). ') ';
                } else {
                    $params[':p' . (count($params) + 1)] = $condition[2];
                    $p = ':p' . count($params);
                    if (strtolower($condition[1]) == 'in' || strtolower($condition[1]) == 'not in') {
                        $result .= " ($p)";
                    } else {
                        $result .= ' ' . $p;
                    }
                }
            }
        } else {
            $result .= ' ' . ($condition[0] + 0);
        }

        return $result;
    }

    /**
     * @return array
     */
    public function extractFields()
    {
        $fields = array();
        $params = array();

        $this->toSql($params, null, $fields);

        return array_keys($fields);
    }

    /**
     * @param array  $condition
     * @param string $objectKey
     * @param string $pTable
     * @return array
     */
    public function primaryKeyToCondition($condition, $objectKey = null, $pTable = '')
    {
        $result = array();

        // condition:
        // [
        //   ["bla", "=", 1], "and"
        //
        // ]
        //
        // pk:
        //  1
        //
        // pk:
        // ["bla" => 2, "hosa" => 1]
        //
        // pk:
        // [ ["bla" => 1], ["bla" => 2] ]

        if ($condition instanceof Condition) {
            return $condition->getRules();
        }

        if (is_array($condition) && array_key_exists(0, $condition) && is_array($condition[0]) && is_numeric(
                key($condition)
            ) && is_numeric(key($condition[0]))
        ) {
            //its already a condition object
            return $condition;
        }

        if ($objectKey && $this->getJarves()->getObjects()->getDefinition($objectKey)) {
            $primaries = $this->getJarves()->getObjects()->getPrimaryList($objectKey);
        }

        if (array_key_exists(0, $condition)) {
            foreach ($condition as $idx => $group) {
                $cGroup = array();

                if (is_array($group)) {

                    foreach ($group as $primKey => $primValue) {

                        if (!is_string($primKey)) {
                            $primKey = $primaries[$primKey];
                        }

                        if ($cGroup) {
                            $cGroup[] = 'and';
                        }
                        $cGroup[] = array($primKey, '=', $primValue);
                    }
                } else {

                    $primKey = $idx;
                    if (!is_string($idx)) {
                        $primKey = $primaries[0];
                    }

                    if ($cGroup) {
                        $cGroup[] = 'and';
                    }
                    $cGroup[] = array($primKey, '=', $group);
                }
                if ($result) {
                    $result[] = 'or';
                }
                $result[] = $cGroup;
            }

        } else {
            //we only have to select one row
            $group = array();

            foreach ($condition as $primKey => $primValue) {
                if ($group) {
                    $group[] = 'and';
                }
                $group[] = array($primKey, '=', $primValue);
            }
            $result[] = $group;
        }

        return $result;

    }

    /**
     * @param mixed $condition
     *
     * @return Condition
     */
    public static function create($condition = null, \Jarves\Jarves $jarves = null)
    {
        $obj = new static(null, $jarves);
        $obj->from($condition);
        return $obj;
    }

    public function hasRules()
    {
        return !!$this->rules;
    }

    public function satisfy(&$objectItem, $objectKey = null)
    {
        $complied = null;
        $lastOperator = 'and';

        $conditions = $this->getRules();

        if (!$conditions) {
            return null;
        }

        /*
         * [
         *   ['id', '=', 5],
         *   'or',
         *   ['id', '=', 6]
         * ]
         *
         * [
         *   Condition,
         *   'and',
         *   [Condition]
         * ]
         *
         *
         */

        foreach ($conditions as $condition) {
            if (is_string($condition)) {
                $lastOperator = strtolower($condition);
                continue;
            }

            if (is_array($condition) && is_string($condition[0]) && is_string($condition[1])){
                $res = $this->checkRule($objectItem, $condition, $objectKey);
            } else if ($condition instanceof Condition){
                $res = $condition->satisfy($objectItem, $objectKey);
            } else if (is_array($condition)) {
                //group
                $res = static::create($condition, $this->getJarves())
                    ->satisfy($objectItem, $objectKey);
            }

            if (is_null($complied)) {
                $complied = $res;
            } else {
                if ($lastOperator == 'and') {
                    $complied = $complied && $res;
                }

                if ($lastOperator == 'and not') {
                    $complied = $complied && !$res;
                }

                if ($lastOperator == 'or') {
                    $complied = $complied || $res;
                }
            }
        }

        return $complied === null ? true : ($complied ? true : false);
    }

    public function checkRule(&$objectItem, $condition, $objectKey = null)
    {
        $field = $condition[0];
        $operator = $condition[1];
        $value = $condition[2];

        if (is_numeric($field)) {
            $ovalue = $field;
        } else {
            $ovalue = @$objectItem[$field];
            if (null === $ovalue && $objectKey && $definition = $this->getJarves()->getObjects()->getDefinition($objectKey)) {
                $tableName = substr($field, 0, strpos($field, '.'));
                $fieldName = substr($field, strpos($field, '.') + 1);
                if ($tableName === $this->getJarves()->getSystemConfig()->getDatabase()->getPrefix().$definition->getTable()) {
                    $ovalue = $objectItem[$fieldName];
                }
            }
        }

        if ($value instanceof ConditionSubSelect) {
            $value = $value->getValue($objectKey);
        }

        //'<', '>', '<=', '>=', '=', 'LIKE', 'IN', 'REGEXP'
        switch (strtoupper($operator)) {
            case '!=':
            case 'NOT EQUAL':
                return ($ovalue != $value);

            case 'LIKE':
                $value = preg_quote($value, '/');
                $value = str_replace('%', '.*', $value);
                $value = str_replace('_', '.', $value);
                return !!preg_match('/^' . $value . '$/', $ovalue);

            case 'REGEXP':
                return !!preg_match('/' . preg_quote($value, '/') . '/', $ovalue);

            case 'NOT IN':
                return strpos(',' . $value . ',', ',' . $ovalue . ',') === false;

            case 'IN':
                return strpos(',' . $value . ',', ',' . $ovalue . ',') !== false;

            case '<':
            case 'LESS':
                return ($ovalue < $value);

            case '>':
            case 'GREATER':
                return ($ovalue > $value);

            case '<=':
            case '=<':
            case 'LESSEQUAL':
                return ($ovalue <= $value);

            case '>=':
            case '=>':
            case 'GREATEREQUAL':
                return ($ovalue >= $value);

            case '= CURRENT_USER':
            case 'EQUAL CURRENT_USER':
                return $this->getJarves()->getClient()
                && $ovalue == $this->getJarves()->getClient()->getUserId();

            case '!= CURRENT_USER':
            case 'NOT EQUAL CURRENT_USER':
                return $this->getJarves()->getClient()
                && $ovalue != $this->getJarves()->getClient()->getUserId();

            case '=':
            case 'EQUAL':
            default:
                return ($ovalue == $value);
        }
    }

    /**
     * Appends the xml structure with our values.
     *
     * @param \DOMNode $node
     * @param boolean $printDefaults
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

        $ruleToArray = function($rule) use (&$ruleToArray) {
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