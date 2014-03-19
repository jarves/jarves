<?php

namespace Jarves\Admin\Form;

use Jarves\Configuration\Field;

class Form {
    /**
     * @var Field[]
     */
    protected $fields = [];

    /**
     * @param Field[] $fields
     */
    public function __construct(array $fields = null) {
        if ($fields) {
            $this->setFields($fields);
        }
    }

    /**
     * @param Field[] $fields
     */
    public function setFields($fields)
    {
        $this->fields = $fields;
        static::setForm($this->fields, $this);
    }

    /**
     * @return Field[]
     */
    public function getFields()
    {
        return $this->fields;
    }

    /**
     * @param string $key
     *
     * @return Field
     */
    public function getField($key)
    {
        return static::searchField($this->fields, $key);
    }

    /**
     * @param Field[] $fields
     * @param string $key
     *
     * @return Field
     */
    public static function searchField(&$fields, $key)
    {
        foreach ($fields as $field) {
            if ($field->getId() == $key) {
                return $field;
            } else if ($field->getChildren()) {
                if ($found = static::searchField($field->getChildren(), $key)){
                    return $found;
                }
            }
        }
    }
    /**
     * @param array $fields
     * @param Form $form
     *
     * @return Field
     */
    public static function setForm($fields, $form)
    {
        foreach ($fields as $field) {
            if ($field && $field instanceof Field) {
                $field->setForm($form);
                if ($field->getChildren()) {
                    static::setForm($field->getChildren(), $form);
                }
            }
        }
    }

    /**
     * @param Field $field
     */
    public function addField(Field $field)
    {
        $field->setForm($field);
        $this->fields[] = $field;
    }
}