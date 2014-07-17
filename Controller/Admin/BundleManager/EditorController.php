<?php

namespace Jarves\Controller\Admin\BundleManager;

use FOS\RestBundle\Request\ParamFetcher;
use Jarves\Configuration\Configs;
use Jarves\ContainerHelperTrait;
use Jarves\Exceptions\BundleNotFoundException;
use Jarves\Exceptions\ModelBuildException;
use Jarves\Configuration\Asset;
use Jarves\Configuration\Assets;
use Jarves\Configuration\Model;
use Jarves\Configuration\Object;
use Jarves\Exceptions\ClassNotFoundException;
use Jarves\Exceptions\FileAlreadyExistException;
use Jarves\Tools;
use Symfony\Component\DependencyInjection\ContainerAware;
use Symfony\Component\Finder\Finder;
use FOS\RestBundle\Controller\Annotations as Rest;
use Symfony\Component\HttpKernel\Bundle\BundleInterface;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;

class EditorController extends ContainerAware
{
    use ContainerHelperTrait;

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Returns the composer config"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".*", strict=true, description="The bundle name")
     *
     * @Rest\Get("/admin/system/bundle/editor/config")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return array
     */
    public function getConfigAction(ParamFetcher $paramFetcher)
    {
        $bundle = $paramFetcher->get('bundle');
        if ($this->getJarves()->getBundleDir($bundle)) {
            $config = $this->getJarves()->getUtils()->getComposerArray($bundle);
            $config['_path'] = $this->getJarves()->getBundleDir($bundle);

            return $config;
        }
    }

