<?php

/*
 * This file is part of Jarves cms.
 *
 * (c) Marc J. Schmidt <marc@jarves.io>
 *
 * To get the full copyright and license informations, please view the
 * LICENSE file, that was distributed with this source code.
 *
 */

namespace Jarves;

use Jarves\Configuration\Condition;
use Jarves\Model\Acl as AclObject;
use Jarves\Model\AclQuery;
use Propel\Runtime\ActiveQuery\Criteria;
use Propel\Runtime\Propel;

class ACL
{
    /**
     * targetType
     */
    const GROUP = 1;
    const USER = 0;

    /**
     * mode
     */
    const ALL = 0;
    const LISTING = 1;
    const VIEW = 2;
    const ADD = 3;
    const UPDATE = 4;
    const DELETE = 5;

    /**
     * constraintType
     */
    const CONSTRAINT_ALL = 0;
    const CONSTRAINT_EXACT = 1;
    const CONSTRAINT_CONDITION = 2;

    /**
     * @var array
     */
    protected $cache = array();

    /**
     * @var array
     */
    protected $acls = array();

    /**
     * If we use caching in getRules or not. Useless in testsuits.
     *
     * @var bool
     */
    protected $caching = true;

    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @var Objects
     */
    protected $objects;

    function __construct(Jarves $jarves, Objects $objects)
    {
        $this->jarves = $jarves;
        $this->objects = $objects;
    }

    /**
     * @param Jarves $jarves
     */
    public function setJarves($jarves)
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
     * @param Objects $objects
     */
    public function setObjects($objects)
    {
        $this->objects = $objects;
    }

    /**
     * @return Objects
     */
    public function getObjects()
    {
        return $this->objects;
    }

    /**
     * Activates or disables the caching mechanism.
     *
     * @param $caching
     */
    public function setCaching($caching)
    {
        $this->caching = $caching;
    }

    /**
     * Returns true if caching mechanism is activated.
     *
     * @return bool
     */
    public function getCaching()
    {
        return $this->caching;
    }

    /**
     *
     * Mode table:
     *
     *  0 all
     *  1 list
     *  2 view
     *  3 add
     *  4 update
     *  5 delete
     *
     * @static
     *
     * @param        $objectKey
     * @param  int   $mode
     *
     * @return mixed
     *
     */
    public function &getRules($objectKey, $mode = 1, $targetType = null, $targetId = null)
    {
        $objectKey = Objects::normalizeObjectKey($objectKey);

        $user = false;
        if ($targetType === null && $this->getJarves()->getClient() && $this->getJarves()->getClient()->hasSession()) {
            $user = $this->getJarves()->getClient()->getUser();
            $targetType = ACL::USER;
        }

        if ($targetType === ACL::USER && (($user && $targetId && $user->getId() != $targetId) || !$user)) {
            $user = $this->getJarves()->getUtils()->getPropelCacheObject('Jarves\\Model\\User', $targetId);
        }

        if ($targetType != ACL::USER) {
            $targetType = ACL::GROUP;
        }

        $inGroups = '';
        $userId = '';
        if ($user) {
            $targetId = $userId = $user->getId();
            $inGroups = $user->getGroupIds();
        }

        $cacheKey = '';
        if ($this->getCaching()) {
            $cacheKey = md5($targetType.'.'.$targetId.'.'.$inGroups.'.'.$objectKey . '.' . $mode);
            $cached = $this->getJarves()->getDistributedCache('core/acl-rules/' . $cacheKey);
            if (null !== $cached) {
                return $cached;
            }
        }

        if ($targetType == ACL::GROUP) {
            $inGroups = $targetId + 0;
        }

        if (!$inGroups) {
            $inGroups = '0';
        }

        $mode += 0;

        $data = array($objectKey, $mode);

        $targets = array();

        $targets[] = "( target_type = 1 AND target_id IN (?))";
        $data[] = $inGroups;

        if ($targetType === null || $targetType == ACL::USER) {
            $targets[] = "( target_type = 0 AND target_id = ?)";
            $data[] = $userId;
        }

        $con = Propel::getReadConnection('default');

        $query = "
                SELECT constraint_type, constraint_code, mode, access, sub, fields
                FROM " . $this->getJarves()->getSystemConfig()->getDatabase()->getPrefix(). "system_acl
                WHERE
                object = ? AND
                (mode = ? OR mode = 0) AND
                (
                    " . implode(' OR ', $targets) . "
                )
                ORDER BY prio ASC
        ";

        $stmt = $con->prepare($query);
        $stmt->execute($data);
        $rules = array();

        while ($rule = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            if ($rule['fields'] && substr($rule['fields'], 0, 1) == '{') {
                $rule['fields'] = json_decode($rule['fields'], true);
            }
            if ($rule['constraint_type'] == 2 && substr($rule['constraint_code'], 0, 1) == '[') {
                $rule['constraint_code'] = json_decode($rule['constraint_code'], true);
            }
            $rules[] = $rule;
        }

        if ($this->getCaching()) {
            $this->getJarves()->setDistributedCache('core/acl-rules/' . $cacheKey, $rules);
            return $rules;
        } else {
            return $rules;
        }
    }

