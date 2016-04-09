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

namespace Jarves\Admin\FieldTypes;

use Jarves\Configuration\Configs;
use Jarves\Configuration\Field;
use Jarves\Configuration\Object;
use Jarves\Exceptions\ModelBuildException;
use Jarves\Exceptions\ObjectNotFoundException;
use Jarves\Objects;
use Jarves\Storage\AbstractStorage;
use Jarves\Tools;

class TypeObject extends AbstractType
{
    protected $name = 'Object';

    /**
     * @var Objects
     */
    protected $objects;

    public function __construct(Objects $objects)
    {
        $this->objects = $objects;
    }

    public function getColumns()
    {
        if (AbstractStorage::MANY_TO_ONE == $this->getFieldDefinition()->getObjectRelation() ||
            AbstractStorage::ONE_TO_ONE == $this->getFieldDefinition()->getObjectRelation()
        ) {
            $foreignObjectDefinition = $this->objects->getDefinition($this->getFieldDefinition()->getObject());

            if (!$foreignObjectDefinition) {
                throw new ObjectNotFoundException(sprintf(
                    'ObjectKey `%s` not found in field `%s` of object `%s`',
                    $this->getFieldDefinition()->getObject(),
                    $this->getFieldDefinition()->getId(),
                    $this->getFieldDefinition()->getObjectDefinition()->getId()
                ));
            }

            /** @var $columns ColumnDefinition[] */
            $columns = [];

            foreach ($foreignObjectDefinition->getPrimaryKeys() as $pk) {
                $fieldColumns = $pk->getFieldType()->getColumns();
                $columns = array_merge($columns, $fieldColumns);
            }

            //rename columns to fieldId+column.id
            foreach ($columns as &$column) {
                $column = clone $column;
                $column->setName($this->getFieldDefinition()->getId() . ucfirst($column->getName()));
            }

            return $columns;
        }

        return [];
    }

    /**
     * Returns the field names to select from the object model as array.
     *
     * @return string[]
     */
    public function getSelection()
    {
        $selection = [];
        if ($columns = $this->getColumns()) {
            foreach ($columns as $column) {
                $selection[] = $column->getName();
            }
        }

        return $selection;
    }

    public function bootRunTime(Object $object, Configs $configs)
    {
        $field = $this->getFieldDefinition();

        //check for n-to-n relation and create crossTable
        if (AbstractStorage::MANY_TO_MANY == $field->getObjectRelation()) {
            if ($this->defineCrossObject($object, $configs)) {
                $configs->addReboot(sprintf('Added crossObject for field %s', $field->getId()));
            }
        }

//        //check for n-to-1 and one-to-one objectRelations and create cross object with relations
//        if (ORMAbstract::MANY_TO_ONE == $field->getObjectRelation() ||
//            ORMAbstract::ONE_TO_ONE == $field->getObjectRelation()
//        ) {
        if ($this->defineRelation($object, $configs)) {
            $configs->addReboot(
                sprintf(
                    'Defined relation %s from %s -> %s',
                    $field->getObjectRelation(),
                    $object->getKey() . '.' . $field->getId(),
                    $field->getObject()
                )
            );
        }
//        }

        //create virtual reference-field for many-to-one relations
        if ($this->getFieldDefinition()->getObjectRelation() == AbstractStorage::MANY_TO_ONE) {
            if ($object = $configs->getObject($field->getObject())) {

                if (!$refName = $field->getObjectRefRelationName()) {
                    $refName = $field->getObjectDefinition()->getId();
                }

                $refName = lcfirst($refName);
                $virtualField = $object->getField($refName);

                if (!$virtualField) {
                    $virtualField = new Field(null, $object->getJarves());
                    $virtualField->setVirtual(true);
                    $virtualField->setId($refName);
                    $virtualField->setType('object');
                    $virtualField->setLabel('Auto Object Relation (' . $field->getObject() . ')');
                    $virtualField->setObject($field->getObjectDefinition()->getKey());
                    $virtualField->setObjectRelation(AbstractStorage::ONE_TO_MANY);
                    $object->addField($virtualField);

                    $configs->addReboot(sprintf('Added virtualField for field %s', $field->getId()));
                }
            }
        }
    }

