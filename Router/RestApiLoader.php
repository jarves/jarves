<?php

namespace Jarves\Router;

use Jarves\Configuration\Bundle;
use Jarves\Configuration\EntryPoint;
use Jarves\Configuration\Field;
use Jarves\Configuration\Object;
use Jarves\Jarves;
use Jarves\Exceptions\ClassNotFoundException;
use Jarves\Exceptions\ObjectNotFoundException;
use Symfony\Component\Config\Loader\Loader;
use Symfony\Component\Routing\Loader\AnnotationFileLoader;
use Symfony\Component\Routing\RouteCollection;
use Symfony\Component\Routing\Route;

class RestApiLoader extends Loader
{
    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @var RouteCollection
     */
    protected $routes;

    /**
     * @var AnnotationFileLoader
     */
    protected $annotationLoader;

    function __construct($jarves)
    {
        $this->jarves = $jarves;
    }

    public function load($resource, $type = null)
    {
        $this->routes = new RouteCollection();

        $this->importObjectRoutes();
        $this->importWindowRoutes();

        return $this->routes;
    }

    public function setupObjectRouteRequirements($route, Object $object, $withPrefix = false)
    {
        $path = $route instanceof Route ? $route->getPath() : $route;

        if (false !== strpos($path, '{pk}')) {
            $pks = [];


            foreach ($object->getFields() as $field) {
                if ($field->isPrimaryKey()) {
                    $oriPk = $pk = ($withPrefix ? lcfirst($object->getId()) . '_' : '') . $field->getId();
                    $i = 0;

                    while (false !== strpos($path, '{' . $pk . '}')) {
                        $pk = $oriPk . (++$i);
                    }

                    $pks[] = '{' . $pk . '}';

                    if ($route instanceof Route) {
                        $pkColumns = $field->getFieldType()->getColumns();
                        if ($pkColumns) {
                            //we support for now only one column per pk
                            $column = $pkColumns[0];
                            $route->setRequirement($pk, $column->getRequiredRegex());
                        }
                    }
                }
            }
            $path = str_replace('{pk}', implode('/', $pks), $path);

            if ($route instanceof Route) {
                $requirements = $route->getRequirements();
                unset($requirements['pk']);
                $route->setRequirements($requirements);
                $route->setPath($path);
            }

        }

        return $path;
    }

    public function importWindowRoutes()
    {
        foreach ($this->jarves->getBundles() as $bundleName => $bundle) {
            if ($this->jarves->isJarvesBundle($bundleName)) {
                if (!$config = $this->jarves->getConfig($bundleName)) {
                    continue;
                }

                if ($entryPoints = $config->getAllEntryPoints()) {
                    foreach ($entryPoints as $entryPoint) {
                        if ($entryPoint->isFrameworkWindow() && $entryPoint->getClass()) {
                            $this->setupWindowRoute($entryPoint);
                        }
                    }
                }
            }
        }
    }

    public function setupWindowRoute(EntryPoint $entryPoint)
    {
        $class = $entryPoint->getClass();

        if (!class_exists($class)) {
            throw new ClassNotFoundException(sprintf('Class `%s` not found in entryPoint `%s`', $class, $entryPoint->getFullPath()));
        }

        /** @var $importedRoutes \Symfony\Component\Routing\RouteCollection */
        $importedRoutes = $this->import(
            $class,
            'annotation'
        );

        $classReflection = new \ReflectionClass($class);

        $objectKey = $classReflection->getDefaultProperties()['object'];
        $object = $this->jarves->getObjects()->getDefinition($objectKey);

        if (!$object) {
            throw new ObjectNotFoundException(sprintf(
                'Object `%s` in entryPoint `%s` of class `%s` not found.',
                $objectKey,
                $entryPoint->getFullPath(),
                $class
            ));
        }

        $pattern = $entryPoint->getFullPath();

        $this->addEntryPointRoutes($importedRoutes, $pattern, $object);
    }

