<?php

namespace Jarves\Extractor\Handler;

use Jarves\Jarves;
use Nelmio\ApiDocBundle\Extractor\HandlerInterface;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;
use Symfony\Component\Routing\Route;

class ObjectCrudHandler implements HandlerInterface
{
    /**
     * @var Jarves
     */
    protected $jarves;

    function __construct(Jarves $jarves)
    {
        $this->jarves = $jarves;
    }

    public function handle(ApiDoc $annotation, array $annotations, Route $route, \ReflectionMethod $method)
    {
        if (!($objectName = $route->getDefault('_jarves_object')) || !$object = $this->jarves->getObjects()->getDefinition($objectName)) {
            return;
        }

        if ($entryPointPath = $route->getDefault('_jarves_entry_point')) {
            $adminUtils = new \Jarves\Admin\Utils($this->jarves);
            $entryPoint = $adminUtils->getEntryPoint($entryPointPath);
            $annotation->setSection(
                sprintf(
                    '%s %s %s',
                    $entryPoint->isFrameworkWindow() ? 'Framework Window: ' : '',
                    $entryPoint->getBundle() ? ($entryPoint->getBundle()->getLabel() ?: $entryPoint->getBundle()->getBundleName()) . ', ': 'No Bundle, ',
                    $entryPoint->getLabel() ?: $entryPoint->getPath()
                )
            );
        } else {
            $objectKey = $route->getDefault('_jarves_object_section') ? : $route->getDefault('_jarves_object');
            $objectSection = $this->jarves->getObjects()->getDefinition($objectKey);
            $annotation->setSection(
                sprintf(
                    'Object %s',
                    $objectKey
                )
            );
        }

        $filters = $annotation->getFilters();
        if (@$filters['fields']) {

            $fields = [];
            foreach ($object->getFields() as $field) {
                if ('object' === $field->getId()) {
                    $foreignObject = $this->jarves->getObjects()->getDefinition($field->getObject());
                    foreach ($foreignObject->getFields() as $fField) {
                        $filters[] = $field->getId().'.'.$fField->getId();
                    }
                } else {
                    $fields[] = $field->getId();
                }
            }

            $annotation->addFilter('fields', [
                'requirement' => '.*',
                'description' => "Comma separated list of fields. Possible fields to select: \n" . implode(', ', $fields)
            ]);
        }

        $annotation->setDescription(
            str_replace('%object%', $object->getBundle()->getBundleName() . ':' . lcfirst($object->getId()), $annotation->getDescription())
        );

        $isRelationRoute = $route->getDefault('_jarves_object_relation');
        $requirePk = $route->getDefault('_jarves_object_requirePk');

        $method = explode('::', $route->getDefault('_controller'))[1];

//        maybe in version 1.1
//        if ($isRelationRoute) {
//            $objectKey = $route->getDefault('_jarves_object_section') ? : $route->getDefault('_jarves_object');
//            $objectParent = $this->jarves->getObjects()->getDefinition($objectKey);
//
//            foreach ($objectParent->getFields() as $field) {
//                if ($field->isPrimaryKey()) {
//                    $annotation->addRequirement(
//                        $field->getId(),
//                        [
//                            'requirement' => $field->getRequiredRegex(),
//                            'dataType' => $field->getPhpDataType(),
//                            'description' => '(' . $objectParent->getId() . ') ' . $field->getDesc()
//                        ]
//                    );
//                }
//            }
//        }

        if ($requirePk) {
            foreach ($object->getFields() as $field) {
                if ($field->isPrimaryKey()) {

                    $annotation->addRequirement(
                        ($isRelationRoute ? lcfirst($object->getId()) . '_' : '') . $field->getId(),
                        [
                            'requirement' => $field->getRequiredRegex(),
                            'dataType' => $field->getPhpDataType(),
                            'description' => ($isRelationRoute ? '(' . $object->getId() . ') ' : '') . $field->getDesc()
                        ]
                    );
                }
            }
        }

        //add all fields to some actions
        if (in_array($method, ['addItemAction', 'patchItemAction', 'updateItemAction'])) {
            foreach ($object->getFields() as $field) {
                if ($field->isRequired() && !$field->getDefault()) {
                    $annotation->addRequirement(
                        $field->getId(),
                        array(
                            'requirement' => $field->getRequiredRegex(),
                            'dataType' => $field->getPhpDataType(),
                            'description' => ($isRelationRoute ? '(' . $object->getId() . ') ' : '') . $field->getLabel() . ' ' . $field->getDesc(),
                        )
                    );
                } else {
                    $annotation->addParameter(
                        $field->getId(),
                        array(
                            'format' => $field->getRequiredRegex(),
                            'dataType' => $field->getPhpDataType(),
                            'default' => $field->getDefault(),
                            'description' => $field->getLabel() . ($field->isAutoIncrement() ? ' (autoIncremented)' : ''),
                            'readonly' => false,
                            'required' => false,
                        )
                    );
                }
            }
        }

    }
}