    protected function getConfig($bundle)
    {
        $configs = new Configs($this->getJarves());
        $configs->loadBundles([$bundle]);

        return $configs->getConfig($bundle);
    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Saves the composer config"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".*", strict=true, description="The bundle name")
     *
     * @Rest\Post("/admin/system/bundle/editor/config")
     *
     * @param string $bundle
     *
     * @return array
     */
    public function saveConfigAction($bundle)
    {
        if ($this->getJarves()->getBundleDir($bundle)) {
            $config = $this->getJarves()->getUtils()->getComposerArray($bundle);
            $config['_path'] = $this->getJarves()->getBundleDir($bundle);

            return $config;
        }
        return "#todo";
    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Returns the basic configuration. Usually in Resources/config/jarves.xml"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".*", strict=true, description="The bundle name")
     *
     * @Rest\Get("/admin/system/bundle/editor/basic")
     **
     * @param string $bundle
     *
     * @return array
     */
    public function getBasicAction($bundle)
    {
        $config = $this->getJarves()->getConfig($bundle);
        if (!$config) {
            return null;
        }

        $result['streams'] = $config->propertyToArray('streams');
        $result['listeners'] = $config->propertyToArray('listeners');
        $result['events'] = $config->propertyToArray('events');
        $result['caches'] = $config->propertyToArray('caches');
//        $result['falDriver'] = $config->propertyToArray('falDriver');

        $adminAssets = $config->getAdminAssets();
        $assets = [];
        if ($adminAssets) {
            foreach ($adminAssets as $asset) {
                $asset = array_merge(
                    $asset->toArray(),
                    ['type' => 'Jarves\Configuration\Asset' === get_class($asset) ? 'asset' : 'assets']
                );
                $assets[] = $asset;
            }
        }
        $result['adminAssets'] = $assets;

        return $result;
    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Saves the basic configuration. Usually in Resources/config/jarves.xml"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".*", strict=true, description="The bundle name")
     * @Rest\RequestParam(name="events", description="The `events` values array")
     * @Rest\RequestParam(name="listeners", description="The `listeners` values array")
     * @Rest\RequestParam(name="adminAssets", description="The `adminAssets` values array")
     * @Rest\RequestParam(name="falDrivers", description="The `falDrivers` values array")
     *
     * @Rest\Post("/admin/system/bundle/editor/basic")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return bool
     */
    public function setBasicAction(ParamFetcher $paramFetcher)
    {
        $bundle = $paramFetcher->get('bundle');
        $events = $paramFetcher->get('events') ? : null;
        $listeners = $paramFetcher->get('listeners') ? : null;
        $adminAssets = $paramFetcher->get('adminAssets') ? : null;
        $falDrivers = $paramFetcher->get('falDrivers') ? : null;

        $config = $this->getJarves()->getConfig($bundle);
        if (!$config) {
            return null;
        }

        $config->propertyFromArray('events', $events);
        $config->propertyFromArray('listeners', $listeners);

        if ($adminAssets) {
            $items = [];
            foreach ($adminAssets as $item) {
                if ('asset' === strtolower($item['type'])) {
                    $items[] = new Asset($item);
                } else {
                    $items[] = new Assets($item);
                }
            }
            $config->setAdminAssets($items);
        }

        return $config->saveFileBased('events')
        && $config->saveFileBased('listeners')
        && $config->saveFileBased('adminAssets');
    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Returns all php classes that use the window framework class as parents. So in fact, returns
     * all framework window classes."
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".*", strict=true, description="The bundle name")
     *
     * @Rest\Get("/admin/system/bundle/editor/windows")
     *
     * @param ParamFetcher $paramFetcher
     * @throws BundleNotFoundException
     *
     * @return array
     */
    public function getWindowsAction(ParamFetcher $paramFetcher)
    {
        $bundle = $paramFetcher->get('bundle');
        if (!$this->getJarves()->getBundleDir($bundle)) {
            return [];
        }

        $windows = array();

        $bundle = $this->getJarves()->getBundle($oriName = $bundle);
        if (!$bundle) {
            throw new BundleNotFoundException(sprintf('Bundle `%s` not found.', $oriName));
        }
        $path = $bundle->getPath() . '/Controller/';

        if (!file_exists($path)) {
            return [];
        }

        $finder = Finder::create()
            ->in($path)
            ->name('*Controller.php');

        $root = $this->getJarves()->getRoot();

        foreach ($finder as $class) {
            $content = file_get_contents($class->getPathname());

            if (preg_match(
                '/class[\s\t]+([a-zA-Z0-9_]+)[\s\t]/',
                $content,
                $matches
            )
            ) {
                $clazz = $matches[1];
                preg_match('/namespace ([a-zA-Z0-9_\\\\]*)/', $content, $namespace);
                if (isset($namespace[1]) && $namespace[1]) {
                    $clazz = $namespace[1] . '\\' . $clazz;

                    $clazz = '\\' . $clazz;

                    if (class_exists($clazz)) {
                        $reflection = new \ReflectionClass($clazz);
                        if (!$reflection->isAbstract() && $reflection->isSubclassOf('\Jarves\Admin\ObjectCrudInterface')) {
                            $windows[Tools::getRelativePath($class->getPathname(), $root)] = $clazz;
                        }
                    }
                }
            }
        }

        return $windows;
    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Returns all defined plugins. Usually in Resources/config/jarves.plugins.xml"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".*", strict=true, description="The bundle name")
     *
     * @Rest\Get("/admin/system/bundle/editor/plugins")
     *
     * @param ParamFetcher $paramFetcher
     * @return array
     */
    public function getPluginsAction(ParamFetcher $paramFetcher)
    {
        $bundle = $paramFetcher->get('bundle');
        $config = $this->getJarves()->getConfig($bundle);
        if (!$config) {
            return null;
        }

        return $config->getPluginsArray();
    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Saves plugins. Usually in Resources/config/jarves.plugins.xml"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".*", strict=true, description="The bundle name")
     * @Rest\RequestParam(name="plugins", strict=false, description="The `plugins` value array")
     *
     * @Rest\Post("/admin/system/bundle/editor/plugins")
     *
     * @param ParamFetcher $paramFetcher
     * @return bool
     */
    public function savePluginsAction(ParamFetcher $paramFetcher)
    {
        $bundle = $paramFetcher->get('bundle');
        $plugins = $paramFetcher->get('plugins') ? : null;

        $config = $this->getJarves()->getConfig($bundle);
        if (!$config) {
            return null;
        }

        if (is_string($plugins)) {
            $plugins = json_decode($plugins, 1);
        }

        $config->propertyFromArray('plugins', $plugins);

        return $config->saveFileBased('plugins');
    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Returns all defined themes.  Usually in Resources/config/jarves.themes.xml"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".*", strict=true, description="The bundle name")
     *
     * @Rest\Get("/admin/system/bundle/editor/themes")
     *
     * @param ParamFetcher $paramFetcher
     * @return array
     */
    public function getThemesAction(ParamFetcher $paramFetcher)
    {
        $bundle = $paramFetcher->get('bundle');
        $config = $this->getJarves()->getConfig($bundle);
        if (!$config) {
            return null;
        }

        return $config->getThemesArray();
    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Saves themes. Usually in Resources/config/jarves.themes.xml"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".*", strict=true, description="The bundle name")
     * @Rest\RequestParam(name="themes", strict=false, description="The `themes` value array")
     *
     * @Rest\Post("/admin/system/bundle/editor/themes")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return bool
     */
    public function setThemesAction(ParamFetcher $paramFetcher)
    {
        $bundle = $paramFetcher->get('bundle');
        $themes = $paramFetcher->get('themes') ? : null;

        $config = $this->getJarves()->getConfig($bundle);
        if (!$config) {
            return null;
        }

        if (is_string($themes)) {
            $themes = json_decode($themes, 1);
        }

        $config->propertyFromArray('themes', $themes);

        return $config->saveFileBased('themes');
    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Returns the documentation. Usually in Resources/doc/index.md"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".*", strict=true, description="The bundle name")
     *
     * @Rest\Get("/admin/system/bundle/editor/docu")
     *
     * @param ParamFetcher $paramFetcher
     * @return array
     */
    public function getDocuAction(ParamFetcher $paramFetcher)
    {
        $bundle = $paramFetcher->get('bundle');
        $path = $this->getJarves()->getBundleDir($bundle) . 'Resources/doc/index.md';

        $fs = $this->getJarves()->getFileSystem();

        return $fs->read($path);
    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Saves the documentation. Usually in Resources/doc/index.md"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".*", strict=true, description="The bundle name")
     * @Rest\RequestParam(name="content", requirements=".*", strict=true, description="The markdown content")
     *
     * @Rest\Post("/admin/system/bundle/editor/docu")
     *
     * @param ParamFetcher $paramFetcher
     * @return bool
     */
    public function setDocuAction(ParamFetcher $paramFetcher)
    {
        $bundle = $paramFetcher->get('bundle');
        $content = $paramFetcher->get('content');

        $path = $this->getJarves()->getBundleDir($bundle) . 'Resources/doc/index.md';

        $fs = $this->getJarves()->getFileSystem();

        return $fs->read($path, $content);
    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Returns all objects. Usually in Resources/config/jarves.objects.xml"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".*", strict=true, description="The bundle name")
     *
     * @Rest\Get("/admin/system/bundle/editor/objects")
     *
     * @param string $bundle
     * @return array
     */
    public function getObjectsAction($bundle)
    {
        $config = $this->getConfig($bundle);
        if (!$config) {
            throw new BundleNotFoundException(sprintf('Bundle `%s` not found', $bundle));
        }

        return [
            'objects' => $config->getObjectsArray(),
            'attributes' => $config->getObjectAttributesArray()
        ];
    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Saves objects. Usually in Resources/config/jarves.objects.xml"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".*", strict=true, description="The bundle name")
     * @Rest\RequestParam(name="objects", strict=false, description="The `objects` value array")
     * @Rest\RequestParam(name="objectAttributes", strict=false, description="The `objects` value array")
     *
     * @Rest\Post("/admin/system/bundle/editor/objects")
     *
     * @param string $bundle
     * @param array $objects
     * @param array $objectAttributes
     *
     * @return bool
     */
    public function setObjectsAction($bundle, $objects = null, $objectAttributes = null)
    {
        $config = $this->getConfig($bundle);
        if (!$config) {
            throw new BundleNotFoundException(sprintf('Bundle `%s` not found', $bundle));
        }

        if (is_string($objects)) {
            $objects = json_decode($objects, 1);
        }

        $config->propertyFromArray('objects', $objects);
        $config->propertyFromArray('objectAttributes', $objectAttributes);

        return $config->saveFileBased('objects') && $config->saveFileBased('objectAttributes');
    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Returns the content and full path of Propel's Resources/config/models.xml"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".*", strict=true, description="The bundle name")
     *
     * @Rest\Get("/admin/system/bundle/editor/model")
     *
     * @param ParamFetcher $paramFetcher
     * @return array
     */
    public function getModelAction(ParamFetcher $paramFetcher)
    {
        $bundle = $paramFetcher->get('bundle');
        $path = $this->getJarves()->getBundleDir($bundle) . 'Resources/config/jarves.propel.schema.xml';

        return [
            'path' => $path,
            'content' => @file_get_contents($path)
        ];

    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Saves Propel's Resources/config/jarves.propel.schema.xml file"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".*", strict=true, description="The bundle name")
     * @Rest\RequestParam(name="model", requirements=".*", description="Propel's model content (schema.xml)")
     *
     * @Rest\Post("/admin/system/bundle/editor/model")
     *
     * @param ParamFetcher $paramFetcher
     * @return bool
     */
    public function setModelAction(ParamFetcher $paramFetcher)
    {
        $bundle = $paramFetcher->get('bundle');
        $model = $paramFetcher->get('model');

        $path = $this->getJarves()->getBundleDir($bundle) . 'Resources/config/jarves.propel.schema.xml';
        $fs = $this->getFileSystem();

        return $fs->write($path, $model);
    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Builds all model files and updates their model schema"
     * )
     *
     * @Rest\Post("/admin/system/bundle/editor/model/build")
     *
     * @return boolean
     * @throws ModelBuildException
     */
    public function setModelFromObjectsAction()
    {
        $modelBuilder = $this->getJarves()->getModelBuilder();
        $modelBuilder->build();
        return true;
    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Returns entryPoints. Usually in Resources/config/jarves.entryPoints.xml"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".*", strict=true, description="The bundle name")
     *
     * @Rest\Get("/admin/system/bundle/editor/entry-points")
     *
     * @param ParamFetcher $paramFetcher
     * @return array
     */
    public function getEntryPointsAction(ParamFetcher $paramFetcher)
    {
        $bundle = $paramFetcher->get('bundle');
        $config = $this->getJarves()->getConfig($bundle);
        if (!$config) {
            return null;
        }

        $entryPoints = $config->getEntryPointsArray();

        return $entryPoints;
    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Saves entryPoints. Usually in Resources/config/jarves.entryPoints.xml"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".*", strict=true, description="The bundle name")
     * @Rest\RequestParam(name="entryPoints", strict=false, description="The `objects` value array")
     *
     * @Rest\Post("/admin/system/bundle/editor/entry-points")
     *
     * @param ParamFetcher $paramFetcher
     * @return bool
     */
    public function setEntryPointsAction(ParamFetcher $paramFetcher)
    {
        $bundle = $paramFetcher->get('bundle');
        $entryPoints = $paramFetcher->get('entryPoints') ? : null;

        $config = $this->getJarves()->getConfig($bundle);
        if (!$config) {
            return null;
        }

        $config->propertyFromArray('entryPoints', $entryPoints);

        return $config->saveFileBased('entryPoints');
    }

    /**
     * Add a new method.
     *
     * @param string $sourceCode
     * @param string $source
     */
    protected function addMethod(&$sourceCode, $source)
    {
        $sourceCode .= substr($source, 6, -4) . "\n";
    }

    /**
     * Adds a new class property.
     *
     * @param string $sourceCode
     * @param string $name
     * @param string $var
     * @param string $visibility
     * @param bool $static
     */
    protected function addVar(&$sourceCode, $name, $var, $visibility = 'public', $static = false)
    {
        $val = var_export(self::toVar($var), true);

        if (is_array($var)) {
            $val = preg_replace("/' => \n\s+array \(/", "' => array (", $val);
        }

        $sourceCode .=
            "    "
            . $visibility . ($static ? ' static' : '') . ' $' . $name . ' = ' . $val
            . ";\n\n";
    }

    /**
     * @param string $value
     * @return bool|int|string
     */
    protected function toVar($value)
    {
        if ($value == 'true') {
            return true;
        }
        if ($value == 'false') {
            return false;
        }
        if (is_numeric($value)) {
            return $value + 0;
        }

        return $value;
    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Returns the window class properties as array with some additional information about that window class"
     * )
     *
     * @Rest\QueryParam(name="class", requirements=".*", strict=true, description="The php class")
     *
     * @Rest\Get("/admin/system/bundle/editor/window")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return array
     * @throws \Jarves\Exceptions\ClassNotFoundException
     */
    public function getWindowDefinitionAction(ParamFetcher $paramFetcher)
    {
        $class = $paramFetcher->get('class');
        if (substr($class, 0, 1) != '\\') {
            $class = '\\' . $class;
        }

        if (!class_exists($class)) {
            throw new ClassNotFoundException(sprintf('Class %s not found.', $class));
        }

        $reflection = new \ReflectionClass($class);
        $root = realpath($this->getJarves()->getKernel()->getRootDir() . '/../');
        $path = substr($reflection->getFileName(), strlen($root) + 1);

        $content = explode("\n", file_get_contents($reflection->getFileName()));

        $class2Reflection = new \ReflectionClass($class);
        $actualPath = $class2Reflection->getFileName();

        $res = array(
            'class' => $class,
            'file' => $path,
            'actualFile' => $actualPath,
            'properties' => array(
                '__file__' => $path
            )
        );

        $properties = $class2Reflection->getDefaultProperties();
        foreach ($properties as $k => $v) {
            $res['properties'][$k] = $v;
        }

        $parent = $reflection->getParentClass();
        $parentClass = $parent->name;

        $methods = $reflection->getMethods();

        foreach ($methods as $method) {
            if ($method->class == $class) {

                $code = '';
                if ($code) {
                    $code = "    $code\n";
                }
                for ($i = $method->getStartLine() - 1; $i < $method->getEndLine(); $i++) {
                    $code .= $content[$i] . "\n";
                }

                if ($doc = $method->getDocComment()) {
                    $code = "    $doc\n$code";
                }

                $res['methods'][$method->name] = str_replace("\r", '', $code);
            }
        }

        if (@$res['properties']['fields']) {
            foreach ($res['properties']['fields'] as $key => &$field) {
                if ($field instanceof Model) {
                    $field = $field->toArray();
                }
                $this->normalizeField($field, $key, $res);
            }
        }

        $this->extractParentClassInformation($parentClass, $res['parentMethods']);

        unset($res['properties']['_fields']);

        return $res;
    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Saves the php class definition into a php class"
     * )
     *
     * Target path is specified in $general['file'].
     *
     * @Rest\QueryParam(name="class", requirements=".*", strict=true, description="The PHP class name")
     * @Rest\RequestParam(name="list", strict=false, description="The `list` value array")
     * @Rest\RequestParam(name="add", strict=false, description="The `add` value array")
     * @Rest\RequestParam(name="general", strict=false, description="The `general` value array")
     * @Rest\RequestParam(name="methods", strict=false, description="The `methods` value array")
     * @Rest\RequestParam(name="fields", strict=false, description="The `fields` value array")
     *
     * @Rest\Post("/admin/system/bundle/editor/window")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return bool
     */
    public function setWindowDefinitionAction(ParamFetcher $paramFetcher)
    {
        $class = $paramFetcher->get('class');
        $list = $paramFetcher->get('list') ? : null;
        $add = $paramFetcher->get('add') ? : null;
        $general = $paramFetcher->get('general') ? : null;
        $methods = $paramFetcher->get('methods') ? : null;
        $fields = $paramFetcher->get('fields') ? : null;

        if (substr($class, 0, 1) != '\\') {
            $class = '\\' . $class;
        }

        $path = $general['file'];

        $sourcecode = "<?php\n\n";

        $lSlash = strrpos($class, '\\');
        $class2Name = $lSlash !== -1 ? substr($class, $lSlash + 1) : $class;

        $parentClass = '\Jarves\Controller\WindowController';
        $objectDefinition = $this->getJarves()->getObjects()->getDefinition($general['object']);
        if ($objectDefinition->isNested()) {
            $parentClass = '\Jarves\Controller\WindowNestedController';
        }

        $namespace = substr(substr($class, 1), 0, $lSlash);
        if (substr($namespace, -1) == '\\') {
            $namespace = substr($namespace, 0, -1);
        }

        $sourcecode .= "namespace $namespace;\n \n";

        $sourcecode .= 'class ' . $class2Name . ' extends ' . $parentClass . " {\n\n";

        if (count($fields) > 0) {
            $this->addVar($sourcecode, 'fields', $fields);
        }

        if (is_array($list)) {
            foreach ($list as $listVarName => $listVar) {
                $this->addVar($sourcecode, $listVarName, $listVar);
            }
        }

        if (is_array($add)) {
            foreach ($add as $varName => $var) {
                $this->addVar($sourcecode, $varName, $var);
            }
        }

        $blacklist = array('class', 'file');
        if (is_array($general)) {
            foreach ($general as $varName => $var) {
                if (array_search($varName, $blacklist) !== false) {
                    continue;
                }
                $this->addVar($sourcecode, $varName, $var);
            }
        }

        if (is_array($methods)) {
            foreach ($methods as $name => $source) {
                $this->addMethod($sourcecode, $source);
            }
        }

        $sourcecode .= "\n}\n";

        $sourcecode = str_replace("\r", '', $sourcecode);

        $fs = $this->getJarves()->getFileSystem();

        return $fs->write($path, $sourcecode);
    }

    protected function normalizeField(&$field, $key, $res)
    {
        if ('predefined' === @$field['type']) {
            if (!@$field['object']) {
                $field['object'] = @$res['properties']['object'];
            }
            if (!@$field['field']) {
                $field['field'] = $key;
            }
        }

        if (@$field['children'] && is_array($field['children'])) {
            foreach ($field['children'] as $skey => &$sfield) {
                $this->normalizeField($sfield, $skey, $res);
            }
        }
    }

    /**
     * Extracts parent's class information.
     *
     * @internal
     *
     * @param $parentClass
     * @param $methods
     *
     * @throws ClassNotFoundException
     */
    protected function extractParentClassInformation($parentClass, &$methods)
    {
        if (!class_exists($parentClass)) {
            throw new ClassNotFoundException();
        }

        $reflection = new \ReflectionClass($parentClass);
        $root = realpath($this->getJarves()->getKernel()->getRootDir() . '/../');
//        $parentPath = substr($reflection->getFileName(), strlen($root) + 1);

        $parentContent = explode("\n", file_get_contents($reflection->getFileName()));
        $parentReflection = new \ReflectionClass($parentClass);

        $methods2 = $parentReflection->getMethods();
        foreach ($methods2 as $method) {
            if (isset($methods[$method->name])) {
                continue;
            }

            if ($method->class == $parentClass) {

                $code = '';
                $startLine = $method->getStartLine();
                $endLine = $method->getEndLine();
                for ($i = $startLine - 1; $i < $method->getEndLine(); $i++) {

                    $code .= @$parentContent[$i] . "\n";
                    if (strpos(@$parentContent[$i], '{')) {
                        break;
                    }

                }

                if ($doc = $method->getDocComment()) {
                    $code = "    $doc\n$code";
                }

                $methods[$method->name] = str_replace("\r", '', $code);
            }
        }

        $parent = $parentReflection->getParentClass();

        if ($parent) {
            $this->extractParentClassInformation($parent->name, $methods);
        }

    }

    /**
     * @ApiDoc(
     *  section="Bundle Editor",
     *  description="Creates a new CRUD object window class"
     * )
     *
     * @Rest\RequestParam(name="class", requirements=".*", strict=true, description="The PHP class name")
     * @Rest\RequestParam(name="bundle", requirements=".*", strict=true, description="The bundle name")
     * @Rest\RequestParam(name="force", requirements=".*", default="false", description="Overwrites existing")
     *
     * @Rest\Put("/admin/system/bundle/editor/window")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return bool
     * @throws FileAlreadyExistException
     */
    public function createWindowAction(ParamFetcher $paramFetcher)
    {
        $class = $paramFetcher->get('class');
        $bundle = $paramFetcher->get('bundle');
        $force = filter_var($paramFetcher->get('force'), FILTER_VALIDATE_BOOLEAN);

        if (substr($class, 0, 1) != '\\') {
            $class = '\\' . $class;
        }

        if (class_exists($class) && !$force) {
            $reflection = new \ReflectionClass($class);
            throw new FileAlreadyExistException(sprintf('Class already exist in %s', $reflection->getFileName()));
        }

        $actualPath = str_replace('\\', '/', substr($class, 1)) . '.php';
        $actualPath = $this->getJarves()->getBundleDir($bundle) . $actualPath;

        if (file_exists($actualPath) && !$force) {
            throw new FileAlreadyExistException(sprintf('File already exist, %s', $actualPath));
        }

        $sourcecode = "<?php\n\n";
        $bundle = $this->getJarves()->getBundle($bundle);

        $lSlash = strrpos($class, '\\');
        $class2Name = $lSlash !== -1 ? substr($class, $lSlash + 1) : $class;

        $parentClass = '\Jarves\Admin\ObjectCrud';

        $namespace = ucfirst($bundle->getNamespace()) . substr($class, 0, $lSlash);
        if (substr($namespace, -1) == '\\') {
            $namespace = substr($namespace, 0, -1);
        }

        $sourcecode .= "namespace $namespace;\n \n";

        $sourcecode .= 'class ' . $class2Name . ' extends ' . $parentClass . " {\n\n";

        $sourcecode .= "}\n";

        $fs = $this->getJarves()->getFileSystem();

        return $fs->write($actualPath, $sourcecode);
    }

}
