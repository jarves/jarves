<?php

namespace Jarves\Configuration;

class ConditionSubSelect extends Condition
{
    CONST DESC = 'DESC';
    CONST ASC = 'ASC';

    /**
     * @var array
     */
    protected $select = [];

    protected $order;

    protected $joins = [];

    protected $selfJoins = [];

    protected $tableNameSelect = '';

    public function fromArray($values, $key = null)
    {
        $this->rules = $values;
    }

    public function addJoin($table, $on)
    {
        $this->joins[] = $table . ' ON ' . $on;
    }

    public function addSelfJoin($alias, $on)
    {
        $this->selfJoins[$alias] = $on;
    }


    public function setTableNameSelect($tableName)
    {
        $this->tableNameSelect = $tableName;
    }

    /**
     * @return array
     */
    public function getJoins()
    {
        return $this->joins;
    }

    /**
     * @return array
     */
    public function getSelfJoins()
    {
        return $this->selfJoins;
    }

    /**
     * @return mixed
     */
    public function getOrder()
    {
        return $this->order;
    }

    /**
     * @return string
     */
    public function getTableNameSelect()
    {
        return $this->tableNameSelect;
    }

    /**
     * @param array|string $select
     */
    public function select($select)
    {
        $this->select = (array)$select;
    }

    public function orderBy($field, $order = ConditionSubSelect::ASC)
    {
        $this->order = [$field, $order];
    }

    /**
     * @return array
     */
    public function getSelect()
    {
        return $this->select;
    }

    public function getOrderBy()
    {
        return $this->order;
    }

//    /**
//     * Returns the actual result of the sub-select
//     *
//     * @return mixed
//     */
//    public function getValue($objectKey, &$usedFieldNames = array())
//    {
//        $params = [];
//        $sql = $this->toSql($params, $objectKey, $usedFieldNames);
//        $row = dbExFetch($sql, $params);
//
//        return 1 === count($row) ? current($row) : $row;
//    }

}