    public function removeObjectRules($objectKey)
    {
        $objectKey = Objects::normalizeObjectKey($objectKey);
        $query = AclQuery::create();

        $query->filterByObject($objectKey);
        $query->delete();
    }

    /**
     * Get a condition object for item listings.
     *
     * @param  string $objectKey
     * @param  string $table
     *
     * @return Condition
     */
    public function getListingCondition($objectKey, $table = '')
    {
        $objectKey = Objects::normalizeObjectKey($objectKey);
        $obj = $this->getObjects()->getStorageController($objectKey);
        $rules =& self::getRules($objectKey, static::LISTING);

        if (count($rules) == 0) {
            return null;
        }

        if ($this->getCaching()) {
            $cacheKey = md5($objectKey);
            $cached = $this->getJarves()->getDistributedCache('core/acl-listing/' . $cacheKey);
            if (null !== $cached) {
                return $cached;
            }
        }

        $condition = '';

        $primaryList = $this->getObjects()->getPrimaryList($objectKey);
        $primaryKey = current($primaryList);

        $denyList = array();

        $conditionObject = new Condition(null, $this->getJarves());

        foreach ($rules as $rule) {

            if ($rule['constraint_type'] == '1') {
                //todo $rule['constraint_code'] can be a (urlencoded) composite pk
                //todo constraint_code is always urlencoded;
                $condition = Condition::create(array($primaryKey, '=', Tools::urlDecode($rule['constraint_code'])), $this->getJarves());
            }

            if ($rule['constraint_type'] == '2') {
                $condition = Condition::create($rule['constraint_code'], $this->getJarves());
            }

            if ($rule['constraint_type'] == '0') {
                $condition = array('1', '=', '1');
            } elseif ($rule['sub']) {
                $subCondition = $obj->getNestedSubCondition($condition);
                if ($subCondition) {
                    $condition = array($condition, 'OR', $subCondition);
                }
            }

            if ($rule['access'] == 1) {

                if ($denyList) {
                    $condition = array($condition, 'AND NOT', $denyList);
                    $conditionObject->addOr($condition);
//                    $conditionObject->add('AND NOT', $denyList);
                } else {
                    $conditionObject->addOr($condition);
                }
            }

            if ($rule['access'] != 1) {
                if ($denyList) {
                    $denyList[] = 'AND NOT';
                }

                $denyList[] = $condition;
            }
        }

        if (!$conditionObject->hasRules()){
            $conditionObject->addAnd(array('1', '!=', '1'));
        }

        if ($this->getCaching()) {
            //$this->getJarves()->setDistributedCache('core/acl-listing/' . $cacheKey, $conditionObject);
        }

        return $conditionObject;
    }

