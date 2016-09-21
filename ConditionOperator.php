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

namespace Jarves;

use Jarves\Configuration\Condition;
use Jarves\Configuration\ConditionSubSelect;

class ConditionOperator
{
    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @var JarvesConfig
     */
    protected $jarvesConfig;

    /**
     * @var Objects
     */
    protected $objects;

    /**
     * @var PageStack
     */
    protected $pageStack;

    /**
     * ConditionOperator constructor.
     * @param Jarves $jarves
     * @param JarvesConfig $jarvesConfig
     * @param Objects $objects
     * @param PageStack $pageStack
     */
    public function __construct(Jarves $jarves, JarvesConfig $jarvesConfig, Objects $objects, PageStack $pageStack)
    {
        $this->jarves = $jarves;
        $this->jarvesConfig = $jarvesConfig;
        $this->objects = $objects;
        $this->pageStack = $pageStack;
    }

    /**
     * @param Condition $condition
     * @param array $pk
     * @param string $objectKey
     */
    public function applyRulesFromPk(Condition $condition, array $pk, $objectKey)
    {
        $condition->setRules($this->primaryKeyToCondition($pk, $objectKey));
    }

    /**
     * @param Condition $condition
     * @param array $params
     * @param string $objectKey
     * @param array $usedFieldNames
     *
     * @return string
     */
    public function standardConditionToSql(Condition $condition, &$params, $objectKey, array &$usedFieldNames = null)
    {
        if (!$condition->getRules()) {
            return '';
        }

        $rules = $condition->getRules();

//        $tableName = null;
//        $def = null;
//
//        if ($objectKey) {
//            $def = $this->getJarves()->getObjects()->getDefinition($objectKey);
//            if ($def) {
//                $tableName = $def->getTable();
//            }
//        }
//
//        if (!$tableName) {
//            $tableName = $objectKey;
//        }

        if (is_array($rules) && !is_numeric(key($rules))) {
            //array( 'bla' => 'hui' );
            return $this->standardConditionToSql(
                Condition::create($this->primaryKeyToCondition($rules, $objectKey), $this->jarves),
                $params,
                $objectKey,
                $usedFieldNames
            );
        }

        if (isset($rules[0]) && is_array($rules[0]) && !is_numeric(key($rules[0]))) {
            //array( array('bla' => 'bla', ... );
            return $this->standardConditionToSql(
                Condition::create($this->primaryKeyToCondition($rules, $objectKey), $this->jarves),
                $params,
                $objectKey,
                $usedFieldNames
            );
        }

        if (!is_array($rules[0]) && !$rules[0] instanceof Condition) {
            //array( 1, 2, 3 );
            return $this->standardConditionToSql(
                Condition::create($this->primaryKeyToCondition($rules, $objectKey), $this->jarves),
                $params,
                $objectKey,
                $usedFieldNames
            );
        }

        return $this->conditionToSql($condition, $rules, $params, $objectKey, $usedFieldNames);
    }

    /**
     * @param ConditionSubSelect $condition
     * @param array  $params
     * @param string $objectKey
     * @param array|null $usedFieldNames
     * @return string
     */
    protected function subSelectConditionToSql(ConditionSubSelect $condition, &$params, $objectKey, array &$usedFieldNames = null)
    {
        $tableName = $condition->getTableNameSelect();
        if ($objectKey) {
            $def = $this->objects->getDefinition($objectKey);
            if ($def) {
                $tableName = $def->getTable();
            }
        }

        if ($condition->isTableNameSet()) {
            $tableName = $condition->getTableName();
        }

        $selected = [];
        foreach ($condition->getSelect() as $select) {
            if (false === strpos($select, '.')) {
                $select = $tableName . '.' . $select;
            }

            if (null !== $usedFieldNames) {
                $usedFieldNames[] = $select;
            }

            $selected[] = $select;
        }
        $selected = implode(', ', $selected);

        $joins = '';

        if ($condition->getJoins()) {
            $joins .= implode("\n", $condition->getJoins());
        }

        if ($condition->getSelfJoins()) {
            foreach ($condition->getSelfJoins() as $alias => $on) {
                $joins .= sprintf('JOIN %s as %s ON (%s)',
                    $tableName,
                    $alias,
                    str_replace('%table%', $tableName, $on)
                );
            }
        }

        $sql = sprintf('SELECT %s FROM %s %s',
            $selected,
            $tableName ? : $objectKey,
            $joins
        );

        if ($w = $this->standardConditionToSql($condition, $params, $objectKey, $usedFieldNames)) {
            $sql .= sprintf(' WHERE %s', $w);
        }

        if ($order = $condition->getOrder()) {
            $sql .= sprintf(' ORDER BY %s %s', $order[0], $order[1]);
        }

        return $sql;
    }


