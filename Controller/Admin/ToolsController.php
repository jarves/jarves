<?php

namespace Jarves\Controller\Admin;

use FOS\RestBundle\Request\ParamFetcher;
use Jarves\Model\Base\LogQuery;
use Jarves\Model\LogRequestQuery;
use Propel\Runtime\ActiveQuery\Criteria;
use Propel\Runtime\Map\TableMap;
use FOS\RestBundle\Controller\Annotations as Rest;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;

class ToolsController
{

    /**
     * @ApiDoc(
     *  section="Tools",
     *  description="Returns all stored log entries from the given request"
     * )
     *
     * @Rest\QueryParam(name="requestId", requirements=".+", strict=true, description="The request id")
     * @Rest\QueryParam(name="level", requirements=".+",  default="all", description="Level to filter")
     *
     * @Rest\Get("admin/system/tools/logs")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return array[items => array[]]
     */
    public function getLogsAction(ParamFetcher $paramFetcher)
    {
        $requestId = $paramFetcher->get('requestId');
        $level = $paramFetcher->get('level');

        $query = LogQuery::create()
            ->filterByRequestId($requestId)
            ->orderByDate(Criteria::DESC);

        if ('all' !== $level) {
            $query->filterByLevel($level);
        }

//        $count = ceil($query->count() / 50) ? : 0;
//        $paginate = $query->paginate($page, 50);

        $items = $query
            ->find()
            ->toArray(null, null, TableMap::TYPE_CAMELNAME);

        return [
            'items' => $items,
//            'maxPages' => $count
        ];
    }

    /**
     * @ApiDoc(
     *  section="Tools",
     *  description="Returns all stored log requests"
     * )
     *
     * @Rest\QueryParam(name="page", requirements="[0-9]+",  default="1", description="page")
     *
     * @Rest\Get("admin/system/tools/requests")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return array[items => array[], maxPages => int]
     */
    public function getLogRequestsAction(ParamFetcher $paramFetcher)
    {
        $page = $paramFetcher->get('page');

        $query = LogRequestQuery::create()
            ->orderByDate(Criteria::DESC);

        $count = ceil($query->count() / 50) ? : 0;
        $paginate = $query->paginate($page, 50);

        $items = $paginate
            ->getResults()
            ->toArray(null, null, TableMap::TYPE_CAMELNAME);

        return [
            'items' => $items,
            'maxPages' => $count
        ];
    }

    /**
     * @ApiDoc(
     *  section="Tools",
     *  description="Deletes all stored log entries and log requests"
     * )
     *
     * @Rest\Delete("admin/system/tools/logs")
     *
     * @return int count of deleted records
     */
    public function clearLogsAction()
    {
        return LogQuery::create()->deleteAll() + LogRequestQuery::create()->deleteAll();
    }

}