    public function checkList(
        $objectKey,
        $targetType = null,
        $targetId = null,
        $rootHasAccess = false
    ) {
        return self::check($objectKey, null, null, self::LISTING, $targetType, $targetId, $rootHasAccess);
    }

    public function checkListExact(
        $objectKey,
        $objectId,
        $targetType = null,
        $targetId = null,
        $rootHasAccess = false
    ) {
        return self::check($objectKey, $objectId, null, self::LISTING, $targetType, $targetId, $rootHasAccess);
    }

    public function checkUpdate(
        $objectKey,
        $fields = null,
        $targetType = null,
        $targetId = null,
        $rootHasAccess = false
    ) {
        return self::check($objectKey, null, $fields, self::UPDATE, $targetType, $targetId, $rootHasAccess);
    }

    public function checkView(
        $objectKey,
        $fields = null,
        $targetType = null,
        $targetId = null,
        $rootHasAccess = false
    ) {
        return self::check($objectKey, null, $fields, self::VIEW, $targetType, $targetId, $rootHasAccess);
    }

    public function checkDelete(
        $objectKey,
        $fields = null,
        $targetType = null,
        $targetId = null,
        $rootHasAccess = false
    ) {
        return self::check($objectKey, null, $fields, self::DELETE, $targetType, $targetId, $rootHasAccess);
    }

    public function checkUpdateExact(
        $objectKey,
        $objectId,
        $fields = null,
        $targetType = null,
        $targetId = null,
        $rootHasAccess = false
    ) {
        return self::check($objectKey, $objectId, $fields, self::UPDATE, $targetType, $targetId, $rootHasAccess);
    }

    public function checkViewExact(
        $objectKey,
        $objectId,
        $fields = null,
        $targetType = null,
        $targetId = null,
        $rootHasAccess = false
    ) {
        return self::check($objectKey, $objectId, $fields, self::VIEW, $targetType, $targetId, $rootHasAccess);
    }

    public function checkDeleteExact(
        $objectKey,
        $objectId,
        $fields = null,
        $targetType = null,
        $targetId = null,
        $rootHasAccess = false
    ) {
        return self::check($objectKey, $objectId, $fields, self::DELETE, $targetType, $targetId, $rootHasAccess);
    }

    /**
     * @param string $objectKey
     * @param array $objectId
     *
     * @return bool
     */
    public function isUpdatable($objectKey, $objectId = null)
    {
        if (null !== $objectId) {
            return $this->checkUpdateExact($objectKey, $objectId);
        } else {
            return $this->checkUpdate($objectKey);
        }
    }

    /**
     * @param string $objectKey
     * @param array $objectId
     *
     * @return bool
     */
    public function isDeletable($objectKey, $objectId = null)
    {
        if (null !== $objectId) {
            return $this->checkDeleteExact($objectKey, $objectId);
        } else {
            return $this->checkDelete($objectKey);
        }
    }

    public function checkAdd(
        $objectKey,
        $objectId,
        $fields = null,
        $targetType = null,
        $targetId = null,
        $rootHasAccess = false
    ) {
        return self::check($objectKey, $objectId, $fields, self::ADD, $targetType, $targetId, $rootHasAccess);
    }

    /*
    public function checkRead($pObjectKey, $pObjectId, $pField = false)
    {
        return self::check($pObjectKey, $pObjectId, $pField, 2);
    }

    public function checkAdd($pObjectKey, $pParentId, $pField = false)
    {
        return self::check($pObjectKey, $pParentId, $pField, 3, false, true);
    }

    public function checkUpdate($pObjectKey, $pObjectId, $pField = false)
    {
        return self::check($pObjectKey, $pObjectId, $pField, 3);
    }
    */

    public function setObjectList(
        $objectKey,
        $targetType,
        $targetId,
        $access,
        $fields = null,
        $withSub = false
    ) {
        return self::setObject(
            self::LISTING,
            $objectKey,
            self::CONSTRAINT_ALL,
            null,
            $withSub,
            $targetType,
            $targetId,
            $access,
            $fields
        );
    }

