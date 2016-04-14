<?php

namespace Jarves\Controller\Admin\Object;

use FOS\RestBundle\Request\ParamFetcher;
use Jarves\Objects;
use Symfony\Bundle\FrameworkBundle\Controller\Controller as SymfonyController;
use Jarves\Exceptions\ClassNotFoundException;
use Jarves\Exceptions\ObjectNotFoundException;
use Jarves\Tools;
use FOS\RestBundle\Controller\Annotations as Rest;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;


/**
 * Controller
 *
 * Proxy class for \Jarves\Object
 */
class Controller extends SymfonyController
{
    /**
     * @return Objects
     */
    protected function getObjects()
    {
        return $this->container->get('jarves.objects');
    }

    /**
     * @ApiDoc(
     *  section="Object Browser",
     *  description="General single object item output"
     * )
     *
     * @Rest\QueryParam(name="url", requirements=".+", strict=true, description="The object url")
     * @Rest\QueryParam(name="fields", requirements=".+", description="Comma separated list of field names")
     *
     * @Rest\Get("/admin/object")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return array|bool
     * @throws ObjectNotFoundException
     */
    public function getItemPerUrlAction(ParamFetcher $paramFetcher)
    {
        $url = $paramFetcher->get('url');
        $fields = $paramFetcher->get('fields');

        list($objectKey, $object_id) = $this->getObjects()->parseUrl($url);

        $definition = $this->getObjects()->getDefinition($objectKey);
        if ($definition->getExcludeFromREST()) {
            return null;
        }

        if (!$definition) {
            throw new ObjectNotFoundException(sprintf('Object %s does not exists.', $objectKey));
        }
        return $this->getObjects()->get($objectKey, $object_id[0], array('fields' => $fields, 'permissionCheck' => true));
    }

