<?php

namespace Jarves\ORM\Builder;

use Symfony\Component\HttpKernel\Bundle\BundleInterface;

interface BuildInterface {
    /**
     * Does anything what is needed to get the ORM\* adapter working
     * with this ORM adapter.
     *
     * Check on each $objects entry if it's your data model (e.g $objects[0]->getDataModel == 'propel')
     *
     * @param \Jarves\Configuration\Object[] $objects
     */
    public function build(array $objects);

    /**
     * Returns true when a build is needed. This is fired on each JarvesBundle boot, so
     * do nothing big here.
     *
     * @return boolean
     */
    public function needsBuild();
}