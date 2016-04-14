<?php
/**
 * This file is part of Jarves.
 *
 * (c) Marc J. Schmidt <marc@marcjschmidt.de>
 *
 *     J.A.R.V.E.S - Just A Rather Very Easy [content management] System.
 *
 *     http://jarves.io
 *
 * To get the full copyright and license information, please view the
 * LICENSE file, that was distributed with this source code.
 */

namespace Jarves;

/**
 * Represents a request to the ACL system.
 *
 * $acl->check($request): boolean
 */
class ACLRequest
{
    /**
     * Example: jarves/node
     *
     * @var string
     */
    protected $objectKey;

    /**
     * Example: ['id' => 1]
     *
     * If not defined, rules that have a constraint to a exactly object item are ignored.
     * This includes: Rules that are applied to parent objects and have sub=true and
     * exact rules that are applied to a particular object item. Actually only ACL::CONSTRAINT_ALL
     * are checked then, usually needed for mode==ACL::LISTING
     *
     * String representation as seen in Jarves\Objects::normalizePkString also allowed and will be converted to a real primaryKey array when used.
     *
     * @var array|string|null
     */
    protected $primaryKey = null;

    /**
     * When a primaryKey is given and we have rules based on fields of a object item,
     * the ACL system needs to fetch this item based on $primaryKey. To speed things up
     * and to check against not yet created objects (like during a 'add'-check), you
     * should pass the actual objectItem to this request.
     *
     * @var null|array
     */
    protected $primaryObjectItem = null;

    /**
     * Example: 'title' or ['language' => 'en']
     *
     * @var string|null|array
     */
    protected $field = null;

    /**
     * ACL::MODE_ALL, ACL::MODE_LISTING, ACL::MODE_VIEW, ACL::MODE_ADD, ACL::MODE_UPDATE, ACL::MODE_DELETE
     *
     * @var int
     */
    protected $mode = ACL::MODE_ALL;

    /**
     * ACL::TARGET_TYPE_USER, ACL::TARGET_TYPE_GROUP
     *
     * @var null
     */
    protected $targetType = ACL::TARGET_TYPE_USER;

    /**
     * If $targetType == ACL::TARGET_TYPE_USER then $targetId should be the user id
     * If $targetType == ACL::TARGET_TYPE_GROUP then $targetId should be the group id
     *
     * If not defined current user id from current session is used.
     *
     * @var null|int
     */
    protected $targetId = null;

    /**
     * For nested set, the ACL system iterates through all parents. If no rule applies or all rules
     * are from access=inherited, then this option defines whether ACL::check() returns true or false.
     *
     * @var bool
     */
    protected $rootHasAccess = false;

    /**
     * Defines whether this request should be checked as a parent object. This means, it excludes all
     * rules with sub=0 (rules that do not apply to sub-items/children)
     *
     * @var bool
     */
    protected $asParent = false;

    /**
     * @param string $objectKey
     * @param string|array|null $primaryKey see ACLRequest::$primaryKey
     */
    public function __construct($objectKey, $primaryKey = null)
    {
        if (empty($objectKey)) {
            throw new \InvalidArgumentException('objectKey can not be empty');
        }

        $this->objectKey = $objectKey;
        $this->setPrimaryKey($primaryKey);
    }

    /**
     * @param string $objectKey
     * @param string|array|null $primaryKey see ACLRequest::$primaryKey
     *
     * @return static
     */
    public static function create($objectKey, $primaryKey = null)
    {
        return new static($objectKey, $primaryKey);
    }

    /**
     * @return string
     */
    public function getObjectKey()
    {
        return $this->objectKey;
    }

    /**
     * @param string $objectKey
     *
     * @return $this
     */
    public function setObjectKey($objectKey)
    {
        $this->objectKey = (string)$objectKey;

        return $this;
    }

    /**
     * @return array|null
     */
    public function getPrimaryKey()
    {
        return $this->primaryKey;
    }

    /**
     * @param string|array|null $primaryKey see ACLRequest::$primaryKey
     *
     * @return $this
     */
    public function setPrimaryKey($primaryKey)
    {
        $this->primaryKey = $primaryKey;

        return $this;
    }

    /**
     * @return array|string|null
     */
    public function getPrimaryObjectItem()
    {
        return $this->primaryObjectItem;
    }

    /**
     * @param array|null $primaryObjectItem
     *
     * @return $this
     */
    public function setPrimaryObjectItem(array $primaryObjectItem = null)
    {
        $this->primaryObjectItem = $primaryObjectItem;

        return $this;
    }