    /**
     * @ApiDoc(
     *  section="Object Browser",
     *  description="General object item list output"
     * )
     *
     * @Rest\QueryParam(name="url", requirements=".+", strict=true, description="The object url")
     * @Rest\QueryParam(name="fields", requirements=".+", description="Comma separated list of field names")
     * @Rest\QueryParam(name="returnKey", requirements=".+", description="If the result should be indexed by the pk")
     * @Rest\QueryParam(name="returnKeyAsRequested", requirements=".+", description="If the result should be indexed by the pk as requested")
     *
     * @Rest\Get("/admin/objects")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return array
     * @throws \Exception
     * @throws ClassNotFoundException
     * @throws ObjectNotFoundException
     */
    public function getItemsByUrlAction(ParamFetcher $paramFetcher)
    {
        $url = $paramFetcher->get('url');
        $fields = $paramFetcher->get('fields');
        $returnKey = filter_var($paramFetcher->get('returnKey'), FILTER_VALIDATE_BOOLEAN);
        $returnKeyAsRequested = filter_var($paramFetcher->get('returnKeyAsRequested'), FILTER_VALIDATE_BOOLEAN);

        list($objectKey, $objectIds,) = $this->getObjects()->parseUrl($url);
        //check if we got a id
        if ($objectIds[0] === '') {
            throw new \Exception(sprintf('No id given in uri %s.', $url));
        }

        $definition = $this->getObjects()->getDefinition($objectKey);
        if (!$definition) {
            throw new ObjectNotFoundException(sprintf('Object %s can not be found.', $objectKey));
        }
        if ($definition->getExcludeFromREST()) {
            return null;
        }

        $options['extraFields'] = $fields;
        $options['permissionCheck'] = true;

        $options['fields'][] = $definition->getLabelField();
        if ($definition->getSingleItemLabelField()) {
            $options['fields'][] = $definition->getSingleItemLabelField();
        }

        $items = array();
        if (count($objectIds) == 1) {
            if ($item = $this->getObjects()->get($objectKey, $objectIds[0], $options)) {
                $items[] = $item;
            }
        } else {
            foreach ($objectIds as $primaryKey) {
                if ($item = $this->getObjects()->get($objectKey, $primaryKey, $options)) {
                    $items[] = $item;
                }
            }
        }

        if ($returnKey || $returnKeyAsRequested) {

            $res = array();
            if ($returnKeyAsRequested) {

                //map requested id to real ids
                $requestedIds = explode('/', $this->getObjects()->getCroppedObjectId($url));
                $map = array();
                foreach ($requestedIds as $id) {
                    $pk = $this->getObjects()->parsePk($objectKey, $id);
                    if ($pk) {
                        $map[$this->getObjects()->getObjectUrlId($objectKey, $pk) . ''] = $id;
                    }
                }

                if (is_array($items)) {
                    foreach ($items as &$item) {
                        $pk = $this->getObjects()->getObjectUrlId($objectKey, $item);
                        $res[$map[$pk . '']] = $item;
                    }
                }

            } else {
                $primaryKeys = $this->getObjects()->getPrimaries($objectKey);

                $c = count($primaryKeys);
                $firstPK = key($primaryKeys);

                if (is_array($items)) {
                    foreach ($items as &$item) {

                        if ($c > 1) {
                            $keys = array();
                            foreach ($primaryKeys as $key => $field) {
                                $keys[] = Tools::urlEncode($item[$key]);
                            }
                            $res[implode(',', $keys)] = $item;
                        } else {
                            $res[$item[$firstPK]] = $item;
                        }
                    }
                }
            }

            return $res;
        } else {
            return $items;
        }
    }

//    /**
//     * @ApiDoc(
//     *  section="Object Browser",
//     *  description="General object items output for the object browser"
//     * )
//     *
//     * @Rest\QueryParam(name="returnHash", requirements=".+", description="If the result should be indexed by the pk")
//     *
//     * @Rest\QueryParam(name="limit", requirements="[0-9]+", description="Limits the result")
//     * @Rest\QueryParam(name="offset", requirements="[0-9]+", description="Offsets the result")
//     * @Rest\QueryParam(name="order", map=true, requirements=".+", description="Order the result")
//     * @Rest\QueryParam(name="filter", map=true, requirements=".+", description="Filter the result")
//     *
//     * @Rest\Get("/admin/object-browser/{objectKey}", requirements={"objectKey" = "[a-zA-Z0-9-_]+/[a-zA-Z0-9-_]+"})
//     *
//     * @param string $objectKey
//     * @param ParamFetcher $paramFetcher
//     *
//     * @return array
//     * @throws \Exception
//     * @throws ClassNotFoundException
//     * @throws ObjectNotFoundException
//     */
//    public function getBrowserItemsAction($objectKey, ParamFetcher $paramFetcher)
//    {
//
//        $returnHash = $paramFetcher->get('returnHash');
//        $limit = $paramFetcher->get('limit');
//        $offset = $paramFetcher->get('offset');
//        $order = $paramFetcher->get('order');
//        $filter = $paramFetcher->get('filter') ?: [];
//
//        $definition = $this->getObjects()->getDefinition($objectKey);
//        if (!$definition) {
//            throw new ObjectNotFoundException(sprintf('Object %s can not be found.', $objectKey));
//        }
//
//        if (!$definition['browserColumns']) {
//            throw new ObjectMisconfiguration(sprintf('Object %s does not have browser columns.', $objectKey));
//        }
//
//        $fields2 = array_keys($definition['browserColumns']);
//
//        $options = array(
//            'permissionCheck' => true,
//            'fields' => $fields2,
//            'limit' => $limit,
//            'offset' => $offset,
//            'order' => $order
//        );
//
//        $condition = ObjectCrudController::buildFilter($filter);
//
//        if ($definition['browserDataModel'] == 'custom') {
//
//            $class = $definition['browserDataModelClass'];
//            if (!class_exists($class)) {
//                throw new ClassNotFoundException(sprintf('The class %s can not be found.', $class));
//            }
//
//            /** @var $dataModel \Jarves\ORM\ORMAbstract */
//            $dataModel = new $class($objectKey);
//
//            $items = $dataModel->getItems($condition, $options);
//
//        } else {
//            $items = $this->getObjects()->getList($objectKey, $condition, $options);
//        }
//
//        if ($returnHash) {
//            $primaryKeys = $this->getObjects()->getPrimaries($objectKey);
//
//            $c = count($primaryKeys);
//            $firstPK = key($primaryKeys);
//
//            $res = array();
//            if (is_array($items)) {
//                foreach ($items as &$item) {
//
//                    if ($c > 1) {
//                        $keys = array();
//                        foreach ($primaryKeys as $key => &$field) {
//                            $keys[] = Tools::urlEncode($item[$key]);
//                        }
//                        $res[implode(',', $keys)] = $item;
//                    } else {
//                        $res[$item[$firstPK]] = $item;
//                    }
//                }
//            }
//
//            return $res;
//        } else {
//            return $items;
//        }
//    }

//    /**
//     * @ApiDoc(
//     *  section="Object Browser",
//     *  description="General object items output for the object browser"
//     * )
//     *
//     * @Rest\QueryParam(name="filter", map=true, requirements=".+", description="Filter the result")
//     *
//     * @Rest\Get("/admin/object-browser-count/{objectKey}", requirements={"objectKey" = "[a-zA-Z0-9-_]+/[a-zA-Z0-9-_]+"})
//     *
//     * @param string $objectKey
//     * @param ParamFetcher $paramFetcher
//     *
//     * @return array
//     * @throws \Exception
//     * @throws ClassNotFoundException
//     * @throws ObjectNotFoundException
//     */
//    public function getBrowserItemsCountAction($objectKey, ParamFetcher $paramFetcher)
//    {
//        $filter = $paramFetcher->get('filter');
//
//        $definition = $this->getObjects()->getDefinition($objectKey);
//        if (!$definition) {
//            throw new ObjectNotFoundException(sprintf('Object %s can not be found.', $objectKey));
//        }
//
//        if (!$definition['browserColumns']) {
//            throw new ObjectMisconfiguration(sprintf('Object %s does not have browser columns.', $objectKey));
//        }
//
////        $fields = array_keys($definition['browserColumns']);
//
//        $options = array(
//            'permissionCheck' => true
//        );
//
//        $condition = ObjectCrudController::buildFilter($filter);
//
//        if ($definition['browserDataModel'] == 'custom') {
//
//            $class = $definition['browserDataModelClass'];
//            if (!class_exists($class)) {
//                throw new ClassNotFoundException(sprintf('The class %s can not be found.', $class));
//            }
//
//            $dataModel = new $class($objectKey);
//
//            $count = $dataModel->getCount($condition, $options);
//
//        } else {
//
//            $count = $this->getObjects()->getCount($objectKey, $condition, $options);
//
//        }
//
//        return $count;
//    }
}
