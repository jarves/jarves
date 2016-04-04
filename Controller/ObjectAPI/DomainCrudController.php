<?php

namespace Jarves\Controller\ObjectAPI;

use Jarves\Controller\ObjectCrudController;
 
class DomainCrudController extends \Jarves\Controller\ObjectCrudController {

    public $fields = array (
  '__General__' => array (
    'label' => 'General',
    'type' => 'tab',
    'children' => array (
      'domain',
      'path',
      'titleFormat',
      'lang' => array (
        'type' => 'lang',
        'label' => 'Language'
      ),
      'master' => array (
        'type' => 'predefined',
        'object' => 'JarvesBundle:Domain',
        'field' => 'master',
      ),
      'startnode' => array (
        'type' => 'predefined',
        'object' => 'jarves/domain',
        'field' => 'startnode',
      ),
      'theme' => array (
        'type' => 'predefined',
        'object' => 'jarves/domain',
        'field' => 'theme',
      ),
    ),
  ),
  '__Extra__' => array (
    'label' => 'Extra',
    'type' => 'tab',
    'children' => array (
      'resourceCompression' => array (
        'type' => 'predefined',
        'object' => 'JarvesBundle:Domain',
        'field' => 'resourceCompression',
      ),
      'favicon' => array (
        'type' => 'predefined',
        'object' => 'JarvesBundle:Domain',
        'field' => 'favicon',
      ),
      'robots' => array (
        'type' => 'predefined',
        'object' => 'JarvesBundle:Domain',
        'field' => 'robots',
      ),
      'email' => array (
        'type' => 'predefined',
        'object' => 'JarvesBundle:Domain',
        'field' => 'email',
      ),
      'alias' => array (
        'type' => 'predefined',
        'object' => 'jarves/domain',
        'field' => 'alias',
      ),
      'redirect' => array (
        'type' => 'predefined',
        'object' => 'jarves/domain',
        'field' => 'redirect',
      ),
    ),
  ),
);

    public $defaultLimit = 15;

    public $add = false;

    public $edit = false;

    public $remove = false;

    public $nestedRootAdd = false;

    public $nestedRootEdit = false;

    public $nestedRootRemove = false;

    public $export = false;

    public $object = 'jarves/domain';

    public $preview = false;

    public $titleField = 'domain';

    public $workspace = true;

    public $multiDomain = false;


}
