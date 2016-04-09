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

namespace Test\Controller\Admin;
 
class TestCrud extends \Jarves\Controller\ObjectCrudController {

    public $fields = array (
  '__Gazzo__' => 
  array (
    'label' => 'Gazzo',
    'type' => 'tab',
    'key' => '__Gazzo__',
    'children' => 
    array (
      'name' => 
      array (
        'key' => 'name',
        'label' => 'Name',
        'type' => 'text',
      ),
    ),
  ),
);

    public $columns = array (
  'id' => 
  array (
    'label' => '#',
    'type' => 'text',
    'width' => '100',
  ),
  'name' => 
  array (
    'label' => 'Name',
    'type' => 'text',
  ),
);

    public $itemLayout = '<h2>{name}</h2>';

    public $itemsPerPage = 10;

    public $order = array (
  0 => 
  array (
    'field' => 'name',
    'direction' => 'asc',
  ),
);

    public $addIcon = '#icon-plus-5';

    public $add = true;

    public $editIcon = '#icon-pencil-8';

    public $edit = true;

    public $removeIcon = '#icon-minus-5';

    public $remove = true;

    public $export = true;

    public $object = 'Test\\Test';

    public $preview = false;

    public $workspace = false;

    public $multiLanguage = false;

    public $multiDomain = false;

    public $versioning = true;


    protected $addEntrypoint = 'add';
    protected $editEntrypoint = 'edit';

}
