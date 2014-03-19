<?php

namespace Jarves\Propel\Behavior;

use Propel\Generator\Model\Behavior;

class WorkspaceBehavior extends Behavior
{

    /**
     * The prefix for the additional table columns.
     *
     * @var string
     */
    private $prefix = 'workspace_';

    /**
     * @var
     */
    private $builder;

    /**
     * @var Table
     */
    private $versionTable;

    /**
     * @var string
     */
    private $versionTableName;

    /**
     * @var string
     */
    private $versionTablePhpName;

    /**
     * The callable where wo get our current workspace id
     *
     * @var callable
     */
    private $workspaceGetter = '\\Jarves\\Propel\\WorkspaceManager::getCurrent';

    /**
     * @param callable $workspaceGetter
     */
    public function setWorkspaceGetter($workspaceGetter)
    {
        $this->workspaceGetter = $workspaceGetter;
    }

    public function preDeleteQuery($builder)
    {
        return "
        //save current version
        static::doBackupRecord(\$this, \$con);

        //save workspace_action=deleted
        \$clazz = get_called_class();
        \$updateValues = new \$clazz;
        self::appendWorkspaceInfo(\$updateValues, 'delete');

        //update the record
        parent::doUpdate(\$updateValues, \$con);

        //move the updated record (marked as deleted) into the version table
        static::doBackupRecord(\$this, \$con);
     ";
    }

    public function preSelectQuery($builder)
    {
        return "
        self::appendWorkspaceInfo(\$this);
     ";
    }

    public function preUpdateQuery($builder)
    {
        return "
        \$selectCriteria = clone \$this;
        static::doBackupRecord(\$selectCriteria, \$con);
        self::appendWorkspaceInfo(\$this, 'update');
     ";
    }

    public function preUpdate($builder)
    {
        $queryClass = $builder->getStubQueryBuilder()->getClassname();
        return "
        \$selectCriteria = \$this->buildPkeyCriteria();
        $queryClass::doBackupRecord(\$selectCriteria, \$con);
     ";
    }

    /**
     * @return callable
     */
    public function getWorkspaceGetter()
    {
        return $this->workspaceGetter;
    }

    /**
     * Modifies all tables with our behaviour.
     */
    public function modifyDatabase()
    {
        foreach ($this->getDatabase()->getTables() as $table) {
            if ($table->hasBehavior($this->getName())) {
                // don't add the same behavior twice
                continue;
            }
            if (property_exists($table, 'isVersionTable')) {
                // don't add the behavior to archive tables
                continue;
            }
            $b = clone $this;
            $table->addBehavior($b);
        }
    }

    /**
     * Modifies a table
     */
    public function modifyTable()
    {
        /** @var \Propel\Generator\Model\Table $table */
        $table = $this->getTable();

        // add the column if not present
        if (!$table->hasColumn($this->prefix . 'id')) {
            $table->addColumn(
                array(
                     'name' => $this->prefix . 'id',
                     'type' => 'INTEGER',
                     'primaryKey' => 'true'
                )
            );
        }

        if (!$table->hasColumn($this->prefix . 'action')) {
            $table->addColumn(
                array(
                     'name' => $this->prefix . 'action',
                     'type' => 'INTEGER'
                )
            );
        }

        if (!$table->hasColumn($this->prefix . 'action_date')) {
            $table->addColumn(
                array(
                     'name' => $this->prefix . 'action_date',
                     'type' => 'INTEGER'
                )
            );
        }

        if (!$table->hasColumn($this->prefix . 'action_user')) {
            $table->addColumn(
                array(
                     'name' => $this->prefix . 'action_user',
                     'type' => 'INTEGER'
                )
            );
        }

        $this->addVersionTable();
    }

    /**
     * Adds version table.
     */
    public function addVersionTable()
    {
        $table = $this->getTable();
        $database = $table->getDatabase();

        $this->versionTableName = isset($this->parameters['version_table']) ? $this->parameters['version_table'] : null;
        if (!$this->versionTableName) {
            if ($database->getTablePrefix() && $start = strlen($database->getTablePrefix())) {
                $this->versionTableName = substr($table->getName() . '_version', $start);
            } else {
                $this->versionTableName = $table->getName() . '_version';
            }
        }

        $this->versionTablePhpName = $table->getPhpName() . 'Version';

        if (!$database->hasTable($this->versionTableName)) {
            // create the version table
            $versionTable = $database->addTable(
                array(
                     'name' => $this->versionTableName,
                     'phpName' => $this->versionTablePhpName,
                     'package' => $table->getPackage(),
                     'schema' => $table->getSchema(),
                     'namespace' => $table->getNamespace() ? '\\' . $table->getNamespace() : null,
                )
            );
            $versionTable->isVersionTable = true;

            $versionTable->addColumn(
                array(
                     'name' => $this->prefix . 'rev',
                     'type' => 'INTEGER',
                     'primaryKey' => 'true',
                     'autoIncrement' => 'true'
                )
            );

            // copy all the columns
            foreach ($table->getColumns() as $column) {
                $columnInVersionTable = clone $column;
                $columnInVersionTable->clearInheritanceList();

                if ($columnInVersionTable->hasReferrers()) {
                    $columnInVersionTable->clearReferrers();
                }

                if ($columnInVersionTable->isAutoincrement()) {
                    $columnInVersionTable->setAutoIncrement(false);
                }
                $versionTable->addColumn($columnInVersionTable);
            }

            /*
            // create the foreign key
            $fk = new ForeignKey();
            $fk->setForeignTableCommonName($table->getCommonName());
            $fk->setForeignSchemaName($table->getSchema());
            $fk->setOnDelete('CASCADE');
            $fk->setOnUpdate(null);

            $tablePKs = $table->getPrimaryKey();
            foreach ($versionTable->getPrimaryKey() as $key => $column) {
                $fk->addReference($column, $tablePKs[$key]);
            }
            $versionTable->addForeignKey($fk);
            */

            $this->versionTable = $versionTable;


            // every behavior adding a table should re-execute database behaviors
            // see bug 2188 http://www.propelorm.org/changeset/2188
            foreach ($database->getBehaviors() as $behavior) {
                $behavior->modifyDatabase();
            }

        } else {
            $this->versionTable = $database->getTable($this->versionTableName);
        }
    }

