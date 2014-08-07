<?php

namespace Jarves\Controller\Windows;


use Jarves\Controller\WindowController;

class GroupCrudController extends WindowController
{
    public $fields = array(
        '__General__' =>
            array(
                'label' => 'General',
                'type' => 'tab',
                'children' =>
                    array(
                        'name',
                        'description'
                    ),
            ),
    );

    public $columns = array(
        'name',
        'description'
    );

    public $itemLayout = '{{name}}
<div style="color: silver">{{description|truncate(20)}}</div>';

    public $itemsPerPage = 10;

    public $order = array(
        'name' => 'asc',
    );

    public $add = true;

    public $edit = true;

    public $remove = true;

    public $export = false;

    public $object = 'jarves/group';

    public $preview = false;

    public $titleField = 'name';

    public $workspace = false;

    public $multiLanguage = false;

    public $multiDomain = false;

    public $versioning = false;

}