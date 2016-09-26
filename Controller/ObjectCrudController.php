<?php

namespace Jarves\Controller;

use FOS\RestBundle\Request\ParamFetcher;
use Jarves\Admin\ObjectCrud;
use Jarves\Configuration\EntryPoint;
use Jarves\Objects;
use Jarves\Tools;
use Symfony\Component\HttpFoundation\Request;
use FOS\RestBundle\Controller\Annotations as Rest;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;

/**
 * RestController for the entry points which are from type store or framework window.
 *
 */
class ObjectCrudController extends ObjectCrud
{
    public function getObject()
    {
        return parent::getObject() ?: $this->detectObjectKeyFromRoute();
    }

    /**
     * When ObjectCrudController is without custom sub class used, then we need to get the object information
     * from the route, defined in Jarves\Router\RestApiLoader
     *
     * @return string
     */
    protected function detectObjectKeyFromRoute()
    {
        $request = $this->requestStack->getCurrentRequest();
        Return $request ? Objects::normalizeObjectKey($request->attributes->get('_jarves_object')) : '';
    }

    /**
     * @ApiDoc(
     *    description="Returns the class definition/properties of the class behind this Framework-Window"
     * )
     *
     * @Rest\View()
     * @Rest\Options("/")
     *
     * @return array
     */
    public function getInfoAction()
    {
        $info = $this->getInfo();
        $info['_isClassDefinition'] = true;

        return $info;
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

        foreach ($this->getPrimary() as $pk) {
            $primaryKey[$pk] = Tools::urlDecode($request->attributes->get($pk));
        }

        return $primaryKey;
    }

    /**
     * @ApiDoc(
     *    description="Returns %object% items count"
     * )
     *
     * @Rest\QueryParam(name="filter", map=true, requirements=".*", description="Simple filtering per field")
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
        return $this->getCount($filter, $q);
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
        $primaryKey = $this->extractPrimaryKey($request);

        return $this->getPosition($primaryKey, $request->get('order'));
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
        $primaryKey = $this->extractPrimaryKey($request);
        $withAcl = filter_var($withAcl, FILTER_VALIDATE_BOOLEAN);

        return $this->getItem($primaryKey, $fields, $withAcl);
    }

    /**
     * @ApiDoc(
     *    description="Returns %object% items with additional information"
     * )
     *
     * @Rest\QueryParam(name="fields", requirements=".+", description="Comma separated list of field names")
     * @Rest\QueryParam(name="filter", map=true, requirements=".*", description="Simple filtering per field")
     * @Rest\QueryParam(name="limit", requirements="[0-9]+", description="Limits the result")
     * @Rest\QueryParam(name="offset", requirements="[0-9]+", description="Offsets the result")
     * @Rest\QueryParam(name="order", map=true, requirements=".+", description="Ordering. ?order[title]=asc")
     * @Rest\QueryParam(name="primaryKeys", description="PrimaryKey to filter as array")
     * @Rest\QueryParam(name="q", requirements=".+", description="Search query")
     * @Rest\QueryParam(name="withAcl", default=false, requirements=".+", description="With ACL information")
     * @Rest\QueryParam(name="lang", requirements=".+", description="Language id to filter if multiLanguage")
     * @Rest\QueryParam(name="domain", requirements=".+", description="Domain id to filter if domainDepended")
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
        $this->setLanguage($paramFetcher->get('lang'));
        $this->setDomain($paramFetcher->get('domain'));

        return $this->getItems(
            $paramFetcher->get('filter') ?: null,
            $paramFetcher->get('limit') ?: null,
            $paramFetcher->get('offset') ?: null,
            $paramFetcher->get('q') ?: '',
            $paramFetcher->get('fields') ?: null,
            $paramFetcher->get('order') ?: null,
            $paramFetcher->get('withAcl') ?: null,
            $paramFetcher->get('primaryKeys') ?: []
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
        $primaryKey = $this->extractPrimaryKey($request);

        return $this->update($primaryKey, $request);
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
        $primaryKey = $this->extractPrimaryKey($request);

        return $this->patch($primaryKey, $request);
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
        $primaryKey = $this->extractPrimaryKey($request);

        return $this->remove($primaryKey);
    }

    /**
     * @ApiDoc(
     *    description="Deletes multiple items at once"
     * )
     *
     * @Rest\RequestParam(name="pks", map=true, requirements=".+", description="All primary keys as list")
     *
     * @Rest\View()
     * @Rest\Delete("/")
     *
     * @param Request $request
     *
     * @return boolean
     */
    public function removeMultipleAction(Request $request)
    {
        $res = true;

        foreach ((array)$request->get('pks') as $pk) {
            $res &= $this->remove($pk);
        }

        return $res;
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
        return $this->add($request);
    }

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
        return $this->addMultiple($request);
    }

}
