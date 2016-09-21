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

use Jarves\Admin\FieldTypes\TypeNotFoundException;
use Jarves\Exceptions\ObjectFieldNotFoundException;
use Jarves\Exceptions\ObjectNotFoundException;
use Jarves\Admin\Form\Form;
use Jarves\Tools;

class Field extends Model
{
    protected $attributes = ['id', 'type', 'target', 'required', 'primaryKey', 'autoIncrement'];
    protected $arrayKey = 'id';

    /**
     * @var string
     */
    protected $id;

    /**
     * The label.
     *
     * @var string
     */
    protected $label;

    /**
     * Shows a grayed description text. Use markdown to format stuff.
     *
     * @var string
     */
    protected $description;

    /**
     * @var string
     */
    protected $type;

    /**
     * @var integer
     */
    protected $maxLength;

    /**
     * @var string
     */
    protected $object;

    /**
     * @var \Jarves\Configuration\Object
     */
    private $objectDefinition;

    /**
     * One of
     *
     * \Jarves\ORM\ORMAbstract::
     *       MANY_TO_ONE = 'nTo1',
     *       ONE_TO_MANY = '1ToN',
     *       ONE_TO_ONE = '1To1',
     *       MANY_TO_MANY = 'nToM';
     *
     * @var string
     */
    protected $objectRelation;

    /**
     * @var string
     */
    protected $objectLabel;

    /**
     * The table name of the middle-table of a nToM relation.
     *
     * @var string
     */
    protected $objectRelationTable;

    /**
     * The object name of the cross-table of a nToM relation.
     *
     * @var string
     */
    protected $objectRelationCrossObjectKey;

    /**
     * The virtualField name of the field in the foreign object pointing to us back.
     *
     * @var string
     */
    protected $objectRefRelationName;

    /**
     * onDelete cascade|setnull|restrict|none
     *
     * @var string
     */
    protected $objectRelationOnDelete = 'cascade';

    /**
     * onUpdate cascade|setnull|restrict|none
     *
     * @var string
     */
    protected $objectRelationOnUpdate = 'cascade';

    /**
     * If the storage backend should also create a constraint so its not possible to pass a invalid reference id.
     *
     * @var bool
     */
    protected $objectRelationWithConstraint = true;

    /**
     * The key of the field this is representing. Primarily for types 'predefined'.
     *
     * @internal
     * @var string
     */
    protected $field;

    /**
     * Not in use.
     *
     * @var string
     */
    protected $layout;

    /**
     * Only used when this field is a object attribute (extends another foreign object)
     *
     * @internal
     * @var string
     */
    protected $target;

    /**
     * Whether this field is a attribute.
     *
     * @var boolean
     */
    protected $attribute = false;

    /**
     * When defined, this field is hidden as long as the parent does not have the given value in `needValue`.
     * Per default, this is checked against the parent (when this field is in a `children` section of another field),
     * however, you can change that by using `againstField`.
     *
     * @var string|null
     */
    protected $needValue;

    /**
     * Works only with `needValue`. A field id from another field.
     *
     * @var string|null
     */
    protected $againstField;

    /**
     * The default/initial value.
     *
     * @var mixed|null
     */
    protected $default = null;

    /**
     * @var Field
     */
    private $parentField;

    /**
     * @var Form;
     */
    private $form;

    /**
     * If this field starts with a empty value (on initialisation). (Good fit for password fields)
     *
     * @var bool
     */
    protected $startEmpty = false;

    /**
     * If this field returns the value even though it's the `default` value (in a form).
     *
     * @var bool
     */
    protected $returnDefault = false;

    /**
     * Defines if this field needs a valid value.
     *
     * @var bool
     */
    protected $required = false;

    /**
     * @var string
     */
    protected $requiredRegex;

    /**
     * If this field injects a `tr`+2x`td` instead of `div`.
     *
     * @var bool
     */
    protected $tableItem;