    public function setObjectListExact(
        $objectKey,
        $objectPk,
        $targetType,
        $targetId,
        $access,
        $fields = null,
        $withSub = false
    ) {
        return self::setObject(
            self::LISTING,
            $objectKey,
            self::CONSTRAINT_EXACT,
            $objectPk,
            $withSub,
            $targetType,
            $targetId,
            $access,
            $fields
        );
    }

    public function setObjectListCondition(
        $objectKey,
        $condition,
        $targetType,
        $targetId,
        $access,
        $fields = null,
        $withSub = false
    ) {
        return self::setObject(
            self::LISTING,
            $objectKey,
            self::CONSTRAINT_CONDITION,
            $condition,
            $withSub,
            $targetType,
            $targetId,
            $access,
            $fields
        );
    }

    public function setObjectUpdate(
        $objectKey,
        $targetType,
        $targetId,
        $access,
        $fields = null,
        $withSub = false
    ) {
        return self::setObject(
            self::UPDATE,
            $objectKey,
            self::CONSTRAINT_ALL,
            null,
            $withSub,
            $targetType,
            $targetId,
            $access,
            $fields
        );
    }

    public function setObject(
        $mode,
        $objectKey,
        $constraintType,
        $constraintCode,
        $withSub = false,
        $targetType,
        $targetId,
        $access,
        $fields = null
    ) {

        $objectKey = Objects::normalizeObjectKey($objectKey);
        $acl = new AclObject();

        $acl->setMode($mode);
        $acl->setTargetType($targetType);
        $acl->setTargetId($targetId);
        $acl->setSub($withSub);
        $acl->setAccess($access);

        if ($fields) {
            $acl->setFields(json_encode($fields));
        }

        $acl->setObject($objectKey);
        $acl->setConstraintCode(is_array($constraintCode) ? json_encode($constraintCode) : $constraintCode);
        $acl->setConstraintType($constraintType);

        $query = new \Jarves\Model\AclQuery();
        $query->select('Prio');
        $query->filterByObject($objectKey);
        $query->filterByMode($mode);
        $query->orderByPrio(Criteria::DESC);
        $highestPrio = $query->findOne();

        $acl->setPrio($highestPrio + 1);

        $this->cache[$objectKey . '_' . $mode] = null;

        $acl->save();
        return $acl;
    }

