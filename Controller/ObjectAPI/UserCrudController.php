<?php

namespace Jarves\Controller\ObjectAPI;

use Jarves\Controller\ObjectCrudController;

class UserCrudController extends ObjectCrudController {

    public $columns = array(
        'lastName' =>
            array(
                'label' => 'Last name',
                'type' => 'text',
            ),
        'firstName' =>
            array(
                'label' => 'First name',
                'type' => 'text',
            ),
        'username' =>
            array(
                'label' => 'Username',
                'width' => '100',
                'type' => 'text',
            ),
        'email' =>
            array(
                'label' => 'Email',
                'type' => 'text',
            ),
        'activate' =>
            array(
                'label' => 'Active',
                'width' => '35',
                'type' => 'checkbox',
                'align' => 'center'
            ),
        'groups.name' =>
            array(
                'label' => 'Groups'
            )
    );

    public $itemLayout = '
    <div title="#{{id}}">
        <b>{{username}}</b>
        {%if firstName or lastName%}
            (<span>{{firstName}}</span>{% if lastName %} <span>{{lastName}}</span>{% endif %})
        {%endif%}
        {%if email%}<div class="sub">{{email}}</div>{%endif%}
        <div class="sub">{%if groups%}{{groups.name}}{%endif%}</div>
    </div>';

    public $itemsPerPage = 20;

    public $add = true;

    public $edit = true;

    public $remove = true;

    public $export = false;

    public $object = 'jarves/user';

    public $preview = false;

    public $workspace = false;

    public $multiLanguage = false;

    public $multiDomain = false;

    public $versioning = false;

    public $order = array('username' => 'asc');

    public $titleField = 'username';

    public $fields = array(
        '__account__' => array(
            'type' => 'tab',
            'label' => '[[Account]]',
            'children' => array(
                'username' => array(
                    'label' => 'Username',
                    'desc' => '(and the administration login)',
                    'type' => 'text',
                    'required' => true,
                ),
                'password' => array( //it's a virtual field from the user model
                    'label' => 'Password',
                    'type' => 'userPassword',
                    'desc' => 'Leave empty to change nothing',
                    'startEmpty' => true,
                    'saveOnlyFilled' => true
                ),
                'email' => array(
                    'label' => 'Email',
                    'type' => 'text',
                    'desc' => '(and the administration login if enabled)',
                    'required' => true,
                    'requiredRegex' => '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-_]+'
                ),
                'activate' => array(
                    'label' => 'Active account',
                    'type' => 'checkbox'
                ),
                'groups' => array(
                    'fieldWidth' => 'auto'
                )
            )
        ),
        '__Person__' => array(
            'type' => 'tab',
            'label' => '[[Person]]',
            'children' => array(
                'firstName' => array(
                    'label' => 'First name',
                    'type' => 'text',
                    'target' => 'names'
                ),
                'lastName' => array(
                    'label' => 'Last name',
                    'type' => 'text',
                    'target' => 'names'
                ),
                'imagePath' => array (
                    'label' => 'Picture'
                ),
                'company' => array(
                    'label' => 'Company',
                    'type' => 'text'
                ),
                'street' => array(
                    'label' => 'Street',
                    'type' => 'text'
                ),
                'city' => array(
                    'label' => 'City',
                    'type' => 'text'
                ),
                'zip' => array(
                    'label' => 'Zipcode',
                    'type' => 'number',
                    'maxLength' => 10,
                    'inputWidth' => 100
                ),
                'country' => array(
                    'label' => 'Country',
                    'type' => 'text'
                ),
                'phone' => array(
                    'label' => 'Phone',
                    'type' => 'text'
                ),
                'fax' => array(
                    'label' => 'Fax',
                    'type' => 'text'
                ),
            )
        )
    );


}