    /**
     * If this fields is disabled or not.
     *
     * @var bool
     */
    protected $disabled = false;

    /**
     * If this fields contains a default wrapper div with title, description etc or only the input itself.
     *
     * @var bool
     */
    protected $noWrapper = false;

    /**
     * Shows a little help icon and points to the given help id.
     *
     * @var string
     */
    protected $help;

    /**
     * Width of a column.
     *
     * @var integer|string
     */
    protected $width;

    /**
     * Width of the actual input element (input, select, textarea, etc)
     *
     * @var string|integer
     */
    protected $inputWidth;

    /**
     * Width of the panel where the input is placed.
     *
     * @var string|integer
     */
    protected $fieldWidth;

    /**
     * @var bool
     */
    protected $primaryKey = false;

    /**
     * @var bool
     */
    protected $autoIncrement = false;

    /**
     * @var Field[]
     */
    protected $children;

    /**
     * @var Options
     */
    protected $options;

    /**
     * @var string
     */
    protected $customSave;

    /**
     * @var string
     */
    protected $customGet;

    /**
     * @var bool
     */
    protected $saveOnlyFilled = false;

    /**
     * @var \Jarves\Admin\FieldTypes\TypeInterface
     */
    private $fieldType;


    /**
     * Temporarily value for fields without field type.
     *
     * @var mixed
     */
    private $tempValue;

    /**
     * If this is a virtual field or not. Virtual fields a technical implementation
     * fields to keep for example arelation between object fields in sync or if a fieldType needs
     * multiple fields to be able to store their data.
     *
     * Virtual fields are not exported to the configuration xml.
     *
     * @var boolean
     */
    protected $virtual = false;

    public function __sleep()
    {
        $vars = parent::__sleep();
        $vars[] = 'objectDefinition';

        return $vars;
    }

    /**
     * @param array $values
     * @param string $key
     */
    public function fromArray($values, $key = null)
    {
        parent::fromArray($values, $key);
        if (is_string($key)) {
            $this->setId($key);
        }
    }

    /**
     * @param bool $printDefaults
     *
     * @return array
     */
    public function toArray($printDefaults = false)
    {
        $array = parent::toArray($printDefaults);

        if ($this->getType() && $this->hasFieldType()) {
            $array['selection'] = $this->getFieldType()->getSelection();
        }

        return $array;
    }

    /**
     * @return bool
     */
    public function hasFieldType()
    {
        return $this->getJarves()->getFieldTypes()->hasType($this->getType());
    }

    /**
     * @return \Jarves\Admin\FieldTypes\TypeInterface
     * @throws \Jarves\Exceptions\ObjectNotFoundException
     * @throws \Jarves\Exceptions\ObjectFieldNotFoundException
     * @throws \Jarves\Admin\FieldTypes\TypeNotFoundException
     */
    public function getFieldType()
    {
        if (null === $this->fieldType) {
            $type = $this->getType();
            $field = null;
//            if ('predefined' === strtolower($type)) {
//                $object = $this->getJarves()->getObjects()->getDefinition($this->getObject());
//                if (!$object && $this->getObjectDefinition()) {
//                    $object = $this->getObjectDefinition();
//                }
//                if (null === $object) {
//                    throw new ObjectNotFoundException(
//                        sprintf(
//                            'Object `%s` for predefined field `%s` not found.',
//                            $this->getObject(),
//                            $this->getId()
//                        )
//                    );
//                }
//                if (!$fieldId = $this->getField()) {
//                    $fieldId = $this->getId();
//                }
//
//                if (!$field = $object->getField($fieldId)) {
//                    throw new ObjectFieldNotFoundException(
//                        sprintf(
//                            'Field `%s` of Object `%s` for predefined field `%s` not found.',
//                            $fieldId,
//                            $object->getKey(),
//                            $this->getId()
//                        )
//                    );
//                }
//                $type = $field->getType();
//            }
            try {
                $this->fieldType = $this->getJarves()->getFieldTypes()->newType($type);
            } catch (\Exception $e) {
                if ($this->getObjectDefinition()) {
                    $message = sprintf(
                        'FieldType `%s` for field `%s` in object `%s` not found.',
                        $type,
                        $this->getId(),
                        $this->getObjectDefinition()->getId()
                    );
                } else {
                    $message = sprintf('FieldType `%s` for field `%s` not found.', $type, $this->getId());
                }
                throw new TypeNotFoundException($message, 0, $e);
            }
            $this->fieldType->setFieldDefinition($field ?: $this);
        }

        return $this->fieldType;
    }

