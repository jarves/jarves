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

namespace Jarves\ORM\Builder;

use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\HttpKernel\Bundle\BundleInterface;

interface BuildInterface {
    /**
     * Does anything what is needed to get the ORM\* adapter working
     * with this ORM adapter.
     *
     * Check on each $objects entry if it's your data model (e.g $objects[0]->getDataModel == 'propel')
     *
     * @param \Jarves\Configuration\Object[] $objects
     * @param OutputInterface $output
     */
    public function build(array $objects, OutputInterface $output);

    /**
     * Returns true when a build is needed. This is fired on each JarvesBundle boot, so
     * do nothing big here.
     *
     * @return boolean
     */
    public function needsBuild();
}