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

namespace Jarves\Storage;

use Jarves\Configuration\Condition;
use Jarves\Jarves;
use Jarves\Tools;

/**
 * AbstractStorage class for objects storage/query.
 *
 * Please do not handle 'permissionCheck' in $options. This is handled in \Jarves\Object.
 * You will get in getList() a complex $pCondition object instead (if there are any ACL items)
 *
 *
 * $pk is an array with following format
 *
 *  array(
 *      '<keyName>'  => <value>
 *      '<keyName2>' => <value2>
 *  )
 *
 * example
 *
 * array(
 *    'id' => 1234
 * )
 *
 */
abstract class AbstractStorage
{
    const
        MANY_TO_ONE = 'nTo1',
        ONE_TO_MANY = '1ToN',
        ONE_TO_ONE = '1To1',
        MANY_TO_MANY = 'nToM';

    /**
     * Cached primary key order.
     * Only keys.
     *
     * @var array
     */
    public $primaryKeys = array();

    /**
     * The current object key.
     *
     * @var string
     */
    public $objectKey;

    /**
     * Cached the object definition.
     *
     * @var \Jarves\Configuration\Object
     */
    public $definition;

    /**
     * Important call directly after the creation of this class.
     *
     * @param string $objectKey
     * @param Object $definition
     */
    public function configure($objectKey, $definition)
    {
        $this->objectKey = \Jarves\Objects::normalizeObjectKey($objectKey);
        $this->definition = $definition;

        foreach ($this->definition->getFields() as $field) {
            if ($field->isPrimaryKey()) {
                $this->primaryKeys[] = $field->getId();
            }
        }
    }

    /**
     * Clears the internal cache. This is called when the defined object has been changed.
     */
    public function clearCache()
    {

    }

    /**
     * Executes a search to this object, filter by $query and optional by a more complet condition $condition.
     *
     * Returns a array of object items. Necessary fields are all primary keys and the label field, defined
     * in Object::$labelField or Object::$treeLabel.
     *
     * Optional is a field key '_label', which is being used as label in the search interfaces as label.
     *
     * @param string $query
     * @param Condition|null $condition
     * @param int $max
     *
     * @return array|null
     */
    public function search($query, Condition $condition = null, $max = 20)
    {

    }

    public function getDefinition()
    {
        return $this->definition;
    }


    public function setDefinition($definition)
    {
        $this->definition = $definition;
    }

    public function setPrimaryKeys($pks)
    {
        $this->primaryKeys = $pks;
    }

    /**
     * Exports all data as array 
     * 
     * @param Condition|null $condition
     * 
     * @return array
     */
    public function export(Condition $condition = null)
    {
        throw new NotImplementedException('export is not implemented in ' . get_called_class());
    }

    /**
     * Returns a field definition.
     *
     * @param  string $fieldKey
     *
     * @return array
     */
    public function getField($fieldKey)
    {
        return $this->definition['fields'][$fieldKey];
    }

    /**
     * Returns the primary keys as array.
     *
     * @return array [key1, key2, key3]
     */
    public function getPrimaryKeys()
    {
        return $this->primaryKeys;
    }

    /**
     * Returns the object key.
     *
     * @return string
     */
    public function getObjectKey()
    {
        return $this->objectKey;
    }

    /**
     * Normalizes a primary key, that is normally used inside PHP classes,
     * since developers are lazy and we need to convert the lazy primary key
     * to the full definition.
     *
     * Possible input:
     *  array('bla'), 'peter', 123,
     *
     * Output
     *  array('id' => 'bla'), array('id' => 'peter'), array('id' => 123)
     *  if the only primary key is named `id`.
     *
     * @param  mixed $pk
     *
     * @return array A single primary key as array. Example: array('id' => 1).
     */
    public function normalizePrimaryKey($pk)
    {
        if (!is_array($pk)) {
            $result = array();
            $result[$this->primaryKeys[0]] = $pk;
        } elseif (is_numeric(key($pk))) {
            $result = array();
            $length = count($this->primaryKeys);
            for ($i = 0; $i < $length; $i++) {
                $result[$this->primaryKeys[$i]] = $pk[$i];
            }
        } else {
            $result = $pk;
        }

        if (count($this->primaryKeys) > count($result)) {
            foreach ($this->primaryKeys as $pk2) {
                if (!isset($result[$pk2])) {
                    $result[$pk2] = null;
                }
            }
        }

        return $result;
    }

