<?php

namespace Jarves\Controller\Windows;

use Jarves\Controller\WindowNestedController;

/**
 * AUTO-GENERATED THROUGH KRYN WINDOW-EDITOR
 */
class NodeCrudController extends WindowNestedController
{
    public $fields = array(
        '__General__' => array(
            'label' => 'General',
            'type' => 'tab',
            'children' => array(
                'title' => array(
                    'label' => 'Title',
                    'type' => 'text',
                    'required' => 'true',
                ),
                'alternativeTitle' => array(
                    'label' => 'Alternative title',
                    'type' => 'text',
                    'desc' => 'Overwrites the page title (not navigation).'
                ),
                'type' => array(
                    'label' => 'Type',
                    'type' => 'select',
                    'options' => array(
                        'items' => array(
                            array('Page', '#icon-newspaper'),
                            array('Link', '#icon-link-5'),
                            array('Navigation', '#icon-folder-4'),
                            array('Tray', '#icon-clipboard-2')
                        ),
                        'itemsLabelAsValue' => false
                    ),
                    'required' => 'true',
                ),
                'urn' => array(
                    'label' => 'URN',
                    'type' => 'text',
                    'required' => 'true',
                    'needValue' => [0, 1],
                    'againstField' => 'type',
                ),
                'link' => array(
                    'label' => 'Link',
                    'type' => 'object',
                    'required' => true,
                    'needValue' => 1,
                    'againstField' => 'type',
                    'options' => array(
                        'combobox' => 'true',
                    )
                ),
                '__metas__' => array(
                    'needValue' => [0, 1],
                    'againstField' => 'type',
                    'label' => 'Metas',
                    'type' => 'childrenSwitcher',
                    'children' => array(
                        'metaDescription' => array(
                            'label' => 'Meta Description',
                            'type' => 'text'
                        ),
                        'metas' => array(
                            'label' => 'Custom Meta-Tags',
                            'type' => 'array',
                            'options' => array(
                                'columns' => array(
                                    array('label' => 'Name'),
                                    array('label' => 'Content')
                                ),
                                'fields' => array(
                                    'name' => array(
                                        'type' => 'text',
                                        'required' => 'true'
                                    ),
                                    'content' => array(
                                        'type' => 'text'
                                    )
                                )
                            )
                        )
                    )
                )
            ),
        ),
        '__Access__' => array(
            'label' => 'Access',
            'type' => 'tab',
            'children' => array(
                'visible' => array(
                    'label' => 'Visible in navigation',
                    'type' => 'checkbox',
                ),
                'accessDenied' => array(
                    'label' => 'Access denied',
                    'type' => 'checkbox',
                    'desc' => 'For everyone. This removes the page from the navigation.',
                ),
                'forceHttps' => array(
                    'label' => 'Force HTTPS',
                    'type' => 'checkbox',
                ),
                'accessFrom' => array(
                    'label' => 'Allow access from',
                    'type' => 'datetime'
                ),
                'accessTo' => array(
                    'label' => 'Allow access until',
                    'type' => 'datetime'
                ),
                'accessNohidenavi' => array(
                    'label' => 'Do not hide when no access',
                    'type' => 'checkbox'
                ),
            ),
        ),
        '__Content__' => array(
            'label' => 'Content',
            'type' => 'tab',
            'needValue' => 0,
            'againstField' => 'type',
            'children' => array(
                'content' => array(
                    'noWrapper' => true,
                    'type' => 'pageContents'
                ),
            ),
        ),
        '__Search__' => array(
            'label' => 'Search',
            'type' => 'tab',
            'needValue' => 0,
            'againstField' => 'type',
            'children' => array(
                'unsearchable' => array(
                    'label' => 'Unsearchable',
                    'type' => 'checkbox',
                    'desc' => 'Hides this page from the search results if active.'
                ),
                'search_words' => array(
                    'label' => 'Search words',
                    'type' => 'textarea',
                    'desc' => 'Additional keywords.'
                ),
            ),
        ),
    );

    public $extraSelection = 'domain, domain.theme';

    public $columns = array(
        'type' => array(
            'label' => 'Type',
            'type' => 'select',
            'options' => array(
                'items' => array(
                    array('Page', '#icon-newspaper'),
                    array('Link', '#icon-link-5'),
                    array('Navigation', '#icon-folder-4'),
                    array('Tray', '#icon-clipboard-2')
                ),
                'itemsLabelAsValue' => false
            ),
            'width' => 30
        ),
        'title' => array(
            'type' => 'text',
            'label' => 'Title',
        ),
        'urn' => array(
            'type' => 'text',
            'label' => 'Urn',
        ),
    );

    public $defaultLimit = 15;

    public $asNested = true;

    public $addIcon = '#icon-plus-5';

    public $addLabel = '[[Node]]';

    public $add = true;

    public $editIcon = '#icon-pencil-8';

    public $edit = true;

    public $remove = false;

    public $nestedRootFieldTemplate = '{label}';

    public $nestedRootAddIcon = '#icon-plus-2';

    public $nestedRootAddEntrypoint = 'root/';

    public $nestedRootAddLabel = '[[New Domain]]';

    public $nestedRootAdd = true;

    public $nestedRootEditEntrypoint = 'root/';

    public $nestedRootEdit = true;

    public $nestedRootRemoveEntrypoint = 'root/';

    public $nestedRootRemove = true;

    public $export = false;

    public $startCombine = true;

    public $addMultipleFixedFields = array(
        'visible' => array(
            'label' => 'Visible',
            'type' => 'checkbox',
        ),
    );

    public $addMultipleFields = array(
        'title' => array(
            'label' => 'Title',
            'type' => 'text',
            'required' => true,
        ),
        'type' => array(
            'label' => 'Type',
            'options' => array(
                'items' => array(
                    0 => 'Page',
                    1 => 'Link',
                    2 => 'Folder',
                    3 => 'Tray',
                ),
            ),
            'type' => 'select',
            'width' => '50',
        ),
        'layout' => array(
            'label' => 'Layout',
            'type' => 'layout',
            'width' => '50',
        ),
    );


    public $addMultiple = true;

    public $object = 'JarvesBundle:Node';

    public $preview = false;

    public $titleField = 'Node';

    public $workspace = true;

    public $multiLanguage = true;

    public $multiDomain = false;

    public $versioning = false;

}