    /**
     * @param \Jarves\Configuration\Object $objectDefinition
     */
    public function setObjectDefinition(Object $objectDefinition)
    {
        $this->objectDefinition = $objectDefinition;
    }

    /**
     * @return \Jarves\Configuration\Object
     */
    public function getObjectDefinition()
    {
        return $this->objectDefinition;
    }

//    /**
//     * Do whatever is needed to setup the build environment correctly.
//     *
//     * @param \Jarves\Configuration\Object $object
//     * @param Configs $configs
//     */
//    public function bootBuildTime(Object $object, Configs $configs)
//    {
//        $this->getFieldType()->bootBuildTime($object, $configs);
//    }

    /**
     * Do whatever is needed to setup the runtime environment correctly.
     *
     * e.g. create cross foreignKeys for 1-to-n relations.
     *
     * @param \Jarves\Configuration\Object $object
     * @param Configs                      $configs
     */
    public function bootRunTime(Object $object, Configs $configs)
    {
        if ($this->hasFieldType()){
            $this->getFieldType()->bootRunTime($object, $configs);
        }
    }

    /**
     * @param \Jarves\Admin\FieldTypes\TypeInterface $fieldType
     */
    public function setFieldType($fieldType)
    {
        $this->fieldType = $fieldType;
    }

    /**
     * @param boolean $virtual
     */
    public function setVirtual($virtual)
    {
        $this->virtual = $virtual;
    }

    /**
     * @return boolean
     */
    public function getVirtual()
    {
        return $this->virtual;
    }

    /**
     * @return bool
     */
    public function isVirtual()
    {
        return true == $this->virtual;
    }

    /**
     * @param Options $options
     */
    public function setOptions(Options $options)
    {
        foreach ($options->getOptions() as $key => $option) {
            $setter = 'set' . ucfirst($key);
            if (is_callable(array($this, $setter))) {
                $this->$setter($option);
                $options->removeOption($key);
            }
        }
        $this->options = $options && $options->getLength() ? $options : null;
    }

    /**
     * @param $key
     * @param $value
     */
    public function setOption($key, $value)
    {
        $this->options = $this->options ?: new Options(null, $this->getJarves());
        $this->options->setOption($key, $value);
    }

    /**
     * @return Options
     */
    public function getOptions()
    {
        return $this->options;
    }

    /**
     * @param string $key
     *
     * @return mixed
     */
    public function getOption($key)
    {
        return $this->options ? $this->options->getOption($key) : null;
    }

    /**
     * @param Field[] $children
     */
    public function setChildren(array $children = null)
    {
        $this->children = $children;
    }

    /**
     * @return Field[]
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
            $children = [];
            foreach ($this->children as $child) {
                $children[$child->getId()] = $child;
            }

            return $children;
        }
    }

    /**
     * @return bool
     */
    public function isPrimaryKey()
    {
        return true === $this->primaryKey;
    }

    /**
     * @return bool
     */
    public function isAutoIncrement()
    {
        return true === $this->autoIncrement;
    }