    /**
     * @param       $objectKey
     * @param       $pObjectId
     * @param  bool $field
     * @param  int  $mode
     * @param  bool $rootHasAccess
     * @param  bool $asParent
     *
     * @return bool
     */
    public function check(
        $objectKey,
        $pk,
        $field = false,
        $mode = 1,
        $targetType = null,
        $targetId = null,
        $rootHasAccess = false,
        $asParent = false
    ) {

        $objectKey = Objects::normalizeObjectKey($objectKey);
        if (($targetId === null && $targetType === null) && $this->getJarves()->isAdmin() && $this->getJarves()->getAdminClient()->hasSession()) {
            $targetId = $this->getJarves()->getAdminClient()->getUserId();
            $targetType = ACL::USER;

        } elseif (($targetId === null && $targetType === null) && $this->getJarves()->getClient() && $this->getJarves()->getClient()->hasSession()) {
            $targetId = $this->getJarves()->getClient()->getUserId();
            $targetType = ACL::USER;
        }

        if ($targetType === null) {
            $targetType = ACL::USER;
        }

        $user = $this->getJarves()->getClient()->getUser();
        if ($user) {
            $groupIds = $user->getGroupIds();
            if (false !== strpos(','.$groupIds.',', ',1,')) {
                return true;
            }
        }

        if (1 === $targetId || null === $targetId) {
            return true;
        }

        $cacheKey = null;
        if ($pk && $this->getCaching()) {
            $pkString = $this->getObjects()->getObjectUrlId($objectKey, $pk);
            $cacheKey = md5($targetType.'.'.$targetId . '.'.$objectKey . '/' . $pkString . '/' . json_encode($field));
            $cached = $this->getJarves()->getDistributedCache('core/acl/'.$cacheKey);
            if (null !== $cached) {
                return $cached;
            }
        }

        $rules = self::getRules($objectKey, $mode, $targetType, $targetId);

        if (count($rules) == 0) {
            return false;
        }

        $access = null;

        $currentObjectPk = $pk;

        $definition = $this->getObjects()->getDefinition($objectKey);

        $not_found = true;
        $parent_acl = $asParent;

        $fCount = null;
        $fKey = null;
        $fValue = null;

        $fIsArray = is_array($field);
        if ($fIsArray) {
            $fCount = count($field);

            $fKey = key($field);
            $fValue = current($field);
            if (is_int($fKey)) {
                $fKey = $fValue;
                $fValue = null;
            }
        }


        $depth = 0;
        $match = false;

        while ($not_found) {
            $currentObjectPkString = $this->getObjects()->getObjectUrlId($objectKey, $currentObjectPk);
            $depth++;

            if ($depth > 50) {
                $not_found = false;
                break;
            }

            foreach ($rules as $acl) {

                if ($parent_acl && $acl['sub'] == 0) {
                    continue;
                }

                $match = false;

                /*
                 * CUSTOM CONSTRAINT
                 */
                if ($acl['constraint_type'] == 2) {
                    $objectItem = $this->getObjects()->get($objectKey, $currentObjectPk);

                    if ($objectItem && $this->getObjects()->satisfy($objectItem, $acl['constraint_code'])) {
                        $match = true;
                    }
                /*
                 * EXACT
                 */
                } else if ($acl['constraint_type'] == 1){
                    if ($currentObjectPk && $acl['constraint_code'] == $currentObjectPkString) {
                        $match = true;
                    }
                /**
                 * ALL
                 */
                } else {
                    $match = true;
                }

                if (!$match && $acl['sub']) {
                    // we need to check if a parent matches this $acl as we have sub=true
                    $parentItem = $this->getObjects()->get($objectKey, $currentObjectPk);
                    $parentCondition = Condition::create($acl['constraint_code']);
                    $parentOptions['fields'] = $parentCondition->extractFields();

                    while ($parentItem = $this->getObjects()->getParent($objectKey, $this->getObjects()->getObjectPk($objectKey, $parentItem), $parentOptions)) {
                        if ($acl['constraint_type'] == 2 && $parentCondition->satisfy($parentItem)) {
                            $match = true;
                            break;
                        } else if ($acl['constraint_type'] == 1 && $acl['constraint_code'] == $this->getObjects()->getObjectUrlId($objectKey, $parentItem)) {
                            $match = true;
                            break;
                        }
                    }
                }

                if ($match) {

                    $field2Key = $field;

                    if ($field) {
                        if ($fIsArray && $fCount == 1) {
                            if (is_string($fKey) && is_array($acl['fields'][$fKey])) {
                                //this field has limits
                                if (($field2Acl = $acl['fields'][$fKey]) !== null) {
                                    if (is_array($field2Acl[0])) {
                                        //complex field rule, $field2Acl = ([{access: no, condition: [['id', '>', 2], ..]}, {}, ..])
                                        foreach ($field2Acl as $fRule) {

                                            $satisfy = false;
                                            if (($f = $definition->getField($fKey)) && $f->getType() == 'object') {
                                                $uri = $f->getObject() . '/' . $fValue;
                                                $satisfy = $this->getObjects()->satisfyFromUrl($uri, $fRule['condition']);
                                            } else if (null !== $fValue){
                                                $satisfy = $this->getObjects()->satisfy($field, $fRule['condition']);
                                            }
                                            if ($satisfy) {
                                                return ($fRule['access'] == 1) ? true : false;
                                            }

                                        }

                                        //if no field rules fits, we consider the whole rule
                                        if ($acl['access'] != 2) {
                                            return ($acl['access'] == 1) ? true : false;
                                        }

                                    } else {
                                        //simple field rule $field2Acl = ({"value1": yes, "value2": no}
                                        if ($field2Acl[$fKey] !== null) {
                                            return ($field2Acl[$fKey] == 1) ? true : false;
                                        } else {
                                            //current($field) is not exactly defined in $field2Acl, so we set $access to $acl['access']
                                            //
                                            //if access = 2 then wo do not know it, cause 2 means 'inherited', so maybe
                                            //a other rule has more detailed rule
                                            if ($acl['access'] != 2) {
                                                $access == ($acl['access'] == 1) ? true : false;
                                                break;
                                            }
                                        }
                                    }
                                }
                            } else {
                                //this field has only true or false
                                $field2Key = $fKey;
                            }
                        }

                        if (!is_array($field2Key)) {
                            if ($acl['fields'] && ($field2Acl = $acl['fields'][$field2Key]) !== null && !is_array(
                                $acl['fields'][$field2Key]
                            )
                            ) {
                                $access = ($field2Acl == 1) ? true : false;
                                break;
                            } else {
                                //$field is not exactly defined, so we set $access to $acl['access']
                                //and maybe a rule with the same code has the field defined
                                // if access = 2 then this rule is only for exactly define fields
                                if ($acl['access'] != 2) {
                                    $access = ($acl['access'] == 1) ? true : false;
                                    break;
                                }
                            }
                        }
                    } else {
                        $access = ($acl['access'] == 1) ? true : false;
                        break;
                    }
                }
            } //foreach

            if (null === $access && $definition->isNested() && $pk) {
                if (null === ($currentObjectPk = $this->getObjects()->getParentPk($objectKey, $currentObjectPk))) {
                    $access = $rootHasAccess ? true : $access;
                    break;
                }

                $parent_acl = true;
            } else {
                break;
            }
        }

        $access = !!$access;

        if ($pk && $this->getCaching()) {
            $this->getJarves()->setDistributedCache('core/acl/'.$cacheKey, $access);
        }

        return $access;
    }

