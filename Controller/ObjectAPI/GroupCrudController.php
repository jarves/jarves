<?php

namespace Jarves\Controller\ObjectAPI;

use Jarves\Controller\ObjectCrudController;

class GroupCrudController extends ObjectCrudController
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