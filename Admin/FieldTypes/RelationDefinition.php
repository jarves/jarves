<?php

namespace Jarves\Admin\FieldTypes;


class RelationDefinition implements RelationDefinitionInterface {

    /**
     * The actual relation name.
     * @var string
     */
    protected $name;

    /**
     * The relation name on the foreign object that points back.
     *
     * @var string
     */
    protected $refName;

    /**
     * @var string
     */
    protected $type;

    /**
     * @var string
     */
    protected $foreignObjectKey;

    /**
     * @var RelationReferenceDefinitionInterface[]
     */
    protected $references;

    /**
     * cascade|setnull|restrict|none
     *
     * @var string
     */
    protected $onDelete = 'cascade';

    /**
     * cascade|setnull|restrict|none
     *
     * @var string
     */
    protected $onUpdate = 'cascade';

    /**
     * @param RelationReferenceDefinitionInterface[] $references
     */
    public function setReferences($references)
    {
        $this->references = $references;
    }

    /**
     * @return RelationReferenceDefinitionInterface[]
     */
    public function getReferences()
    {
        return $this->references;
    }

    /**
     * @param string $onUpdate
     */
    public function setOnUpdate($onUpdate)
    {
        $this->onUpdate = $onUpdate;
    }

    /**
     * @return string
     */
    public function getOnUpdate()
    {
        return $this->onUpdate;
    }

    /**
     * @param string $onDelete
     */
    public function setOnDelete($onDelete)
    {
        $this->onDelete = $onDelete;
    }

    /**
     * @return string
     */
    public function getOnDelete()
    {
        return $this->onDelete;
    }

    /**
     * @param string $foreignObjectKey
     */
    public function setForeignObjectKey($foreignObjectKey)
    {
        $this->foreignObjectKey = $foreignObjectKey;
    }

    /**
     * @return string
     */
    public function getForeignObjectKey()
    {
        return $this->foreignObjectKey;
    }


    /**
     * @param string $name
     */
    public function setName($name)
    {
        $this->name = $name;
    }

    /**
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @param string $refName
     */
    public function setRefName($refName)
    {
        $this->refName = $refName;
    }

    /**
     * @return string
     */
    public function getRefName()
    {
        return $this->refName;
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
}