    /**
     * @return array|null|string
     */
    public function getField()
    {
        return $this->field;
    }

    /**
     * @param array|null|string $field
     *
     * @return $this
     */
    public function setField($field)
    {
        $this->field = $field;

        return $this;
    }

    /**
     * @return int
     */
    public function getMode()
    {
        return $this->mode;
    }

    /**
     * @param int $mode ACL::MODE_ALL, ACL::MODE_LISTING, ACL::MODE_VIEW, ACL::MODE_ADD, ACL::MODE_UPDATE, ACL::MODE_DELETE
     *
     * @return $this
     */
    public function setMode($mode)
    {
        if ($mode !== ACL::MODE_ALL &&
            $mode !== ACL::MODE_LISTING &&
            $mode !== ACL::MODE_VIEW &&
            $mode !== ACL::MODE_ADD &&
            $mode !== ACL::MODE_UPDATE &&
            $mode !== ACL::MODE_DELETE) {
            throw new \InvalidArgumentException('mode is not valid. ' .
                'Valid: ACL::MODE_ALL, ACL::MODE_LISTING, ACL::MODE_VIEW, ACL::MODE_ADD, ACL::MODE_UPDATE, ACL::MODE_DELETE');
        }

        $this->mode = $mode;

        return $this;
    }

    /**
     * @return $this
     */
    public function onlyListingMode()
    {
        $this->mode = ACL::MODE_LISTING;

        return $this;
    }

    /**
     * @return $this
     */
    public function onlyViewMode()
    {
        $this->mode = ACL::MODE_VIEW;

        return $this;
    }

    /**
     * @return $this
     */
    public function onlyAddMode()
    {
        $this->mode = ACL::MODE_ADD;

        return $this;
    }

    /**
     * @return $this
     */
    public function onlyUpdateMode()
    {
        $this->mode = ACL::MODE_UPDATE;

        return $this;
    }

    /**
     * @return $this
     */
    public function onlyDeleteMode()
    {
        $this->mode = ACL::MODE_DELETE;

        return $this;
    }

    /**
     * @return null
     */
    public function getTargetType()
    {
        return $this->targetType;
    }

    /**
     * @param null $targetType
     *
     * @return $this
     */
    public function setTargetType($targetType)
    {
        if ($targetType !== ACL::TARGET_TYPE_GROUP && $targetType !== ACL::TARGET_TYPE_USER) {
            throw new \InvalidArgumentException('targetType is not valid. Valid: ACL::TARGET_TYPE_GROUP or ACL::TARGET_TYPE_USER');
        }

        $this->targetType = $targetType;

        return $this;
    }

    /**
     * Sets targetId= $groupId and targetType = ACL::TARGET_TYPE_GROUP
     *
     * @param integer $groupId
     *
     * @return $this
     */
    public function targetGroup($groupId)
    {
        return $this
            ->setTargetId($groupId)
            ->setTargetType(ACL::TARGET_TYPE_GROUP);
    }

    /**
     * Sets targetId= $userId and targetType = ACL::TARGET_TYPE_USER
     *
     * @param integer $userId
     *
     * @return $this
     */
    public function targetUser($userId)
    {
        return $this
            ->setTargetId($userId)
            ->setTargetType(ACL::TARGET_TYPE_USER);
    }

    /**
     * @return int|null
     */
    public function getTargetId()
    {
        return $this->targetId;
    }

    /**
     * @param int|null $targetId
     *
     * @return $this
     */
    public function setTargetId($targetId)
    {
        $this->targetId = (int)$targetId;

        return $this;
    }

    /**
     * @return boolean
     */
    public function isRootHasAccess()
    {
        return $this->rootHasAccess;
    }

    /**
     * @param boolean $rootHasAccess
     *
     * @return $this
     */
    public function setRootHasAccess($rootHasAccess)
    {
        $this->rootHasAccess = filter_var($rootHasAccess, FILTER_VALIDATE_BOOLEAN);

        return $this;
    }

    /**
     * @return boolean
     */
    public function isAsParent()
    {
        return $this->asParent;
    }

    /**
     * @param boolean $asParent
     *
     * @return $this
     */
    public function setAsParent($asParent)
    {
        $this->asParent = filter_var($asParent, FILTER_VALIDATE_BOOLEAN);

        return $this;
    }
}