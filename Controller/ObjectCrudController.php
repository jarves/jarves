<?php

namespace Jarves\Controller;

use FOS\RestBundle\Request\ParamFetcher;
use Jarves\Admin\ObjectCrud;
use Jarves\Configuration\EntryPoint;
use Jarves\Tools;
use Symfony\Component\HttpFoundation\Request;
use FOS\RestBundle\Controller\Annotations as Rest;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;

/**
 * RestController for the entry points which are from type store or framework window.
 *
 */
abstract class ObjectCrudController extends ObjectCrud
{
    protected $obj;

    protected function detectObjectKeyFromPathInfo()
    {
        $request = $this->getRequest();
        Return $request ? $request->attributes->get('_jarves_object') : '';
    }

//    maybe in v1.1
//    public function getCondition()
//    {
//        $request = $this->getRequest();
//
//        //when we are in a relation section we need to filter by the first PK per default
//        if ($request && $section = $request->attributes->get('_jarves_object_section')) {
//            if ($relationFieldName = $request->attributes->get('_jarves_object_relation')) {
//                $sectionObject = $this->getJarves()->getObjects()->getDefinition($section);
//
//                $relationField = $sectionObject->getField($relationFieldName);
//
//                $condition = new Condition(null, $this->getJarves());
//                $primaryKeys = $sectionObject->getPrimaryKeys();
//                if (1 < count($primaryKeys)) {
//                    foreach ($sectionObject->getPrimaryKeys() as $field) {
//                        $id = lcfirst($sectionObject->getId()) . '_' . lcfirst($field->getId());
//                        $condition->addAnd([$field->getId(), '=', $request->attributes->get($id)]);
//                    }
//                } else {
//                    $field = current($primaryKeys);
//                    $id = lcfirst($sectionObject->getId()) . '_' . lcfirst($field->getId());
//                    $condition->addAnd([$field->getId(), '=', $request->attributes->get($id)]);
//                }
//                return $condition;
//            }
//        }
//    }

    public function getVersionAction($pk, $id)
    {
        //todo
    }

    public function getVersionsAction($pk)
    {
        //todo
    }

    /**
     * @param Request $request
     *
     * @return array
     */
    protected function extractPrimaryKey(Request $request)
    {
        $primaryKey = [];

        $obj = $this->getObj();
        foreach ($obj->getPrimary() as $pk) {
            $primaryKey[$pk] = Tools::urlDecode($request->attributes->get($pk));
        }

        return $primaryKey;
    }

    /**
     * @ApiDoc(
     *    description="Returns a single %object% item"
     * )
     *
     * @Rest\QueryParam(name="fields", requirements=".+", description="Fields to select")
     * @Rest\QueryParam(name="withAcl", requirements=".+", default=false, description="With ACL information")
     *
     * @Rest\View()
     * @Rest\Get("/{pk}")
     *
     * @param Request $request
     * @param string $fields
     * @param boolean $withAcl
     *
     * @return array
     */
    public function getItemAction(Request $request, $fields = null, $withAcl = null)
    {
        $obj = $this->getObj();

        $primaryKey = $this->extractPrimaryKey($request);
        $withAcl = filter_var($withAcl, FILTER_VALIDATE_BOOLEAN);

        return $obj->getItem($primaryKey, $fields, $withAcl);
    }

    /**
     * @ApiDoc(
     *    description="Returns %object% items with additional information"
     * )
     *
     * @Rest\QueryParam(name="fields", requirements=".+", description="Comma separated list of field names")
     * @Rest\QueryParam(name="filter", array=true, requirements=".*", description="Simple filtering per field")
     * @Rest\QueryParam(name="limit", requirements="[0-9]+", description="Limits the result")
     * @Rest\QueryParam(name="offset", requirements="[0-9]+", description="Offsets the result")
     * @Rest\QueryParam(name="order", array=true, requirements=".+", description="Ordering. ?order[title]=asc")
     * @Rest\QueryParam(name="q", requirements=".+", description="Search query")
     * @Rest\QueryParam(name="withAcl", default=false, requirements=".+", description="With ACL information")
     *
     * @Rest\View()
     * @Rest\Get("/")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return mixed
     */
    public function getItemsAction(ParamFetcher $paramFetcher)
    {
        $obj = $this->getObj();

        return $obj->getItems(
            $paramFetcher->get('filter'),
            $paramFetcher->get('limit'),
            $paramFetcher->get('offset'),
            $paramFetcher->get('q'),
            $paramFetcher->get('fields'),
            $paramFetcher->get('order'),
            $paramFetcher->get('withAcl')
        );
    }