    public function getPrefix()
    {
        return $this->prefix;
    }

    public function staticAttributes()
    {

        return "
        public static \$workspaceBehaviorVersionName = '{$this->versionTable->getName()}';
        public static \$workspaceBehaviorPrefix = '{$this->prefix}';
        ";
    }
//
//    private function getColumnConstant($columnName, $builder = null)
//    {
//        if (!$builder) {
//            $builder = $this->builder;
//        }
//        return $builder->getColumnConstant($this->getTable()->getColumn($columnName));
//    }


    protected function getColumnSetter($columnName)
    {
        return 'set' . $this->getTable()->getColumn($columnName)->getPhpName();
    }

    protected function getColumnGetter($columnName)
    {
        return 'get' . $this->getTable()->getColumn($columnName)->getPhpName();
    }

    /**
     * Adds the default workspaceId if not set.
     *
     * @param $builder
     *
     * @return string The code to put at the hook
     */

    public function preSave($builder)
    {

        return "
//set default values
\$this->" . $this->getColumnSetter($this->prefix . 'id') . "(call_user_func_array(" . var_export(
        $this->workspaceGetter,
        true
    ) . ", array()));
\$this->" . $this->getColumnSetter($this->prefix . 'action') . "(\$isInsert ? 1 : 2); //created
\$this->" . $this->getColumnSetter($this->prefix . 'action_date') . "(time());
";
    }

    public function queryMethods($builder)
    {
        $this->builder = $builder;
        $script = '';
        $this->addFilterByWorkspace($script);
        $this->addAppendWorkspaceInfo($script);
        $this->addDoBackupRecord($script);
        return $script;
    }

    protected function addFilterByWorkspace(&$script)
    {
        $table = $this->getTable();
        $workspaceId = $table->getColumn($this->prefix . 'id')->getPhpName();

        $script .= "
    /**
     * Filters all items by given workspace.
     *
     * @return    " . $this->builder->getStubQueryBuilder()->getClassname() . " The current query
     */
    public function filterByWorkspace(\$workspaceId){
        return \$this->filterBy{$workspaceId}(\$workspaceId+0);
    }
";
    }

    protected function addDoBackupRecord(&$script)
    {
        $table = $this->getTable();
        $versionTable = '\\' . $this->versionTablePhpName;
        if ($table->getNamespace()) {
            $versionTable = '\\' . $table->getNamespace() . $versionTable;
        }

        $script .= '
    /**
    * @param Criteria            $criteria
    * @Param ConnectionInterface $con
    */
    public static function doBackupRecord(Criteria $criteria, ConnectionInterface $con = null)
    {
        $items = static::create(null, $criteria)->find($con);

        foreach ($items as $item) {
            $version = new ' . $versionTable . ';
';

        foreach ($this->table->getColumns() as $col) {
            $script .= "
            \$version->set" . $col->getPhpName() . "(\$item->get" . $col->getPhpName() . "());";
        }

        $script .= '
            $version->save($con);
        }
    }
';
    }

    protected function addAppendWorkspaceInfo(&$script)
    {
        $prefix = $this->getPrefix();
        $colId = "'" . $this->getTable()->getColumn($prefix . 'id')->getFullyQualifiedName() . "'";
        $colAction = "'" . $this->getTable()->getColumn($prefix . 'action')->getFullyQualifiedName() . "'";

        $script .= '
    private static function appendWorkspaceInfo($criteria, $mode = "select")
    {
        $colId = ' . $colId . ';
        $colAction = ' . $colAction . ';

        if (!$criteria->containsKey($colId)) {
            $criteria->add($colId, static::getWorkspaceId());
        }

        if (!$criteria->containsKey($colAction)) {
            if ($mode == \'insert\') {
                $criteria->add($colAction, 1);
            } //created
            else if ($mode == \'delete\') {
                $criteria->add($colAction, 0);
            } //deleted
            else if ($mode == \'update\') {
                $criteria->add($colAction, 2);
            } //updated
        }
    }
    ';
    }

    public function staticMethods($builder)
    {
        $this->builder = $builder;
        $script = '';
        $this->addGetWorkspaceId($script);
        return $script;
    }

    public function addGetWorkspaceId(&$script)
    {

        $script .= "
public static function getWorkspaceId(){
    return call_user_func_array(" . var_export($this->workspaceGetter, true) . ", array());
}
";

    }
}