    /**
     * @param Condition $condition
     * @param array $rules
     * @param array $params
     * @param string $objectName
     * @param array $usedFieldNames
     * @return string
     */
    public function conditionToSql(Condition $condition, $rules, &$params, $objectName, &$usedFieldNames)
    {
        $result = '';

        if (is_array($rules)) {
            foreach ($rules as $conditionRule) {

                if (is_array($conditionRule) && is_string($conditionRule[0]) && is_string($conditionRule[1])) {
                    $result .= $this->singleConditionToSql($condition, $conditionRule, $params, $objectName, $usedFieldNames);
                } elseif (is_string($conditionRule)) {
                    $result .= ' ' . $conditionRule . ' ';
                } elseif ($conditionRule instanceof ConditionSubSelect) {
                    $result .= ' ' . $this->subSelectConditionToSql($conditionRule, $params, $objectName, $usedFieldNames) . ' ';
                } elseif ($conditionRule instanceof Condition) {
                    $result .= ' ' . $this->standardConditionToSql($conditionRule, $params, $objectName, $usedFieldNames) . ' ';
                } elseif (is_array($conditionRule)) {
                    $result .= ' (' . $this->conditionToSql($condition, $conditionRule, $params, $objectName, $usedFieldNames) . ')';
                }

            }
        }

        return $result;
    }

    /**
     * @param array $conditionRule
     * @param array $params
     * @param string $objectKey
     * @param array $usedFieldNames
     * @return string
     */
    public function singleConditionToSql(Condition $condition, $conditionRule, &$params, $objectKey, &$usedFieldNames = null)
    {
        if ($conditionRule[0] === null) {
            return '';
        }

        $tableName = '';
        if ($condition->isTableNameSet()) {
            //custom tableName overwrites the tableName from the object definition (for alias use cases for example)
            $tableName = $condition->getTableName();
        }

        $def = $this->objects->getDefinition($objectKey);
        if ($def && !$tableName) {
            $tableName = $def->getTable();
        }

        $columnName = $fieldName = $conditionRule[0];
        if (false !== ($pos = strpos($fieldName, '.'))) {
            $tableName = substr($fieldName, 0, $pos);
            $columnName = $fieldName = substr($fieldName, $pos + 1);
        }

        if ($def) {
            $field = $def->getField($fieldName);
            if ($field) {
                $columns = $field->getFieldType()->getColumns();
                if (!$columns) {
                    throw new \RuntimeException("Field $fieldName ({$field->getType()}) does not have columns");
                }
                $columnName = Tools::camelcase2Underscore($columns[0]->getName());
            }
        } else {
            $columnName = Tools::camelcase2Underscore($fieldName);
        }

        if (null !== $usedFieldNames) {
            $usedFieldNames[] = $fieldName;
        }

        if (!is_numeric($conditionRule[0])) {
            $result = ($tableName ? Tools::dbQuote($tableName) . '.' : '') . Tools::dbQuote($columnName) . ' ';
        } else {
            $result = $conditionRule[0];
        }

        if (strtolower($conditionRule[1]) == 'regexp') {
            $result .= strtolower($this->jarvesConfig->getSystemConfig()->getDatabase()->getMainConnection()->getType()) == 'mysql' ? 'REGEXP' : '~';
        } else {
            $result .= $conditionRule[1];
        }

        if (!is_numeric($conditionRule[0])) {
            if (isset($conditionRule[2]) && $conditionRule[2] !== null) {
                if ($conditionRule[2] instanceof ConditionSubSelect) {
                    $result .= ' (' . $this->subSelectConditionToSql($conditionRule[2], $params, $objectKey, $usedFieldNames) . ') ';
                } else {
                    $params[':p' . (count($params) + 1)] = $conditionRule[2];
                    $p = ':p' . count($params);
                    if (strtolower($conditionRule[1]) == 'in' || strtolower($conditionRule[1]) == 'not in') {
                        $result .= " ($p)";
                    } else {
                        $result .= ' ' . $p;
                    }
                }
            }
        } else {
            $result .= ' ' . ($conditionRule[0] + 0);
        }

        return $result;
    }