    /**
     * @ApiDoc(
     *    description="Updates a %object% item"
     * )
     *
     * @Rest\View()
     * @Rest\Put("/{pk}")
     *
     * @return mixed
     */
    public function updateItemAction(Request $request)
    {
        $obj = $this->getObj();

        $primaryKey = $this->extractPrimaryKey($request);

        return $obj->update($request, $primaryKey);
    }

    /**
     * @ApiDoc(
     *    description="Updates/Patches a %object% item"
     * )
     *
     * @Rest\View()
     * @Rest\Patch("/{pk}")
     *
     * @param Request $request
     *
     * @return mixed
     */
    public function patchItemAction(Request $request)
    {
        $obj = $this->getObj();

        $primaryKey = $this->extractPrimaryKey($request);

        return $obj->patch($request, $primaryKey);
    }

    /**
     * @ApiDoc(
     *    description="Returns %object% items count"
     * )
     *
     * @Rest\QueryParam(name="filter", array=true, requirements=".*", description="Simple filtering per field")
     * @Rest\QueryParam(name="q", requirements=".+", description="Search query")
     *
     * @Rest\View()
     * @Rest\Get("/:count")
     *
     * @param array $filter
     * @param string $q
     *
     * @return integer
     */
    public function getCountAction($filter = null, $q = null)
    {
        $obj = $this->getObj();

        return $obj->getCount($filter, $q);
    }

    /**
     * @ApiDoc(
     *    description="Deletes a %object% item"
     * )
     *
     * @Rest\View()
     * @Rest\Delete("/{pk}")
     *
     * @param Request $request
     *
     * @return boolean
     */
    public function removeItemAction(Request $request)
    {
        $obj = $this->getObj();

        $primaryKey = $this->extractPrimaryKey($request);

        return $obj->remove($primaryKey);
    }

    /**
     * @ApiDoc(
     *    description="Adds a new %object% item"
     * )
     *
     * @Rest\View()
     * @Rest\Post("/")
     *
     * @param Request $request
     * @param ParamFetcher $paramFetcher
     *
     * @return mixed
     */
    public function addItemAction(Request $request, ParamFetcher $paramFetcher)
    {
        $obj = $this->getObj();

        $data = null;

        return $obj->add($request, $data);
    }

    /**
     * Proxy method for REST POST to add().
     *
     * @return mixed
     */

    /**
     * @ApiDoc(
     *    description="Adds multiple %object% items #todo-doc"
     * )
     *
     * @Rest\View()
     * @Rest\Post("/:multiple")
     *
     * @param Request $request
     *
     * @return mixed
     */
    public function addMultipleItemAction(Request $request)
    {
        $obj = $this->getObj();

        return $obj->addMultiple($request);
    }

    /**
     * @ApiDoc(
     *    description="Returns the position in the %object% list of selected item"
     * )
     *
     * @Rest\View()
     * @Rest\Get("/{pk}/:position")
     *
     * @param Request $request
     * @return array
     */
    public function getItemPositionAction(Request $request)
    {
        $obj = $this->getObj();

        $primaryKey = $this->extractPrimaryKey($request);

        return $obj->getPosition($primaryKey);
    }

    /**
     * Returns the class object, depended on the current entryPoint.
     *
     * @return ObjectCrudController
     * @throws \Exception
     */
    public function getObj()
    {
        $obj = $this;
        $obj->setJarves($this->container->get('jarves'));
        $obj->setRequest($this->container->get('request'));
        $obj->initialize();

        return $obj;
    }

    /**
     * @param ObjectCrudController $obj
     */
    public function setObj($obj)
    {
        $this->obj = $obj;
    }

}
