<?php

namespace Jarves\Admin;

use Symfony\Component\HttpFoundation\Request;

interface ObjectCrudInterface {

    public function getCount($filter, $query = '');
    public function getParent($pk);
    public function getParents($pk);
    public function moveItem($sourceUrl, $targetUrl, $position = 'first', $targetObjectKey = '');
    public function getRoots();
    public function getRoot($scope = null);
    public function add($requestOrData, $pk = null, $position = null, $targetObjectKey = null);
    public function remove($pk);
    public function update($pk, $requestOrData);
    public function patch($pk, $requestOrData);
    public function getBranchChildrenCount($pk = null, $scope = null, $filter = null);
    public function getBranchItems(
        $pk = null,
        $filter = null,
        $fields = null,
        $scope = null,
        $depth = 1,
        $limit = null,
        $offset = null
    );

    public function getItems($filter = null, $limit = null, $offset = null, $query = '', $fields = null, $orderBy = []);
    public function getItem($pk, $fields = null, $withAcl = false);
}