    /**
     * @param Condition $condition
     *
     * @return array
     */
    public function extractFields(Condition $condition)
    {
        $fields = array();
        $params = array();

        $this->standardConditionToSql($condition, $params, null, $fields);

        return $fields;
    }

    /**
     * @param array $condition
     * @param string $objectKey
     *
     * @return array
     */
    public function primaryKeyToCondition($condition, $objectKey = null)
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

        $primaries = null;
        if ($objectKey && $this->objects->getDefinition($objectKey)) {
            $primaries = $this->objects->getPrimaryList($objectKey);
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
                    if (!is_string($idx) && $primaries) {
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
     * @param Condition|array $condition
     * @param array $objectItem
     * @param string $objectKey
     *
     * @return bool|null
     */
    public function satisfy($condition, $objectItem, $objectKey = null)
    {
        if (is_array($condition)) {
            $condition = Condition::create($condition, $this->jarves);
        }

        $complied = null;
        $lastOperator = 'and';

        $rules = $condition->getRules();

        if (!$rules) {
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

        foreach ($rules as $conditionRule) {
            if (is_string($conditionRule)) {
                $lastOperator = strtolower($conditionRule);
                continue;
            }

            $res = false;
            if (is_array($conditionRule) && is_string($conditionRule[0]) && is_string($conditionRule[1])) {
                $res = $this->checkRule($objectItem, $conditionRule, $objectKey);
            } else if ($conditionRule instanceof Condition) {
                $res = $this->satisfy($conditionRule, $objectItem, $objectKey);
            } else if (is_array($conditionRule)) {
                //group
                $res = $this->satisfy(Condition::create($conditionRule, $this->jarves), $objectItem, $objectKey);
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


    /**
     * @param array $objectItem
     * @param array $conditionRule
     * @param string $objectKey
     *
     * @return bool
     */
    public function checkRule($objectItem, $conditionRule, $objectKey = null)
    {
        $field = $conditionRule[0];
        $operator = $conditionRule[1];
        $value = $conditionRule[2];

        if (is_numeric($field)) {
            $ovalue = $field;
        } else {
            $ovalue = @$objectItem[$field];
            if (null === $ovalue && $objectKey && $definition = $this->objects->getDefinition($objectKey)) {
                $tableName = substr($field, 0, strpos($field, '.'));
                $fieldName = substr($field, strpos($field, '.') + 1);
                if ($tableName === $definition->getTable()) {
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
                return $this->pageStack->isLoggedIn()
                && $ovalue == $this->pageStack->getUser()->getId();

            case '!= CURRENT_USER':
            case 'NOT EQUAL CURRENT_USER':
                return $this->pageStack->isLoggedIn()
                && $ovalue != $this->pageStack->getUser()->getId();

            case '=':
            case 'EQUAL':
            default:
                return ($ovalue == $value);
        }
    }
}