    /**
     * Converts given primary values from type string into proper normalized array definition.
     * This builds the array for the $pk for all of these methods inside this class.
     *
     * The primaryKey comes primarily from the REST API.
     *
     *    admin/object/news/1
     *    admin/objects?uri=news/1/2
     * where
     *    admin/object/news/<id>
     *    admin/objects?uri=news/<id>
     *
     * is this ID.
     *
     * 1/2/3 => array( array(id =>1),array(id =>2),array(id =>3) )
     * 1 => array(array(id => 1))
     * idFooBar => array( id => "idFooBar")
     * idFoo/Bar => array(array(id => idFoo), array(id2 => "Bar"))
     * 1,45/2,45 => array(array(id => 1, pid = 45), array(id => 2, pid=>45))
     *
     * @param  string $pk
     *
     * @return array  Always a array with primary keys as arrays too. So $return[0] is the first primary key array. Example array(array('id' => 4))
     */
    public function primaryStringToArray($pk)
    {
        if ($pk === '') {
            return false;
        }
        $groups = explode('/', $pk);

        $result = array();

        foreach ($groups as $group) {

            $item = array();
            if ('' === $group) continue;
            $primaryGroups = explode(',', $group);

            foreach ($primaryGroups as $pos => $value) {

                if ($ePos = strpos($value, '=')) {
                    $key = substr($value, 0, $ePos);
                    $value = substr($value, $ePos + 1);
                    if (!in_array($key, $this->primaryKeys)) {
                        continue;
                    }
                } elseif (!$this->primaryKeys[$pos]) {
                    continue;
                }

                $key = $this->primaryKeys[$pos];

                $item[$key] = Tools::urlDecode($value);
            }

            if (count($this->primaryKeys) > count($item)) {
                foreach ($this->primaryKeys as $pk2) {
                    if (!@$item[$pk2]) {
                        $item[$pk2] = null;
                    }
                }
            }

            if (count($item) > 0) {
                $result[] = $item;
            }
        }

        return $result;

    }

    /**
     *
     * $pOptions is a array which can contain following options. All options are optional.
     *
     *  'fields'          Limit the columns selection. Use a array or a comma separated list (like in SQL SELECT)
     *                    If empty all columns will be selected.
     *  'offset'          Offset of the result set (in SQL OFFSET)
     *  'limit'           Limits the result set (in SQL LIMIT)
     *  'order'           The column to order. Example:
     *                    array(
     *                      array('category' => 'asc'),
     *                      array(title' => 'asc')
     *                    )
     *
     *  'permissionCheck' Defines whether we check against the ACL or not. true or false. default false
     *
     *
     * @abstract
     *
     * @param array $filter simple filter
     * @param Condition $condition complex filter condition
     * @param array $options
     */
    abstract public function getItems(array $filter = null, Condition $condition = null, $options = null);

    /**
     *
     * $pOptions is a array which can contain following options. All options are optional.
     *
     *  'fields'          Limit the columns selection. Use a array or a comma separated list (like in SQL SELECT)
     *                    If empty all columns will be selected.
     *
     *  'permissionCheck' Defines whether we check against the ACL or not. true or false. default false
     *
     *
     * @abstract
     *
     * @param array $pk
     * @param array $options
     *
     * @return array
     */
    abstract public function getItem($pk, $options = null);

    /**
     *
     * @abstract
     *
     * @param array $pk
     *
     */
    abstract public function remove($pk);

    /**
     * @abstract
     *
     * @param array  $values
     * @param array  $targetPk If nested set
     * @param string $position `first` (child), `last` (last child), `prev` (sibling), `next` (sibling)
     * @param int    $scope    If nested set with scope
     *
     * @return array inserted/new primary key/s always as a array.
     */
    abstract public function add($values, $targetPk = null, $position = 'first', $scope = null);

    /**
     * Updates an object entry.  This means, all fields which are not defined will be saved as NULL.
     *
     * @abstract
     *
     * @param  array $pk
     * @param  array $values
     *
     * @throws \ObjectItemNotModified
     */
    abstract public function update($pk, $values);

    /**
     * Patches a object entry. This means, only defined fields will be saved. Fields which are not defined will
     * not be overwritten.
     *
     * @abstract
     *
     * @param  array                  $pk
     * @param  array                  $values
     *
     * @throws \ObjectItemNotModified
     */
    abstract public function patch($pk, $values);

