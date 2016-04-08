<?php

namespace Jarves\Admin\Form;

use Jarves\Configuration\Field;
use Jarves\Exceptions\Rest\ValidationFailedException;

class Form
{
    /**
     * @var Field[]
     */
    protected $fields = [];

    /**
     * Form data from a request for example (jarves.Form->getValue)
     *
     * @var array
     */
    protected $data = [];

    /**
     * @param Field[] $fields
     */
    public function __construct(array $fields = null)
    {
        if ($fields) {
            $this->setFields($fields);
        }
    }

    /**
     * @return array
     */
    public function getData()
    {
        return $this->data;
    }

    /**
     * @param array $data
     */
    public function setData($data)
    {
        $this->data = $data;
    }

    /**
     * @param array         $defaultData
     * @param null|string[] $filterFields
     *
     * @return array
     * @throws ValidationFailedException
     */
    public function mapData($defaultData = [], $filterFields = null)
    {
        $data = $this->getData();

        if ($filterFields) {
            $filterFields = array_flip($filterFields);
        }

        $values = [];

        foreach ($this->getFields() as $field) {
            $key = lcfirst($field->getId());

            $value = isset($data[$key]) ? $data[$key] : null;

            if (null === $value && $defaultData) {
                $value = isset($defaultData[$key]) ? $defaultData[$key] : null;
            }

            if ($field['customValue'] && method_exists($this, $method = $field['customValue'])) {
                $value = $this->$method($field, $key);
            }

            $field->setValue($value);
        }

        foreach ($this->getFields() as $field) {
            $key = $field->getId();
            if ($field['noSave']) {
                continue;
            }

            if ($field->getSaveOnlyFilled() && ($field->getValue() === '' || $field->getValue() === null)) {
                continue;
            }

            if ($field->getCustomSave() && method_exists($this, $method = $field->getCustomSave())) {
                $this->$method($values, $values, $field);
                continue;
            }

            if (!$filterFields || isset($filterFields[$key])) {
                if (!$errors = $field->validate()) {
                    $field->mapValues($values);
                } else {
                    $restException = new ValidationFailedException(
                        sprintf(
                            'Field `%s` has a invalid value. [%s]',
                            $key,
                            json_encode($errors)
                        ), 420
                    );
                    $restException->setData(['fields' => [$field->getId() => $errors]]);
                    throw $restException;
                }
            }
        }

        return $values;
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
     * @param string  $key
     *
     * @return Field
     */
    public static function searchField(&$fields, $key)
    {
        foreach ($fields as $field) {
            if ($field->getId() === $key) {
                return $field;
            } else {
                if ($field->getChildren()) {
                    if ($found = static::searchField($field->getChildren(), $key)) {
                        return $found;
                    }
                }
            }
        }
    }

    /**
     * @param array $fields
     * @param Form  $form
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
        $field->setForm($this);
        $this->fields[] = $field;
    }
}