    /**
     * @param boolean $autoIncrement
     */
    public function setAutoIncrement($autoIncrement)
    {
        $this->autoIncrement = filter_var($autoIncrement, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * @return boolean
     */
    public function getAutoIncrement()
    {
        return $this->autoIncrement;
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
    public function getDescription()
    {
        return $this->description;
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
     * Returns the column name for database access.
     *
     * @return string
     */
    public function getColumnName()
    {
        return Tools::camelcase2Underscore($this->getId());
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
     * @param boolean $primaryKey
     */
    public function setPrimaryKey($primaryKey)
    {
        $this->primaryKey = filter_var($primaryKey, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * @return boolean
     */
    public function getPrimaryKey()
    {
        return $this->primaryKey;
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

    /**
     * @param string $object
     */
    public function setObject($object)
    {
        $this->object = $object;
    }

    /**
     * @return string
     */
    public function getObject()
    {
        return $this->object;
    }

    /**
     * @param string $objectRelation
     */
    public function setObjectRelation($objectRelation)
    {
        $this->objectRelation = $objectRelation;
    }

    /**
     * @return string
     */
    public function getObjectRelation()
    {
        return $this->objectRelation;
    }

    /**
     * @param string $layout
     */
    public function setLayout($layout)
    {
        $this->layout = $layout;
    }

    /**
     * @return string
     */
    public function getLayout()
    {
        return $this->layout;
    }

    /**
     * @param string $target
     */
    public function setTarget($target)
    {
        $this->target = $target;
    }

    /**
     * @return string
     */
    public function getTarget()
    {
        return $this->target;
    }

    /**
     * @param boolean $attribute
     */
    public function setAttribute($attribute)
    {
        $this->attribute = $attribute;
    }

    /**
     * @return boolean
     */
    public function getAttribute()
    {
        return $this->attribute;
    }

    /**
     * @return bool
     */
    public function isAttribute()
    {
        return !!$this->attribute;
    }

    /**
     * @param mixed $tableItem
     */
    public function setTableItem($tableItem)
    {
        $this->tableItem = $tableItem;
    }

    /**
     * @return mixed
     */
    public function getTableItem()
    {
        return $this->tableItem;
    }

    /**
     * @param boolean $startEmpty
     */
    public function setStartEmpty($startEmpty)
    {
        $this->startEmpty = $startEmpty;
    }

    /**
     * @return boolean
     */
    public function getStartEmpty()
    {
        return $this->startEmpty;
    }

    /**
     * @param boolean $required
     */
    public function setRequired($required)
    {
        $this->required = $required;
    }

    /**
     * @return boolean
     */
    public function getRequired()
    {
        return $this->required;
    }

    /**
     * @return bool
     */
    public function isRequired()
    {
        return !!$this->required;
    }

    /**
     * @param boolean $returnDefault
     */
    public function setReturnDefault($returnDefault)
    {
        $this->returnDefault = $returnDefault;
    }

    /**
     * @return boolean
     */
    public function getReturnDefault()
    {
        return $this->returnDefault;
    }

    /**
     * @param boolean $noWrapper
     */
    public function setNoWrapper($noWrapper)
    {
        $this->noWrapper = $noWrapper;
    }

    /**
     * @return boolean
     */
    public function getNoWrapper()
    {
        return $this->noWrapper;
    }

    /**
     * @param string $help
     */
    public function setHelp($help)
    {
        $this->help = $help;
    }

    /**
     * @return string
     */
    public function getHelp()
    {
        return $this->help;
    }

    /**
     * @param mixed $default
     */
    public function setDefault($default)
    {
        $this->default = $default;
    }

    /**
     * @return mixed
     */
    public function getDefault()
    {
        return $this->default;
    }

    /**
     * @param boolean $disabled
     */
    public function setDisabled($disabled)
    {
        $this->disabled = $disabled;
    }

    /**
     * @return boolean
     */
    public function getDisabled()
    {
        return $this->disabled;
    }

    /**
     * @param mixed $needValue
     */
    public function setNeedValue($needValue)
    {
        $this->needValue = $needValue;
    }

    /**
     * @return mixed
     */
    public function getNeedValue()
    {
        return $this->needValue;
    }

    /**
     * @param string $againstField
     */
    public function setAgainstField($againstField)
    {
        $this->againstField = $againstField;
    }

    /**
     * @return string
     */
    public function getAgainstField()
    {
        return $this->againstField;
    }

    /**
     * @param int|string $width
     */
    public function setWidth($width)
    {
        $this->width = $width;
    }

    /**
     * @return int|string
     */
    public function getWidth()
    {
        return $this->width;
    }

    /**
     * @param mixed $value
     */
    public function setValue($value)
    {
        if ($this->hasFieldType()) {
            $this->getFieldType()->setValue($value);
        } else {
            $this->tempValue = $value;
        }
    }

    /**
     * @return mixed
     */
    public function getValue()
    {
        if ($this->hasFieldType()) {
            return $this->getFieldType()->getValue();
        } else {
            return $this->tempValue;
        }
    }

    public function mapValues(array &$data)
    {
        if ($this->hasFieldType()) {
            return $this->getFieldType()->mapValues($data);
        } else {
            $data[$this->getId()] = $this->getValue();
        }
    }

    public function canPropertyBeExported($k)
    {
        if ('requiredRegex' === $k) {
            if (null === $this->requiredRegex) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param string $requiredRegex
     */
    public function setRequiredRegex($requiredRegex)
    {
        $this->requiredRegex = $requiredRegex;
    }

    /**
     * @return string
     */
    public function getRequiredRegex()
    {
        return $this->requiredRegex;
    }

    /**
     * Returns the internal data type.
     *
     * @return string
     */
    public function getPhpDataType()
    {
        if ($this->hasFieldType()) {
            return $this->getFieldType()->getPhpDataType();
        } else {
            return 'string';
        }
    }

    /**
     * Hidden means here if the `needValue` is correct with the value of parent or `getAgainstField`.
     *
     * @return bool
     */
    public function isHidden()
    {
        if (!$this->hasFieldType()) {
            return false;
        }

        if ($parentField = $this->getParentField()) {
            if ($parentField->isHidden()) {
                return true;
            }
        }

        if ($this->getNeedValue()) {
            $againstField = null;
            if ($againstFieldName = $this->getAgainstField()) {
                if ($this->getForm()) {
                    $againstField = $this->getForm()->getField($againstFieldName);
                }
            } else {
                $againstField = $this->getParentField();
            }
            if ($againstField) {
                if ($againstField->isHidden()) {
                    return true;
                }
                if (is_array($this->getNeedValue())) {
                    if (!in_array($againstField->getValue(), $this->getNeedValue())) {
                        return true;
                    }
                } else {
                    if ($againstField->getValue() != $this->getNeedValue()) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * @return bool
     */
    public function validate()
    {
        if (!$this->hasFieldType()){
            return [];
        }

        if ($this->isVirtual()) {
            return [];
        }

        return $this->getFieldType()->validate();
    }

    /**
     * @param \Jarves\Configuration\Field $parentField
     */
    public function setParentField($parentField)
    {
        $this->parentField = $parentField;
    }

    /**
     * @return \Jarves\Configuration\Field
     */
    public function getParentField()
    {
        return $this->parentField;
    }

    /**
     * @param Form $form
     */
    public function setForm($form)
    {
        $this->form = $form;
    }

    /**
     * @return Form
     */
    public function getForm()
    {
        return $this->form;
    }

    /**
     * @param int|string $inputWidth
     */
    public function setInputWidth($inputWidth)
    {
        $this->inputWidth = $inputWidth;
    }

    /**
     * @return int|string
     */
    public function getInputWidth()
    {
        return $this->inputWidth;
    }

    /**
     * @param int|string $fieldWidth
     */
    public function setFieldWidth($fieldWidth)
    {
        $this->fieldWidth = $fieldWidth;
    }

    /**
     * @return int|string
     */
    public function getFieldWidth()
    {
        return $this->fieldWidth;
    }

    /**
     * @param string $field
     */
    public function setField($field)
    {
        $this->field = $field;
    }

    /**
     * @return string
     */
    public function getField()
    {
        return $this->field;
    }

    /**
     * @param string $objectRefRelationName
     */
    public function setObjectRefRelationName($objectRefRelationName)
    {
        $this->objectRefRelationName = $objectRefRelationName;
    }

    /**
     * @return string
     */
    public function getObjectRefRelationName()
    {
        return $this->objectRefRelationName;
    }

    /**
     * @param string $objectLabel
     */
    public function setObjectLabel($objectLabel)
    {
        $this->objectLabel = $objectLabel;
    }

    /**
     * @return string
     */
    public function getObjectLabel()
    {
        return $this->objectLabel;
    }

    /**
     * @param string $objectRelationOnUpdate
     */
    public function setObjectRelationOnUpdate($objectRelationOnUpdate)
    {
        $this->objectRelationOnUpdate = $objectRelationOnUpdate;
    }

    /**
     * @return string
     */
    public function getObjectRelationOnUpdate()
    {
        return $this->objectRelationOnUpdate;
    }

    /**
     * @param string $objectRelationOnDelete
     */
    public function setObjectRelationOnDelete($objectRelationOnDelete)
    {
        $this->objectRelationOnDelete = $objectRelationOnDelete;
    }

    /**
     * @return string
     */
    public function getObjectRelationOnDelete()
    {
        return $this->objectRelationOnDelete;
    }

    /**
     * @param string $customGet
     */
    public function setCustomGet($customGet)
    {
        $this->customGet = $customGet;
    }

    /**
     * @return string
     */
    public function getCustomGet()
    {
        return $this->customGet;
    }

    /**
     * @param string $customSave
     */
    public function setCustomSave($customSave)
    {
        $this->customSave = $customSave;
    }

    /**
     * @return string
     */
    public function getCustomSave()
    {
        return $this->customSave;
    }

    /**
     * @param boolean $saveOnlyFilled
     */
    public function setSaveOnlyFilled($saveOnlyFilled)
    {
        $this->saveOnlyFilled = $saveOnlyFilled;
    }

    /**
     * @return boolean
     */
    public function getSaveOnlyFilled()
    {
        return $this->saveOnlyFilled;
    }

    /**
     * @param string $objectRelationTable
     */
    public function setObjectRelationTable($objectRelationTable)
    {
        $this->objectRelationTable = $objectRelationTable;
    }

    /**
     * @return string
     */
    public function getObjectRelationTable()
    {
        return $this->objectRelationTable;
    }

    /**
     * @param string $objectRelationPhpName
     */
    public function setObjectRelationCrossObjectKey($objectRelationPhpName)
    {
        $this->objectRelationCrossObjectKey = $objectRelationPhpName;
    }

    /**
     * @return string
     */
    public function getObjectRelationCrossObjectKey()
    {
        return $this->objectRelationCrossObjectKey;
    }

    /**
     * @param int $maxLength
     */
    public function setMaxLength($maxLength)
    {
        $this->maxLength = $maxLength;
    }

    /**
     * @return int
     */
    public function getMaxLength()
    {
        return $this->maxLength;
    }

    /**
     * If the storage backend should also create a constraint so its not possible to pass a invalid reference id.
     *
     * @return boolean
     */
    public function isObjectRelationWithConstraint()
    {
        return $this->objectRelationWithConstraint;
    }

    /**
     * If the storage backend should also create a constraint so its not possible to pass a invalid reference id.
     *
     * @return boolean
     */
    public function getObjectRelationWithConstraint()
    {
        return $this->objectRelationWithConstraint;
    }

    /**
     * @param boolean $objectRelationWithConstraint
     */
    public function setObjectRelationWithConstraint($objectRelationWithConstraint)
    {
        $this->objectRelationWithConstraint = $this->bool($objectRelationWithConstraint);
    }
}
