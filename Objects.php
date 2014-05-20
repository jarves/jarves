<?php

namespace Jarves;

use Jarves\Admin\ObjectCrud;
use Jarves\Configuration\Condition;
use Jarves\Exceptions\AccessDeniedException;
use Jarves\Exceptions\BundleNotFoundException;
use Jarves\Exceptions\InvalidArgumentException;
use Jarves\Exceptions\ObjectNotFoundException;
use Symfony\Component\DependencyInjection\ContainerAwareInterface;
use Symfony\Component\EventDispatcher\GenericEvent;
use Symfony\Component\HttpFoundation\Request;

class Objects
{
    /**
     * Array of instances of the object classes
     *
     * @var array
     */
    public $instances = array();

    /**
     * @var Jarves
     */
    protected $jarves;

    function __construct($jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @param Jarves $jarves
     */
    public function setJarves(Jarves $jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @return Jarves
     */
    public function getJarves()
    {
        return $this->jarves;
    }

    

    /**
     * Translates the internal url to the real path.
     *
     * Example: getUrl('file://45') => '/myImageFolder/Picture1.png'
     *          getUrl('news://4') => '/newspage/detail/my-news-title'
     *          getUrl('user://1') => '/userdetail/admini-strator'
     *
     * @link http://docu.jarves.io/developer/extensions/internal-url
     *
     * Can return additionally 'http(s)://myDomain/' at the beginning if the target
     * is on a different domain.
     *
     * @static
     *
     * @param string $internalUrl
     *
     * @return string|bool
     */
    public function getUrl($internalUrl)
    {
        $pos = strpos($internalUrl, '://');
        $objectIds = substr($internalUrl, 0, $pos);
        $params = explode('/', substr($internalUrl, $pos + 2));

        $objectDefinition = $this->getDefinition($objectIds);
        if (!$objectDefinition) {
            return false;
        }

        if (method_exists($objectDefinition['_extension'], $objectDefinition['urlGetter'])) {
            return call_user_func(array($objectDefinition['_extension'], $objectDefinition['urlGetter']), $params);

        } else {
            return false;
        }
    }

    /**
     * Clears the instances cache.
     *
     */
    public function cleanup()
    {
        $this->instances = array();
    }

    /**
     * Parse the internal object url scheme and return the information as array.
     *
     * Pattern:
     *    object://<object_key>[/<primay_values_url_encoded-1>][/<primay_values_url_encoded-n>][/?<options_as_querystring>]
     *
     * Examples:
     *
     * 1. object://news/1
     *   => returns the object news with primary value equal 1
     *
     * 2. object://news/id=1
     *   => equal as 1.
     *
     * 3. object://news/1/2
     *   => returns a list of the objects with primary value equal 1 or 2
     *
     * 4. object://news/id=1/id=2
     *   => equal as 3.
     *
     * 5. object://object_with_multiple_primary/2,54
     *   => returns the object with the first primary field equal 2 and second primary field equal 54
     *
     * 6. object://object_with_multiple_primary/2,54/34,55
     *   => returns a list of the objects
     *
     * 7. object://object_with_multiple_primary/id=2,parent_id=54/id=34,parent_id=55
     *   => equal as 6 if the first defined primary is 'id' and the second 'parent_id'
     *
     * 8. object://news/1?fields=title
     *   => equal as 1. but returns only the field title
     *
     * 9. object://news/1?fields=title,category_id
     *   => equal as 1. but returns only the field title and category_id
     *
     * 10. object://news?fields=title
     *   => returns all objects from type news
     *
     * 11. object://news?fields=title&limit=5
     *   => returns first 5 objects from type news
     *
     *
     * @static
     *
     * @param  string $internalUrl
     *
     * @return array  [object_key, object_id/s, queryParams]
     */
    public function parseUrl($internalUrl)
    {
        $internalUrl = trim($internalUrl);

        $list = false;

        $catch = 'object://';
        if (substr(strtolower($internalUrl), 0, strlen($catch)) == $catch) {
            $internalUrl = substr($internalUrl, strlen($catch));
        }

        $catch = 'objects://';
        if (substr(strtolower($internalUrl), 0, strlen($catch)) == $catch) {
            $list = true;
            $internalUrl = substr($internalUrl, strlen($catch));
        }

        $firstSlashPos = strpos($internalUrl, '/');
        $questionPos = strpos($internalUrl, '?');

        if ($firstSlashPos === false && $questionPos === false) {
            return array(
                $internalUrl,
                false,
                array(),
                $list
            );
        }

        if ($firstSlashPos === false && $questionPos != false) {
            $objectKey = substr($internalUrl, 0, $questionPos);
        } else {
            $objectKey = $this->getObjectKey($internalUrl);
        }

        if (strpos($objectKey, '%')) {
            $objectKey = Tools::urlDecode($objectKey);
        }

        if (!$objectKey) {
            throw new \LogicException(sprintf('The url `%s` does not contain a object key.', $internalUrl));
        }

        $params = array();

        if ($questionPos !== false) {
            parse_str(substr($internalUrl, $questionPos + 1), $params);

            if ($firstSlashPos !== false) {
                $objectIds = substr($internalUrl, $firstSlashPos + 1, $questionPos - ($firstSlashPos + 1));
            }

        } else {
            $objectIds = substr($internalUrl, strlen($objectKey) + 1);
        }

        $objectIds = $this->parsePk($objectKey, $objectIds);

        if ($params && isset($params['condition'])) {
            $params['condition'] = json_decode($params['condition'], true);
        }

        return array(
            $objectKey,
            (!$objectIds) ? false : $objectIds,
            $params,
            $list
        );
    }

    /**
     * Get object's definition.
     *
     * @param  string $objectKey `Core\Language` or `Core.Language`.
     *
     * @return Configuration\Object|null
     */
    public function getDefinition($objectKey)
    {
        $objectKey = Objects::normalizeObjectKey($objectKey);
        $temp = explode('/', $objectKey);
        if (2 !== count($temp)) {
            return null;
        }
        $bundleName = $temp[0];
        $name = $temp[1];

        $config = $this->getJarves()->getConfig($bundleName);

        if ($config) {
            return $config->getObject($name);
        }
    }

    /**
     * Cuts of the namespace/module name of a object key.
     *
     * jarves/node => Node.
     *
     * @param  string $objectKey
     *
     * @return string
     */
    public function getName($objectKey)
    {
        $objectKey = Objects::normalizeObjectKey($objectKey);
        $temp = explode('/', $objectKey);
        $config = $this->getJarves()->getConfig($temp[0]);

        if ($config && ($object = $config->getObject($temp[1]))) {
            return $object->getId();
        }
    }

    /**
     * Cuts of the object name of the object key.
     *
     * jarves/node => JarvesBundle.
     *
     * @param $objectKey
     * @return null|string
     */
    public function getBundleName($objectKey) {
        $objectKey = Objects::normalizeObjectKey($objectKey);
        $temp = explode('/', $objectKey);
        $config = $this->getJarves()->getConfig($temp[0]);

        return $config ? $config->getBundleName() : null;
    }

    /**
     * Returns the namespace of the bundle of the object key.
     *
     * JarvesBundle/node => JarvesBundle.
     * bundleWithNameSpace/myObject => Bundle\With\Namespace.
     *
     * @param  string $objectKey
     *
     * @return string
     */
    public function getNamespace($objectKey)
    {
        $objectKey = Objects::normalizeObjectKey($objectKey);
        $temp = explode('/', $objectKey);
        $config = $this->getJarves()->getConfig($temp[0]);

        return $config ? $config->getBundleClass()->getNamespace() : null;
    }

    /**
     * Returns true of the object is nested.
     *
     * @param  string $objectKey
     * @throws Exceptions\ObjectNotFoundException when object is not found
     *
     * @return boolean
     */
    public function isNested($objectKey)
    {
        $definition = $this->getDefinition($objectKey);
        if (!$definition) {
            throw new ObjectNotFoundException(sprintf('Object %s not found', $objectKey));
        }
        return $definition->isNested();
    }

    /**
     * Returns the table name behind a object.
     * Not all objects has a table. If the object is based on propel's orm, then it has one.
     *
     * @param  string $objectKey
     *
     * @return string
     */
    public function getTable($objectKey)
    {
        static $tableName;
        if ($tableName && $tableName[$objectKey]) {
            return $this->getJarves()->getSystemConfig()->getDatabase()->getPrefix() . $tableName[$objectKey];
        }
        $def = $this->getDefinition($objectKey);
        $tableName[$objectKey] = $def['table'];

        return $this->getJarves()->getSystemConfig()->getDatabase()->getPrefix() . $tableName[$objectKey];
    }

    /**
     * Converts the primary key statement of a url to normalized structure.
     * Generates a array for the usage of Core\Object:get()
     *
     * 1,2,3 => array( array(id =>1),array(id =>2),array(id =>3) )
     * 1 => array(array(id => 1))
     * idFooBar => array( id => "idFooBar")
     * idFoo-Bar => array(array(id => idFoo, id2 => "Bar"))
     * 1-45, 2-45 => array(array(id => 1, pid = 45), array(id => 2, pid=>45))
     *
     *
     * @static
     *
     * @param  string $objectKey
     * @param  string $primaryKey
     *
     * @return array|mixed
     */
    public function parsePk($objectKey, $primaryKey)
    {
        $obj = $this->getStorageController($objectKey);

        $objectIds = $obj->primaryStringToArray($primaryKey);

        return $objectIds;
    }

    /**
     * Returns the object key (not id) from an object url.
     *
     * @param  string $url
     *
     * @return string
     */
    public function getObjectKey($url)
    {
        if (0 === strpos($url, 'object://')){
            $url = substr($url, strlen('object://'));
        }

        $idx = strpos($url, '/');

        if (false === $idx) {
            return false;
        }

        $idx = $idx + strpos(substr($url, $idx + 1), '/');

        return static::normalizeObjectKey(substr($url, 0, $idx + 1));
    }

    /**
     * Return only the primary keys of pItem as object.
     *
     * @param  string $objectKey
     * @param  array  $item
     *
     * @return string
     */
    public function getObjectPk($objectKey, $item)
    {
        $pks = $this->getPrimaryList($objectKey);
        $result = array();
        foreach ($pks as $pk) {
            if (@$item[$pk] !== null) {
                $result[$pk] = $item[$pk];
            }
        }

        return $result;
    }

    /**
     * This just cut off object://<objectName>/ and returns the primary key part as plain text.
     *
     * @param  string $url
     *
     * @return string
     */
    public function getCroppedObjectId($url)
    {
        if (strpos($url, 'object://') === 0) {
            $url = substr($url, 9);
        }

        $idx = strpos($url, '/'); //cut of bundleName
        $url = -1 === $idx ? $url : substr($url, $idx +1 );

        $idx = strpos($url, '/'); //cut of objectName
        $url = -1 === $idx ? $url : substr($url, $idx +1 );

        return $url;
    }

    /**
     * Returns the id of an object item for the usage in urls (internal url's) - urlencoded.
     *
     * @param  string $objectKey
     * @param  array  $pk
     *
     * @return string
     * @throws \InvalidArgumentException
     */
    public function getObjectUrlId($objectKey, $pk)
    {
        $pk = $this->normalizePk($objectKey, $pk);
        $pks = $this->getPrimaryList($objectKey);

        if (count($pks) == 0) {
            throw new \InvalidArgumentException($objectKey . ' does not have primary keys.');
        }

        $withFieldNames = !is_numeric(key($pk));

        if (count($pks) == 1 && is_array($pk)) {
            return Tools::urlEncode($pk[$withFieldNames ? $pks[0] : 0]);
        } else {
            $c = 0;
            $urlId = array();
            foreach ($pks as $pk2) {
                $urlId[] = Tools::urlEncode($pk[$withFieldNames ? $pk2 : $c]);
                $c++;
            }

            return implode(',', $urlId);
        }
    }

    /**
     * Checks if a field in a object exists.
     *
     * @param  string $objectKey
     * @param  string $field
     *
     * @return bool
     */
    public function checkField($objectKey, $field)
    {
        $definition = $this->getDefinition($objectKey);
        if (!$definition->getField($field)) {
            return false;
        }
        return true;
    }

    /**
     * Converts given object key and the object item to the internal url.
     *
     * @static
     *
     * @param  string $objectKey
     * @param  mixed  $primaryValues
     *
     * @return string
     */
    public function toUrl($objectKey, $primaryValues)
    {
        $url = 'object://' . $objectKey . '/';
        if (is_array($primaryValues)) {
            foreach ($primaryValues as $key => $val) {
                $url .= Tools::urlEncode($val) . ',';
            }
        } else {
            return $url . Tools::urlEncode($primaryValues);
        }

        return substr($url, 0, -1);
    }

    /**
     * Returns the object for the given url. Same arguments as in jarvesObjects::get() but given by a string.
     *
     * Take a look at the jarvesObjects::parseUrl() method for more information.
     *
     * @static
     *
     * @param $internalUrl
     *
     * @return object
     */
    public function getFromUrl($internalUrl)
    {
        list($objectKey, $objectIds, $params, $asList) = $this->parseUrl($internalUrl);

        return $asList ? $this->getList($objectKey, $objectIds, $params) : $this->get($objectKey, $objectIds, $params);
    }


    /**
     * Returns the single row of a object.
     * $options is a array which can contain following options. All options are optional.
     *
     *  'fields'          Limit the columns selection. Use a array or a comma separated list (like in SQL SELECT)
     *                    If empty all columns will be selected.
     *  'offset'          Offset of the result set (in SQL OFFSET)
     *  'limit'           Limits the result set (in SQL LIMIT)
     *  'order'           The column to order. Example:
     *                    array(
     *                      array('field' => 'category', 'direction' => 'asc'),
     *                      array('field' => 'title',    'direction' => 'asc')
     *                    )
     *
     *  'foreignKeys'     Define which column should be resolved. If empty all columns will be resolved.
     *                    Use a array or a comma separated list (like in SQL SELECT)
     *
     *  'permissionCheck' Defines whether we check against the ACL or not. true or false. default false
     *
     * @static
     *
     * @param  string $objectKey
     * @param  mixed  $pk
     * @param  array  $options
     *
     * @return array|null
     */
    public function get($objectKey, $pk, $options = array())
    {
        $controller = $this->getController($objectKey, $options);

        return $controller->getItem($pk);
    }

    /**
     * Returns the list of objects.
     *
     *
     * $options is a array which can contain following options. All options are optional.
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
     * @static
     *
     * @param string    $objectKey
     * @param array|Condition $condition
     * @param array     $options
     *
     * @return array|bool
     */
    public function getList($objectKey, $condition = null, $options = array())
    {
        $controller = $this->getController($objectKey, $options);

        return $controller->getItems($condition);
    }

    /**
     * Returns the class object for $objectKey
     *
     * @param string $objectKey
     *
     * @return \Jarves\ORM\ORMAbstract
     * @throws ObjectNotFoundException
     * @throws \Exception
     */
    public function getStorageController($objectKey)
    {
        if (!isset($this->instances[$objectKey])) {
            $definition = $this->getDefinition($objectKey);

            if (!$definition) {
                throw new ObjectNotFoundException(sprintf('Object `%s` not found.', $objectKey));
            }

            if ('custom' === $definition->getDataModel()) {
                if (!class_exists($className = $definition['class'])) {
                    throw new \Exception(sprintf('Class for %s (%s) not found.', $objectKey, $definition['class']));
                }

                $this->instances[$objectKey] = new $className($objectKey, $definition, $this->getJarves());
            } else {
                $clazz = sprintf('\\Jarves\\ORM\\%s', ucfirst($definition->getDataModel()));
                if (class_exists($clazz) || class_exists($clazz = $definition->getDataModel())) {
                    $this->instances[$objectKey] = new $clazz($this->normalizeObjectKey($objectKey), $definition, $this->getJarves());
                }
            }
        }

        return $this->instances[$objectKey];
    }

    /**
     * Counts the items of $internalUrl
     *
     * @param $internalUrl
     *
     * @return array
     */
    public function getCountFromUrl($internalUrl)
    {
        list($objectKey, , $params) = $this->parseUrl($internalUrl);

        return $this->getCount($objectKey, $params['condition']);
    }


    /**
     * Removes all items.
     *
     * @param string $objectKey
     */
    public function clear($objectKey)
    {
        $obj = $this->getStorageController($objectKey);

        return $obj->clear();
    }

    /**
     * Counts the items of $objectKey filtered by $condition
     *
     * @param  string $objectKey
     * @param  array  $condition
     * @param  array  $options
     *
     * @return array
     */
    public function getCount($objectKey, $condition = null, array $options = array())
    {
        $controller = $this->getController($objectKey);

        if (isset($options['permissionCheck'])) {
            $controller->setPermissionCheck($options['permissionCheck']);
        }

        return $controller->getCount($condition, @$options['query']);
    }

    /**
     * Counts the items of $objectKey filtered by $condition
     *
     * @param  string $objectKey
     * @param  mixed  $pk
     * @param  array  $condition
     * @param  mixed  $scope
     * @param  array  $options
     *
     * @return array
     */
    public function getBranchChildrenCount(
        $objectKey,
        $pk = null,
        $condition = null,
        $scope = null,
        array $options = array()
    ) {

        $controller = $this->getController($objectKey);
        if (isset($options['permissionCheck'])) {
            $controller->setPermissionCheck($options['permissionCheck']);
        }

        return $controller->getBranchChildrenCount($pk, $scope, $condition);
    }

    /**
     * Adds a item.
     *
     * @param string $objectKey
     * @param array  $values
     * @param mixed  $targetPk              Full PK as array or as primary key string (url).
     * @param string $position        If nested set. `first` (child), `last` (last child), `prev` (sibling), `next` (sibling)
     * @param bool   $targetObjectKey If this object key differs from $objectKey then we'll use $pk as `scope`. Also
     *                                 it is then only possible to have position `first` and `last`.
     * @param  array $options
     *
     * @return mixed
     *
     * @throws \NoFieldWritePermission
     * @throws \Jarves\Exceptions\InvalidArgumentException
     */
    public function add(
        $objectKey,
        $values,
        $targetPk = null,
        $position = 'first',
        $targetObjectKey = null,
        array $options = array()
    ) {

        $targetPk = $this->normalizePk($objectKey, $targetPk);
        $objectKey = Objects::normalizeObjectKey($objectKey);
        if ($targetObjectKey) {
            $targetObjectKey = Objects::normalizeObjectKey($targetObjectKey);
        }

        $controller = $this->getController($objectKey, $options);

        return $controller->add($values, $targetPk, $position, $targetObjectKey);
    }

    /**
     * @param string $objectKey
     * @param array $options
     * @return ObjectCrud
     */
    public function getController($objectKey, array $options = array())
    {
        $definition = $this->getDefinition($objectKey);
        if ($controllerId = $definition->getController()) {
            if (class_exists($controllerId)) {
                $controller = new $controllerId();
            } else {
                $controller = $this->getJarves()->getContainer()->get($controllerId);
            }
        } else {
            $controller = new ObjectCrud();
        }

        if ($controller instanceof ContainerAwareInterface) {
            $controller->setContainer($this->getJarves()->getContainer());
        }

        $controller->setPermissionCheck(false);
        if (isset($options['permissionCheck'])) {
            $controller->setPermissionCheck($options['permissionCheck']);
        }

        $controller->setWithNewsFeed(false);
        if (isset($options['newsFeed'])) {
            $controller->setWithNewsFeed($options['newsFeed']);
        }

        if (isset($options['fields'])) {
            $controller->setExtraSelection($options['fields']);
        }

        $controller->setObject($objectKey);
        $controller->initialize();

        return $controller;
    }

    /**
     * Updates a item per url.
     *
     * @param  string $objectUrl
     * @param  array  $values
     *
     * @return bool
     */
    public function updateFromUrl($objectUrl, $values)
    {
        list($objectKey, $objectIds, $params) = $this->parseUrl($objectUrl);

        return $this->update($objectKey, $objectIds[0], $values, $params);
    }

    /**
     * Updates a object entry. This means, all fields which are not defined will be saved as NULL.
     *
     * @param  string $objectKey
     * @param  mixed  $pk
     * @param  array  $values
     * @param  array  $options
     *
     * @return bool
     */
    public function update($objectKey, $pk, $values, array $options = array())
    {
        $controller = $this->getController($objectKey, $options);

        return $controller->update($pk, $values);
    }

    /**
     * Patches a object entry. This means, only defined fields will be saved. Fields which are not defined will
     * not be overwritten.
     *
     * @param  string $objectKey
     * @param  mixed  $pk
     * @param  array  $values
     * @param  array  $options
     *
     * @return bool
     */
    public function patch($objectKey, $pk, $values, array $options = array())
    {
        $controller = $this->getController($objectKey, $options);

        return $controller->patch($pk, $values);
    }


    /**
     * Removes a object item per url.
     *
     * @param  string $objectUrl
     *
     * @return bool
     */
    public function removeFromUrl($objectUrl, array $options = array())
    {
        list($objectKey, $objectIds, ) = $this->parseUrl($objectUrl);

        return $this->remove($objectKey, $objectIds[0], $options);
    }

    /**
     * Removes a object item.
     *
     * @param  string $objectKey
     * @param  mixed  $pk
     * @param  array  $options
     *
     * @return boolean
     */
    public function remove($objectKey, $pk, array $options = array())
    {
        $controller = $this->getController($objectKey, $options);

        return $controller->remove($pk);
    }

    /*
    public function removeUsages($pObjectUrl)
    {
    }

    public function removeUsage($pObjectUrl, $pUseObjectId)
    {
    }

    public function addUsage($pObjectUrl, $pUseObjectId)
    {
    }
    */


    /**
     * Returns a single root item. Only for nested objects.
     *
     * @param  string $objectKey
     * @param  mixed  $scope
     * @param  array  $options
     *
     * @return array
     * @throws \Exception
     */
    public function getRoot($objectKey, $scope, array $options = array())
    {
        $controller = $this->getController($objectKey, $options);

        return $controller->getRoot($scope);
    }

    /**
     * Returns all roots. Only for nested objects.
     *
     * @param  string  $objectKey
     * @param  array   $condition
     * @param  array   $options
     *
     * @return array
     * @throws \Exception
     */
    public function getRoots($objectKey, $condition = null, array $options = array())
    {
        $controller = $this->getController($objectKey, $options);

        return $controller->getRoots($condition);
    }

    /**
     * @static
     *
     * @param        $objectKey
     * @param  mixed $pk
     * @param  array $condition
     * @param  int   $depth
     * @param  mixed $scope
     * @param  array $options
     *
     * @return mixed
     * @throws \Exception
     */
    public function getBranch(
        $objectKey,
        $pk = null,
        $condition = null,
        $depth = 1,
        $scope = null,
        array $options = array()
    ) {

        $controller = $this->getController($objectKey, $options);

        return $controller->getBranchItems($pk, $condition, null, $scope, $depth);

    }

    /**
     * Returns a hash of all primary fields.
     *
     * Returns array('<keyOne>' => <arrayDefinition>, '<keyTwo>' => <arrayDefinition>, ...)
     *
     * @static
     *
     * @param $objectId
     *
     * @return array
     */
    public function getPrimaries($objectId)
    {
        $objectDefinition = $this->getDefinition($objectId);

        $primaryFields = array();
        foreach ($objectDefinition->getFields() as $field) {
            if ($field->isPrimaryKey()) {
                $primaryFields[$field->getId()] = $field;
            }
        }

        return $primaryFields;
    }

    /**
     * Return a list of all primary keys.
     *
     * Returns array('<keyOne>', '<keyTwo>', ...);
     *
     * @static
     *
     * @param $objectId
     *
     * @return array
     */
    public function getPrimaryList($objectId)
    {
        $objectDefinition = $this->getDefinition($objectId);

        $primaryFields = array();
        foreach ($objectDefinition->getFields() as $fieldKey => $field) {
            if ($field->getPrimaryKey()) {
                $primaryFields[] = $fieldKey;
            }
        }

        return $primaryFields;
    }

    /**
     * Returns the parent pk.
     *
     * @param  string $objectKey
     * @param  mixed  $pk
     *
     * @return array
     */
    public function getParentPk($objectKey, $pk)
    {
        $obj = $this->getStorageController($objectKey);
        $pk2 = $obj->normalizePrimaryKey($pk);

        return $obj->getParentId($pk2);
    }

    /**
     * Returns the parent pk from a url.
     *
     * @param  string $objectUrl
     *
     * @return array
     */
    public function getParentPkFromUrl($objectUrl)
    {
        list($objectKey, $objectIds, ) = $this->parseUrl($objectUrl);

        return $this->getParentPk($objectKey, $objectIds[0]);
    }

    /**
     * Returns the parent item per url. Only if the object is nested.
     *
     * @param  string $objectKey
     * @param  mixed  $pk
     * @param  null   $options
     *
     * @return mixed
     */
    public function getParent($objectKey, $pk)
    {
        $controller = $this->getController($objectKey);
        return $controller->getParent($pk);
    }

    /**
     * Returns the parent item. Only if the object is nested.
     *
     * @param  string $objectUrl
     *
     * @return array
     */
    public function getParentFromUrl($objectUrl)
    {
        list($objectKey, $objectIds, ) = $this->parseUrl($objectUrl);

        return $this->getParent($objectKey, $objectIds[0]);
    }

    /**
     * @param  string $objectUrl
     * @param  array  $options
     *
     * @return array
     */
    public function getVersionsFromUrl($objectUrl, $options = null)
    {
        list($objectKey, $objectId) = Objects::parseUrl($objectUrl);

        return $this->getVersions($objectKey, $objectId[0], $options);
    }

    /**
     * @param  string $objectKey
     * @param  mixed  $pk
     * @param  array  $options
     *
     * @todo implement it
     *
     * @return array
     */
    public function getVersions($objectKey, $pk, $options = null)
    {
        $obj = $this->getStorageController($objectKey);
        $pk2 = $obj->normalizePrimaryKey($pk);

        return $obj->getVersions($pk2, $options);
    }

    /**
     * Returns always a array with primary key and value pairs from a single pk.
     *
     * $pk can be
     *  - 24
     *  - array(24)
     *  - array('id' => 24)
     *
     * result:
     *  array(
     *    'id' => 24
     * );
     *
     * @param  string $objectKey
     * @param  mixed  $pk
     *
     * @return array  A single primary key as array. Example: array('id' => 1).
     */
    public function normalizePk($objectKey, $pk)
    {
        $obj = $this->getStorageController($objectKey);

        return $obj->normalizePrimaryKey($pk);
    }

    public static function normalizeObjectKey($key)
    {
        $key = str_replace(['\\', ':', '.'], '/', $key);

        if (false === strpos($key, '/')) {
            return preg_replace('/bundle$/', '', strtolower($key));
        }

        list($bundleName, $objectName) = explode('/', $key);
        $bundleName = preg_replace('/bundle$/', '', strtolower($bundleName));
        $objectName = lcfirst($objectName);
        return $bundleName. '/' . $objectName;
    }

    /**
     * Parses a whole (can be multiple) primary key that is a represented as string and returns the first primary key.
     *
     * Example:
     *
     *  1/2/3 => array( array(id =>1),array(id =>2),array(id =>3) )
     *  1 => array(array(id => 1))
     *  idFooBar => array( id => "idFooBar")
     *  idFoo/Bar => array(array(id => idFoo), array(id2 => "Bar"))
     *  1,45/2,45 => array(array(id => 1, pid = 45), array(id => 2, pid=>45))
     *
     * @param $objectKey
     * @param $pkString
     *
     * @return array Example array('id' => 4)
     */
    public function normalizePkString($objectKey, $pkString)
    {
        if (is_array($pkString)) {
            return $pkString;
        }

        $obj = $this->getStorageController($objectKey);
        $objectIds = $obj->primaryStringToArray($pkString);

        return @$objectIds[0];
    }

    /**
     * Returns all parents, incl. the root object (if root is an object, it returns this object entry as well)
     *
     * @param  string $objectKey
     * @param  mixed  $pk
     * @param  array  $options
     *
     * @return mixed
     */
    public function getParents($objectKey, $pk, $options = null)
    {
        $controller = $this->getController($objectKey);

        if (isset($options['permissionCheck'])) {
            $controller->setPermissionCheck($options['permissionCheck']);
        }

        return $controller->getParents($pk);
    }

    /**
     * Returns all parents per url, incl. the root object (if root is an object, it returns this object entry as well)
     *
     * @param  string $objectUrl
     *
     * @return mixed
     */
    public function getParentsFromUrl($objectUrl)
    {
        list($objectKey, $objectIds, ) = $this->parseUrl($objectUrl);

        return $this->getParents($objectKey, $objectIds[0]);
    }

    /**
     * Moves a item to a new position.
     *
     * @param  string $objectKey
     * @param  array  $pk
     * @param  array  $targetPk
     * @param  string $position        `first` (child), `last` (last child), `prev` (sibling), `next` (sibling)
     * @param  string $targetObjectKey
     * @param  array  $options
     *
     * @return mixed
     */
    public function move(
        $objectKey,
        $pk,
        $targetPk,
        $position = 'first',
        $targetObjectKey = null,
        $options
//        $overwrite = false
    ) {
        $controller = $this->getController($objectKey, $options);

        return $controller->moveItem($pk, $targetPk, $position, $targetObjectKey);
    }

    /**
     * Moves a item around by a url.
     *
     * @param  string $sourceObjectUrl
     * @param  string $targetObjectUrl
     * @param  string $position
     * @param  array  $options
     *
     * @return mixed
     */
    public function moveFromUrl($sourceObjectUrl, $targetObjectUrl, $position = 'first', $options = null)
    {
        list($objectKey, $objectIds, ) = $this->parseUrl($sourceObjectUrl);
        list($targetObjectKey, $targetObjectIds, ) = $this->parseUrl($targetObjectUrl);

        return $this->move($objectKey, $objectIds[0], $targetObjectIds[0], $position, $targetObjectKey, $options);
    }

    /**
     * Checks whether the conditions in $condition are complied with the given object url.
     *
     * @param  string $objectUrl
     * @param  array  $condition
     *
     * @return bool
     */
    public function satisfyFromUrl($objectUrl, $condition)
    {
        $object = $this->getFromUrl($objectUrl);

        return $this->satisfy($object, $condition);

    }

    /**
     * Checks whether the conditions in $condition are complied with the given object item.
     *
     * @static
     *
     * @param array $objectItem
     * @param \Jarves\Configuration\Condition|array $condition
     * @param string $objectKey
     *
     * @return bool
     */
    public function satisfy(&$objectItem, $condition, $objectKey = null)
    {
        if (is_array($condition)) {
            return Condition::create($condition)->satisfy($objectItem, $objectKey);
        } else if($condition instanceof Condition) {
            return $condition->satisfy($objectItem, $objectKey);
        }
    }

    /**
     * Returns the public URL.
     *
     * @param  string $objectKey
     * @param  string $pk
     * @param  array  $pluginProperties
     *
     * @return string
     */
    public function getPublicUrl($objectKey, $pk, $pluginProperties = null)
    {
        $definition = $this->getDefinition($objectKey);

        if ($definition && $callable = $definition->getPublicUrlGenerator()) {
            $pk = $this->normalizePkString($objectKey, $pk);

            return call_user_func_array($callable, array($objectKey, $pk, $pluginProperties));
        }

        return null;

    }

}
