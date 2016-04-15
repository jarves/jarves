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

use Jarves\Cache\Cacher;
use Jarves\Configuration\Condition;
use Jarves\Model\Acl as AclObject;
use Jarves\Model\AclQuery;
use Jarves\Model\Base\UserQuery;
use Propel\Runtime\ActiveQuery\Criteria;
use Propel\Runtime\Propel;


class ACL
{
    /**
     * targetType
     */
    const TARGET_TYPE_USER = 0;
    const TARGET_TYPE_GROUP = 1;

    /**
     * mode
     */
    const MODE_ALL = 0;
    const MODE_LISTING = 1;
    const MODE_VIEW = 2;
    const MODE_ADD = 3;
    const MODE_UPDATE = 4;
    const MODE_DELETE = 5;

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

    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * @var Cacher
     */
    private $cacher;

    /**
     * @var ConditionOperator
     */
    private $conditionOperator;

    /**
     * ACL constructor.
     * @param Jarves $jarves
     * @param Objects $objects
     * @param PageStack $pageStack
     * @param Cacher $cacher
     * @param ConditionOperator $conditionOperator
     */
    function __construct(Jarves $jarves, Objects $objects, PageStack $pageStack, Cacher $cacher, ConditionOperator $conditionOperator)
    {
        $this->jarves = $jarves;
        $this->objects = $objects;
        $this->pageStack = $pageStack;
        $this->cacher = $cacher;
        $this->conditionOperator = $conditionOperator;
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
     * @param  int $mode
     *
     * @param integer|null $targetType
     * @param integer|null $targetId
     *
     * @return mixed
     */
    public function getRules($objectKey, $mode = 1, $targetType = ACL::TARGET_TYPE_USER, $targetId = null)
    {
        $objectKey = Objects::normalizeObjectKey($objectKey);

        //normalize input. default is user
        $targetType = ACL::TARGET_TYPE_GROUP === $targetType ? ACL::TARGET_TYPE_GROUP : ACL::TARGET_TYPE_USER;

        $user = null;
        if ($targetType === ACL::TARGET_TYPE_USER) {
            if (!$targetId) {
                $user = $this->pageStack->getUser();
            } else {
                $user = UserQuery::create()->findPk($targetId);
            }
        }

        if (ACL::TARGET_TYPE_USER === $targetType) {
            if ($user) {
                $targetId = $user->getId();
                $inGroups = $user->getGroupIdsArray();
            } else {
                //no user found, so we check against guest
                $targetId = 0;
                $inGroups = [0];
            }
        } else {
            $inGroups = [(string)$targetId];
        }

        $cacheKey = '';
        if ($this->getCaching()) {
            $cacheKey = md5($targetType . '.' . $targetId . '.' . implode(',', $inGroups) . '.' . $objectKey . '.' . $mode);
            $cached = $this->cacher->getDistributedCache('core/acl/rules/' . $cacheKey);
            if (null !== $cached) {
                return $cached;
            }
        }

        $mode += 0;

        $data = array($objectKey, $mode);
        $targets = array();


        //group is always checked. If no user found, $inGroups is 0, which means it checks against Guest group.
        $targets[] = "( target_type = 1 AND target_id IN (?))";
        $data[] = implode(', ', $inGroups);

        if (ACL::TARGET_TYPE_USER === $targetType) {
            //if user type, we include additionally all user rules
            $targets[] = "( target_type = 0 AND target_id = ?)";
            if ($user) {
                $data[] = $user->getId();
            } else {
                //no user found, so we check against guest
                $data[] = 0;
            }
        }

        //now it gets dirty. A bit more complicated query, so we do it directly with PDO.
        $con = Propel::getReadConnection('default');

        $targets = implode(' OR ', $targets);

        $query = "
                SELECT constraint_type, constraint_code, mode, access, sub, fields
                FROM system_acl
                WHERE
                object = ? AND
                (mode = ? OR mode = 0) AND
                (
                    $targets
                )
                ORDER BY prio ASC
        ";

        $stmt = $con->prepare($query);
        $stmt->execute($data);
        $rules = array();

        while ($rule = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $rule['mode'] = (int)$rule['mode'];
            $rule['access'] = (int)$rule['access'];
            $rule['sub'] = (boolean)$rule['sub'];
            $rule['constraint_type'] = (int)$rule['constraint_type'];

            if ($rule['fields'] && substr($rule['fields'], 0, 1) === '{') {
                $rule['fields'] = json_decode($rule['fields'], true);
            }

            if ($rule['constraint_type'] === ACL::CONSTRAINT_CONDITION && substr($rule['constraint_code'], 0, 1) === '[') {
                $rule['constraint_code'] = json_decode($rule['constraint_code'], true);
            }

            $rules[] = $rule;
        }

        if ($this->getCaching()) {
            $this->cacher->setDistributedCache('core/acl/rules/' . $cacheKey, $rules);
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
     *
     * @return Condition
     */
    public function getListingCondition($objectKey)
    {
        $objectKey = Objects::normalizeObjectKey($objectKey);
        $obj = $this->objects->getStorageController($objectKey);
        $rules = self::getRules($objectKey, static::MODE_LISTING);

        if (count($rules) === 0) {
            return null;
        }

        if ($this->getCaching()) {
            $cacheKey = md5($objectKey);
            $cached = $this->cacher->getDistributedCache('core/acl/listing/' . $cacheKey);
            if (null !== $cached) {
                return $cached;
            }
        }

        $condition = '';

        $primaryList = $this->objects->getPrimaryList($objectKey);
        $primaryKey = current($primaryList);

        $denyList = array();

        $conditionObject = new Condition(null, $this->jarves);

        foreach ($rules as $rule) {

            if ($rule['constraint_type'] === ACL::CONSTRAINT_EXACT) {
                //todo $rule['constraint_code'] can be a (urlencoded) composite pk
                //todo constraint_code is always urlencoded;
                $condition = Condition::create(array($primaryKey, '=', Tools::urlDecode($rule['constraint_code'])), $this->jarves);
            }

            if ($rule['constraint_type'] === ACL::CONSTRAINT_CONDITION) {
                $condition = Condition::create($rule['constraint_code'], $this->jarves);
            }

            if ($rule['constraint_type'] === ACL::CONSTRAINT_ALL) {
                $condition = array('1', '=', '1');
            } elseif ($rule['sub']) {
                $subCondition = $obj->getNestedSubCondition($condition);
                if ($subCondition) {
                    $condition = array($condition, 'OR', $subCondition);
                }
            }

            if ($rule['access'] === 1) {

                if ($denyList) {
                    $condition = array($condition, 'AND NOT', $denyList);
                    $conditionObject->addOr($condition);
//                    $conditionObject->add('AND NOT', $denyList);
                } else {
                    $conditionObject->addOr($condition);
                }
            }

            if ($rule['access'] !== 1) {
                if ($denyList) {
                    $denyList[] = 'AND NOT';
                }

                $denyList[] = $condition;
            }
        }

        if (!$conditionObject->hasRules()) {
            $conditionObject->addAnd(array('1', '!=', '1'));
        }

        if ($this->getCaching()) {
            $cacheKey = md5($objectKey);
            $this->cacher->setDistributedCache('core/acl/listing/' . $cacheKey, $conditionObject);
        }

        return $conditionObject;
    }

    /**
     * @param string $objectKey
     * @param array $objectId
     *
     * @return bool
     */
    public function isUpdatable($objectKey, $objectId = null)
    {
        return $this->check(ACLRequest::create($objectKey, $objectId)->onlyUpdateMode());
    }

    /**
     * @param string $objectKey
     * @param array $objectId
     *
     * @return bool
     */
    public function isDeletable($objectKey, $objectId = null)
    {
        return $this->check(ACLRequest::create($objectKey, $objectId)->onlyDeleteMode());
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
    )
    {
        return self::setObject(
            self::MODE_LISTING,
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
    )
    {
        return self::setObject(
            self::MODE_LISTING,
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
    )
    {
        return self::setObject(
            self::MODE_LISTING,
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
    )
    {
        return self::setObject(
            self::MODE_UPDATE,
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
    )
    {

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
        $highestPrio = (int)$query->findOne();

        $acl->setPrio($highestPrio + 1);

        $this->cache[$objectKey . '_' . $mode] = null;

        $acl->save();
        return $acl;
    }

    /**
     * @param ACLRequest $aclRequest
     *
     * @return bool
     */
    public function check(ACLRequest $aclRequest)
    {
        $objectKey = Objects::normalizeObjectKey($aclRequest->getObjectKey());
        $targetType = $aclRequest->getTargetType();
        $targetId = $aclRequest->getTargetId();
        $pk = $aclRequest->getPrimaryKey();
        $field = $aclRequest->getField();

        $pk = $this->objects->normalizePkString($objectKey, $pk);

        if (ACL::TARGET_TYPE_USER === $targetType && null === $targetId) {
            //0 means guest
            $targetId = $this->pageStack->getUser() ? $this->pageStack->getUser()->getId() : 0;
        }

        $user = $this->pageStack->getUser();
        if ($user) {
            $groupIds = $user->getGroupIds();
            if (false !== strpos(',' . $groupIds . ',', ',1,')) {
                //user is in the admin group, so he has always access.
                return true;
            }
        }

        if (ACL::TARGET_TYPE_USER === $targetType && 1 === $targetId) {
            //user admin has always access
            return true;
        }

        if (ACL::TARGET_TYPE_GROUP === $targetType && 1 === $targetId) {
            //group admin has always access
            return true;
        }

        if (0 === $targetId) {
            //guests do always have no access
            return false;
        }

        if (ACL::TARGET_TYPE_GROUP === $targetType && !$targetId) {
            throw new \InvalidArgumentException('For type TARGET_TYPE_GROUP a targetId is required.');
        }

        $cacheKey = null;
        if ($pk && $this->getCaching()) {
            $pkString = $this->objects->getObjectUrlId($objectKey, $pk);
            $cacheKey = md5($targetType . '.' . $targetId . '.' . $objectKey . '/' . $pkString . '/' . json_encode($field));
            $cached = $this->cacher->getDistributedCache('core/acl/' . $cacheKey);
            if (null !== $cached) {
                return $cached;
            }
        }

        $rules = self::getRules($objectKey, $aclRequest->getMode(), $targetType, $targetId);
        if (count($rules) === 0) {
            //no rules found, so we have no access
            return false;
        }

        $access = null;

        $currentObjectPk = $pk;

        $definition = $this->objects->getDefinition($objectKey);

        $not_found = true;

        //starts directly as if we were in the parent checking.
        $parent_acl = $aclRequest->isAsParent();

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

        $originObjectItemPk = $currentObjectPk;

        while ($not_found) {
            $currentObjectPkString = null;
            if ($currentObjectPk) {
                $currentObjectPkString = $this->objects->getObjectUrlId($objectKey, $currentObjectPk);
            }
            $depth++;

            if ($depth > 50) {
                $not_found = false;
                break;
            }

            foreach ($rules as $aclRule) {

                if ($parent_acl && !$aclRule['sub']) {
                    //as soon we enter the parent_acl mode we only take acl rules into consideration
                    //that are also valid for children (sub=true)
                    continue;
                }

                $match = false;

                /*
                 * CUSTOM CONSTRAINT
                 */
                if ($aclRule['constraint_type'] === ACL::CONSTRAINT_CONDITION) {
                    $objectItem = null;

                    if ($originObjectItemPk === $currentObjectPk && null !== $aclRequest->getPrimaryObjectItem()) {
                        $objectItem = $aclRequest->getPrimaryObjectItem();
                    } else if ($originObjectItemPk) {
                        $objectItem = $this->objects->get($objectKey, $currentObjectPk);
                    }

                    if ($objectItem && $this->conditionOperator->satisfy($aclRule['constraint_code'], $objectItem, $objectKey)) {
                        $match = true;
                    }
                    /*
                     * EXACT
                     */
                } else if ($aclRule['constraint_type'] === ACL::CONSTRAINT_EXACT) {
                    if ($currentObjectPk && $aclRule['constraint_code'] === $currentObjectPkString) {
                        $match = true;
                    }
                    /**
                     * ALL
                     */
                } else {
                    $match = true;
                }

                if (!$match && $aclRule['sub'] && $currentObjectPk) {
                    // we need to check if a parent matches this $acl as we have sub=true
                    $parentItem = $this->objects->normalizePkString($objectKey, $currentObjectPk);

                    $parentCondition = Condition::create($aclRule['constraint_code']);
                    $parentOptions['fields'] = $this->conditionOperator->extractFields($parentCondition);

                    while ($parentItem = $this->objects->getParent($objectKey, $this->objects->getObjectPk($objectKey, $parentItem), $parentOptions)) {
                        if ($aclRule['constraint_type'] === ACL::CONSTRAINT_CONDITION && $this->conditionOperator->satisfy($parentCondition, $parentItem)) {
                            $match = true;
                            break;
                        } else if ($aclRule['constraint_type'] === ACL::CONSTRAINT_EXACT && $aclRule['constraint_code'] === $this->objects->getObjectUrlId($objectKey, $parentItem)) {
                            $match = true;
                            break;
                        }
                    }
                }

                if ($match) {
                    //match, check all $field

                    $field2Key = $field;

                    if ($field) {
                        if ($fIsArray && $fCount === 1) {
                            if (is_string($fKey) && is_array($aclRule['fields'][$fKey])) {
                                //this field has limits
                                if (($field2Acl = $aclRule['fields'][$fKey]) !== null) {
                                    if (is_array($field2Acl[0])) {
                                        //complex field rule, $field2Acl = ([{access: no, condition: [['id', '>', 2], ..]}, {}, ..])
                                        foreach ($field2Acl as $fRule) {

                                            $satisfy = false;
                                            if (($f = $definition->getField($fKey)) && $f->getType() === 'object') {
                                                $uri = $f->getObject() . '/' . $fValue;

                                                $uriObject = $this->objects->getFromUrl($uri);
                                                $satisfy = $this->conditionOperator->satisfy($fRule['condition'], $uriObject);
                                            } else if (null !== $fValue) {
                                                $satisfy = $this->conditionOperator->satisfy($fRule['condition'], $field);
                                            }
                                            if ($satisfy) {
                                                return ($fRule['access'] === 1) ? true : false;
                                            }

                                        }

                                        //if no field rules fits, we consider the whole rule
                                        if ($aclRule['access'] !== 2) {
                                            return ($aclRule['access'] === 1) ? true : false;
                                        }

                                    } else {
                                        //simple field rule $field2Acl = ({"value1": yes, "value2": no}
                                        if ($field2Acl[$fKey] !== null) {
                                            return ($field2Acl[$fKey] === 1) ? true : false;
                                        } else {
                                            //current($field) is not exactly defined in $field2Acl, so we set $access to $acl['access']
                                            //
                                            //if access = 2 then wo do not know it, cause 2 means 'inherited', so maybe
                                            //a other rule has more detailed rule
                                            if ($aclRule['access'] !== 2) {
                                                $access = ($aclRule['access'] === 1) ? true : false;
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
                            if ($aclRule['fields'] && ($field2Acl = $aclRule['fields'][$field2Key]) !== null && !is_array(
                                    $aclRule['fields'][$field2Key]
                                )
                            ) {
                                $access = ($field2Acl === 1) ? true : false;
                                break;
                            } else {
                                //$field is not exactly defined, so we set $access to $acl['access']
                                //and maybe a rule with the same code has the field defined
                                // if access = 2 then this rule is only for exactly define fields
                                if ($aclRule['access'] !== 2) {
                                    $access = ($aclRule['access'] === 1) ? true : false;
                                    break;
                                }
                            }
                        }
                    } else {
                        $access = ($aclRule['access'] === 1) ? true : false;
                        break;
                    }
                }
            } //foreach

            if (null === $access && $definition->isNested() && $pk) {
                //$access has not defined yet (no rule matched yet). Check if nested and $pk is given
                //load its root and check again

                if (null === ($currentObjectPk = $this->objects->getParentPk($objectKey, $currentObjectPk))) {
                    $access = $aclRequest->isRootHasAccess() ? true : $access;
                    break;
                }

                $parent_acl = true;
            } else {
                break;
            }
        }

        $access = (boolean)$access;

        if ($pk && $this->getCaching()) {
            $this->cacher->setDistributedCache('core/acl/' . $cacheKey, $access);
        }

        return $access;
    }

    /**
     *
     * Returns the acl infos for the specified id
     *
     * @param string $object
     * @param integer $code
     *
     * @return array
     * @internal
     */
    public function &getItem($object, $code)
    {

        self::normalizeCode($code);
        $acls = self::getRules($object);

        foreach ($acls as $item) {
            $code2 = str_replace('%', '', $item['code']);
            $t = explode('[', $code2);
            $code2 = $t[0];
            self::normalizeCode($code2);
            if ($code2 === $code) {
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

        if (substr($code, 0, 1) !== '/') {
            $code = '/' . $code;
        }

        if (substr($code, -1) === '/') {
            $code = substr($code, 0, -1);
        }

    }

}