    /**
     * @param \Jarves\Configuration\Object $objectDefinition
     * @param Configs $configs
     * @return bool
     */
    protected function defineCrossObject(Object $objectDefinition, Configs $configs)
    {
        $changed = false;

        $bundle = $objectDefinition->getBundle();
        $foreignObjectDefinition = $configs->getObject($this->getFieldDefinition()->getObject());

        $possibleObjectName =
            ucfirst($objectDefinition->getId()) .
            ucfirst($foreignObjectDefinition->getId());
        $possibleObjectKey = $bundle->getName() . '/' . $possibleObjectName;

        if (!$crossObjectKey = $this->getFieldDefinition()->getObjectRelationCrossObjectKey()) {
            $crossObjectKey = $possibleObjectKey;
        }

        $crossObject = $configs->getObject($crossObjectKey);

        if (!$crossObject) {
            if (!$crossObject = $configs->getObject($possibleObjectKey)) {
                $crossObject = new Object(null, $objectDefinition->getJarves());
                $crossObject->setId($possibleObjectName);
                $crossObject->setTable(
                    $objectDefinition->getTable() . '_' . Tools::camelcase2Underscore($foreignObjectDefinition->getId())
                );
                $crossObject->setExcludeFromREST(true);
                $changed = true;
            }
        }

        if (!$crossObject->isCrossRef()) {
            $crossObject->setCrossRef(true);
            $changed = true;
        }

        $leftFieldName = $this->getFieldDefinition()->getObjectRefRelationName() ? : $objectDefinition->getId();
        if (!$crossObject->getField($leftFieldName)) {
            $leftObjectField = new Field(null, $objectDefinition->getJarves());
            $leftObjectField->setId($leftFieldName);
            $leftObjectField->setType('object');
            $leftObjectField->setObject($objectDefinition->getKey());
            $leftObjectField->setObjectRelation(AbstractStorage::ONE_TO_ONE);
            $leftObjectField->setPrimaryKey(true);

            $crossObject->addField($leftObjectField);
            $changed = true;
        }

        if (!$crossObject->getField($this->getFieldDefinition()->getId())) {
            $rightObjectField = new Field(null, $objectDefinition->getJarves());
            $rightObjectField->setId($this->getFieldDefinition()->getId());
            $rightObjectField->setType('object');
            $rightObjectField->setObject($foreignObjectDefinition->getKey());
            $rightObjectField->setObjectRelation(AbstractStorage::ONE_TO_ONE);
            $rightObjectField->setPrimaryKey(true);

            $crossObject->addField($rightObjectField);
            $changed = true;
        }

        if (!$crossObject->getBundle()) {
            //we created a new object
            $bundle->addObject($crossObject);
        }

        return $changed;
    }

    protected function defineRelation(Object $objectDefinition, Configs $configs)
    {
        $relation = $this->getRelation($configs);
        if ($relation && !$objectDefinition->hasRelation($relation->getName())) {
            $objectDefinition->addRelation($relation);

            return true;
        }
    }

    /**
     * @param Configs $configs
     * @return RelationDefinition|null
     * @throws \Jarves\Exceptions\ModelBuildException
     */
    protected function getRelation(Configs $configs)
    {
        $field = $this->getFieldDefinition();
        $columns = [];
        $foreignObjectDefinition = $configs->getObject($field->getObject());

        if (!$foreignObjectDefinition) {
            throw new ModelBuildException(sprintf(
                'ObjectKey `%s` not found for field `%s` in object `%s`',
                $field->getObject(),
                $field->getId(),
                $field->getObjectDefinition()->getId()
            ));
        }

        $relation = new RelationDefinition();
        $relation->setName($field->getId());
        $relation->setType($field->getObjectRelation());
        $relation->setForeignObjectKey($field->getObject());
        $relation->setWithConstraint($field->getObjectRelationWithConstraint());

        if ($refName = $field->getObjectRefRelationName()) {
            $relation->setRefName($refName);
        }

        foreach ($foreignObjectDefinition->getPrimaryKeys() as $pk) {
            $fieldColumns = $pk->getFieldType()->getColumns();
            $columns = array_merge($columns, $fieldColumns);
        }

        if (!$columns) {
            return null;
        }

        $references = [];

        foreach ($columns as $column) {
            $reference = new RelationReferenceDefinition();

            $localColumn = clone $column;
            $localColumn->setName($field->getId() . ucfirst($column->getName()));
            $reference->setLocalColumn($localColumn);

            $reference->setForeignColumn($column);
            $references[] = $reference;
        }

        $relation->setReferences($references);

        return $relation;
    }

}