<?php

namespace Jarves\Controller\Admin\BundleManager;


class Manager {

    /**
     * Filters any special char out of the name.
     *
     * @static
     *
     * @param string $name Reference
     */
    public static function prepareName(&$name)
    {
        $name = preg_replace('/[^a-zA-Z0-9-_\\\\]/', '', $name);
    }
} 