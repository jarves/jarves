<?php

namespace Jarves\Controller\Admin;

use Jarves\Cache\Cacher;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Jarves\Model\Acl;
use Jarves\Model\AclQuery;
use Jarves\Model\UserQuery;
use Jarves\Objects;
use FOS\RestBundle\Controller\Annotations as Rest;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;
use Propel\Runtime\ActiveQuery\Criteria;
use Propel\Runtime\Map\TableMap;
use Symfony\Component\DependencyInjection\ContainerInterface;

class AclController extends Controller
{

    /**
     * @var Objects
     */
    private $objects;
    /**
     * @var Cacher
     */
    private $cacher;

    public function setContainer(ContainerInterface $container = null)
    {
        parent::setContainer($container);

        $this->objects = $this->container->get('jarves.objects');
        $this->cacher = $this->container->get('jarves.cache.cacher');
    }

    /**
     *
     * @ApiDoc(
     *  section="ACL Management",
     *  description="Gets all rules from given type and id"
     * )
     *
     * @Rest\QueryParam(name="type", requirements=".+", strict=true, description="Target type")
     * @Rest\QueryParam(name="id", requirements=".+", strict=true, description="Target id")
     *
     * @Rest\Get("/admin/acl")
     *
     * @param  int $type
     * @param  int $id
     *
     * @return array|int
     */
    public function loadAcl($type, $id)
    {
        $type = ($type == 'user') ? 0 : 1;

        return AclQuery::create()
            ->filterByTargetType($type + 0)
            ->filterByTargetId($id + 0)
            ->orderByPrio(Criteria::ASC)
            ->find()
            ->toArray(null, null, TableMap::TYPE_CAMELNAME);
    }


    /**
     * @ApiDoc(
     *  section="ACL Management",
     *  description="Saves the given rules"
     * )
     *
     * @Rest\RequestParam(name="targetId", requirements=".+", strict=true, description="Target id")
     * @Rest\RequestParam(name="targetType", requirements=".+", strict=true, description="Target type")
     * @Rest\RequestParam(name="rules", strict=false, description="ACL rules array")
     *
     * @Rest\Post("/admin/acl")
     *
     * @param  int $targetId
     * @param  int $targetType
     * @param  array $rules
     *
     * @return bool
     */
    public function saveAcl($targetId, $targetType, $rules = null)
    {
        $targetId += 0;
        $targetType += 0;

        AclQuery::create()->filterByTargetId($targetId)->filterByTargetType($targetType)->delete();

        if (0 < count($rules)) {
            $i = 1;
            if (is_array($rules)) {
                foreach ($rules as $rule) {

                    $ruleObject = new Acl();
                    $ruleObject->setPrio($i);
                    $ruleObject->setTargetType($targetType);
                    $ruleObject->setTargetId($targetId);
                    $ruleObject->setTargetId($targetId);
                    $ruleObject->setObject(Objects::normalizeObjectKey(@$rule['object']));
                    $ruleObject->setSub(filter_var(@$rule['sub'], FILTER_VALIDATE_BOOLEAN));
                    $ruleObject->setAccess(filter_var(@$rule['access'], FILTER_VALIDATE_BOOLEAN));
                    $ruleObject->setFields(@$rule['fields']);
                    $ruleObject->setConstraintType(@$rule['constraintType']);
                    $ruleObject->setConstraintCode(@$rule['constraintCode']);
                    $ruleObject->setMode(@$rule['mode'] + 0);
                    $ruleObject->save();
                    $i++;
                }
            }
        }

        $this->cacher->invalidateCache('core/acl');
        $this->cacher->invalidateCache('core/acl-rules');

        return true;
    }

    /**
     *
     * @param $items
     * @param $type
     */
    protected function setAclCount(&$items, $type)
    {
        if (is_array($items)) {
            foreach ($items as &$item) {
                $item['ruleCount'] = $this->getRuleCount($type, $item['id']);
            }
        }
    }

    /**
     * @param integer $type
     * @param integer $id
     * @return mixed
     */
    protected function getRuleCount($type, $id)
    {
        $query = AclQuery::create()
            ->filterByTargetType($type)
            ->filterByTargetId($id)
            ->orderByPrio(Criteria::DESC);

        return $query->count();
    }

    /**
     * @ApiDoc(
     *  section="ACL Management",
     *  description="Search user and group"
     * )
     *
     * @Rest\QueryParam(name="q", requirements=".*", description="Search query")
     *
     * @Rest\Get("/admin/acl/search")
     *
     * @param string $q
     *
     * @return array array('users' => array, 'groups' => array())
     */
    public function getSearch($q)
    {
        $q = str_replace("*", "%", $q);

        $userFilter = array();
        $groupFilter = array();

        if ($q) {
            $userFilter = array(
                array('username', 'like', "$q%"),
                'OR',
                array('first_name', 'like', "$q%"),
                'OR',
                array('last_name', 'like', "$q%"),
                'OR',
                array('email', 'like', "$q%"),
            );
            $groupFilter = array(
                array('name', 'like', "$q%")
            );
        }

        $users = $this->objects->getList(
            'jarves/user',
            $userFilter,
            array(
                'limit' => 10,
                'fields' => 'id,username,email,groupMembership.name,firstName,lastName'
            )
        );

        $this->setAclCount($users, 0);

        $groups = $this->objects->getList(
            'jarves/group',
            $groupFilter,
            array(
                'fields' => 'name',
                'limit' => 10
            )
        );

        $this->setAclCount($groups, 1);

        return array(
            'users' => $users,
            'groups' => $groups
        );
    }
} 