    public function addEntryPointRoutes(RouteCollection $routes, $pattern, Object $object)
    {
        $objectName = $object->getBundle()->getName() . '/' . lcfirst($object->getId());
//        $routeName = 'jarves_entrypoint_' . str_replace('/', '_', $pattern) . strtolower($object->getBundle()->getName() . '_' . $object->getId());

        /** @var $route \Symfony\Component\Routing\Route */
        foreach ($routes as $name => $route) {

            $method = explode('::', $route->getDefault('_controller'))[1];

            $path = '%jarves_admin_prefix%/' . $pattern . $route->getPath();
            $route->setPath($path);

            $route->setDefault('_jarves_object', $objectName);
            $route->setDefault('_jarves_entry_point', $pattern);
            $this->setupObjectRouteRequirements($route, $object);

            $name = str_replace('/', '_', $pattern . $route->getPath()) . '_' . $method;
            $this->routes->add($name, $route);
        }
    }

    public function importObjectRoutes()
    {
        foreach ($this->jarves->getBundles() as $bundleName => $bundle) {

            if ($this->jarves->isJarvesBundle($bundleName)) {
                if (!$config = $this->jarves->getConfig($bundleName)) {
                    continue;
                }

                if ($objects = $config->getObjects()) {
                    foreach ($objects as $object) {

                        if ($object->getExcludeFromREST()) {
                            continue;
                        }

                        $objectName = $config->getName() . '/' . lcfirst($object->getId());
                        $pattern = '%jarves_admin_prefix%/object/' . $objectName;

                        $this->setupRoutes(
                            $config,
                            $object->getApiController(),
                            $pattern,
                            $object->getKey(),
                            $object
                        );

                        //maybe in v1.1
                        //$this->setupRelationRoutes($pattern, $object);
                    }
                }
            }
        }
    }

    public function setupRelationRoutes($pattern, Object $object)
    {
        $resource = '@JarvesBundle/Controller/AutomaticObjectCrudController.php';
        $resourceNested = '@JarvesBundle/Controller/AutomaticNestedObjectCrudController.php';

        $objectName = $object->getBundle()->getBundleName() . '/' . lcfirst($object->getId());

        $pattern = $pattern . '/{pk}/';

        foreach ($object->getFields() as $field) {
            if ('object' === $field->getType()) {

                $foreignObject = $this->jarves->getObjects()->getDefinition($field->getObject());
                if (!$foreignObject) {
                    continue;
                }

                $this->setupRoutes(
                    $object->getBundle(),
                    $object->getStorageClass() ? : $foreignObject->isNested() ? $resourceNested : $resource,
                    $pattern . lcfirst($field->getObjectRelationName() ? : $field->getId()),
                    $objectName,
                    $foreignObject,
                    $object,
                    $field
                );
            }
        }
    }

    public function setupRoutes(
        Bundle $config,
        $controller,
        $pattern,
        $objectSection,
        Object $object,
        Object $relationObject = null,
        Field $relationField = null
    ) {
        /** @var $importedRoutes \Symfony\Component\Routing\RouteCollection */
        $importedRoutes = $this->import(
            $controller,
            'annotation'
        );

        /** @var $route \Symfony\Component\Routing\Route */
        foreach ($importedRoutes as $name => $route) {

            $method = explode('::', $route->getDefault('_controller'))[1];

            $routePattern = $route->getPath();
            $route->setPath($pattern);
            if ($relationObject) {
                $this->setupObjectRouteRequirements($route, $relationObject, true);
            }

            $path = $route->getPath() . $routePattern;
            $route->setPath($path);
            $route->setDefault('_jarves_object_requirePk', !!strpos($routePattern, '{pk}'));

            $this->setupObjectRouteRequirements($route, $object);

            $route->setDefault('_jarves_object', $object->getKey());
            $route->setDefault('_jarves_object_section', $objectSection);
            $route->setDefault('_jarves_object_relation', $relationField ? $relationField->getId() : false);

            $name = str_replace('/', '_', $pattern . $routePattern) . '_' . $method;
            $name = str_replace(['{', '}'], '', $name);
            $name = str_replace('%jarves_admin_prefix%_', 'jarves_', $name);
            $this->routes->add($name, $route);
        }
    }

    public function supports($resource, $type = null)
    {
        return $type === 'jarves_rest';
    }
} 