    /**
     * @abstract
     *
     * @param Condition $condition
     *
     * @return int
     */
    abstract public function getCount(Condition $condition = null);


    /**
     * Do whatever is needed, to clear all items out of this object scope.
     *
     * @abstract
     * @return bool
     */
    abstract public function clear();

    /**
     * Builds a condition for the sub-items check in \Jarves\Permissions::getListingCondition() for nested set objects.
     *
     * @param Condition $condition
     *
     * @return Condition
     *
     * @throws \Exception when not overwritten
     */
    public function getNestedSubCondition(Condition $condition)
    {
        throw new \Exception('You need to overwrite AbstractStorage::getNestedSubCondition for nested objects');
    }

    /**
     * Removes anything that is required to hold the data. E.g. SQL Tables, Drop Sequences, etc.
     *
     * @abstract
     * @return bool
     */
    public function drop()
    {
    }


    /**
     * Moves a item to a new position.
     *
     * @param  array  $pk              Full PK as array
     * @param  array  $targetPk        Full PK as array
     * @param  string $position        `first` (child), `last` (last child), `prev` (sibling), `next` (sibling)
     * @param         $targetObjectKey
     * @return boolean
     */
    public function move($pk, $targetPk, $position = 'first', $targetObjectKey = null)
    {
        throw new \Exception('Move method is not implemented for this object layer.');
    }

    /**
     * Returns a branch if the object is a nested set.
     *
     * Result should be:
     *
     *  array(
     *
     *    array(<valuesFromFirstItem>, '_children' => array(<children>), '_childrenCount' => <int> ),
     *    array(<valuesFromSecondItem>, '_children' => array(<children>), '_childrenCount' => <int> ),
     *    ...
     *
     *  )
     *
     * @param  array                    $pk
     * @param  Condition                $condition
     * @param  int                      $depth     Started with one. One means, only the first level, no children at all.
     * @param  mixed                    $scope
     * @param  array                    $options
     *
     * @throws \Exception
     *
     * @return array
     */
    public function getBranch($pk = null, Condition $condition = null, $depth = 1, $scope = null, $options = null)
    {
        if (!$this->getDefinition()->isNested()) {
            throw new \Exception(sprintf('Object %s it not a nested set.', $this->objectKey));
        }
        throw new \Exception(sprintf('getBranch is not implemented.'));
    }

    /**
     * @param null $pk
     * @param Condition $condition
     * @param null $scope
     *
     * @return array
     */
    public function getBranchChildrenCount($pk = null, Condition $condition = null, $scope = null){
        if (!$this->getDefinition()->isNested()) {
            throw new \Exception(sprintf('Object %s it not a nested set.', $this->objectKey));
        }
        throw new \Exception(sprintf('getBranch is not implemented.'));
    }

    /**
     * @param Condition $condition
     * @param array $options
     * @throws \LogicException
     */
    public function getRoots(Condition $condition = null, $options = null)
    {
         if (!$this->definition['nested']) {
            throw new \LogicException(sprintf('Object %s it not a nested set.', $this->objectKey));
         }
         return null;
    }


    /**
     * Returns the parent if exists otherwise false.
     *
     * @param  array  $pk
     * @param  array  $options
     *
     * @return mixed
     */
    public function getParent($pk, $options = null)
    {
        if ($parentId = $this->getParentId($pk)) {
            return $this->getItem($pk, $options);
        }
    }

    /**
     * Returns all parents.
     *
     * Root object first.
     * Each entry has to have also '_objectKey' as value.
     *
     * @param array $pk
     *
     * @return array
     *
     */
    public function getParents($pk)
    {
        throw new \Exception(sprintf('getParents is not implemented.'));
    }


    /**
     * Returns parent's pk, if exists, otherwise null.
     *
     * @param  array $pk
     *
     * @return array
     */
    public function getParentId($pk)
    {
        $object = $this->getParent($pk);

        if (!$object) {
            return null;
        }

        if (count($this->primaryKeys) == 1) {
            return $object[current($this->primaryKeys)];
        } else {
            $result = array();
            foreach ($this->primaryKeys as $key) {
                $result[] = $object[$key];
            }

            return $result;
        }
    }

}
