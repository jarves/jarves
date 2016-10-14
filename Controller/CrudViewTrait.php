<?php

namespace Jarves\Controller;

use Jarves\Admin\ObjectCrud;
use Jarves\Configuration\Model;
use Symfony\Component\Yaml\Parser;

trait CrudViewTrait
{
    public function yamlToViewDefinition($path)
    {
        $definitionContent = file_get_contents($path);
        $yaml = new Parser();
        $definition = $yaml->parse($definitionContent);

        $reflection = new \ReflectionClass(ObjectCrud::class);

        return array_merge($reflection->getDefaultProperties(), $definition);
    }

    public function viewPropertiesToArray()
    {
        $vars = [];
        $reflect = new \ReflectionClass($this);
        foreach ($reflect->getProperties() as $property) {
            $vars[] = $property->getName();
        }

        $blacklist = array_flip(array('objectDefinition', 'entryPoint', 'request', 'obj'));
        $result = array();

        foreach ($vars as $var) {
            if (isset($blacklist[$var])) {
                continue;
            }
            $method = 'get' . ucfirst($var);
            if (method_exists($this, $method)) {
                $result[$var] = $this->$method();
            }
        }

        if ($result['fields']) {
            foreach ($result['fields'] as &$field) {
                if ($field instanceof Model) {
                    $field = $field->toArray();
                }
            }
        }

        if ($result['columns']) {
            foreach ($result['columns'] as &$field) {
                if ($field instanceof Model) {
                    $field = $field->toArray();
                }
            }
        }

        if ($result['addMultipleFixedFields']) {
            foreach ($result['addMultipleFixedFields'] as &$field) {
                if ($field instanceof Model) {
                    $field = $field->toArray();
                }
            }
        }

        if ($result['addMultipleFields']) {
            foreach ($result['addMultipleFields'] as &$field) {
                if ($field instanceof Model) {
                    $field = $field->toArray();
                }
            }
        }

        return $result;
    }
}