    /**
     *
     * Returns the acl infos for the specified id
     *
     * @param string  $object
     * @param integer $code
     *
     * @return array
     * @internal
     */
    public function &getItem($object, $code)
    {

        self::normalizeCode($code);
        $acls =& self::getRules($object);

        foreach ($acls as $item) {
            $code2 = str_replace('%', '', $item['code']);
            $t = explode('[', $code2);
            $code2 = $t[0];
            self::normalizeCode($code2);
            if ($code2 == $code) {
                return $item;
            }
        }

        return false;
    }

    /*
        public function set($pType, $pTargetType, $pTargetId, $pCode, $pActions, $pWithSub)
        {
            self::normalizeCode($pCode);
            $pType += 0;
            $pTargetType += $pTargetType;
            $pTargetId += $pTargetId;
            $pCode = esc($pCode);

            self::removeAcl($pType, $pTargetType, $pTargetId, $pCode);

            if ($pWithSub)
                $pCode .= '%';

            $pCode = '[' . implode(',', $pActions) . ']';

            $last_id = dbInsert('system_acl', array(
                'type' => $pType,
                'target_type' => $pTargetType,
                'target_id' => $pTargetId,
                'code' => $pCode
            ));

            $this->cache[$pType] = null;

            return $last_id;
        }

        public function remove($pType, $pTargetType, $pTargetId, $pCode)
        {
            self::normalizeCode($pCode);

            $pType += 0;
            $pTargetType += $pTargetType;
            $pTargetId += $pTargetId;
            $pCode = esc($pCode);

            dbDelete('system_acl', "1=1
             AND type = $pType
             AND target_type = $pTargetType
             AND target_id = $pTargetId
             AND code LIKE '$pCode%'");

            $this->cache[$pType] = null;

        }
    */

    public function normalizeCode(&$code)
    {
        $code = str_replace('//', '/', $code);

        if (substr($code, 0, 1) != '/') {
            $code = '/' . $code;
        }

        if (substr($code, -1) == '/') {
            $code = substr($code, 0, -1);
        }

    }

}
