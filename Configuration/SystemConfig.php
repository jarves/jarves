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

namespace Jarves\Configuration;

class SystemConfig extends Model {

    protected $rootName = 'config';

    protected $docBlocks = [
        'timezone' => '
    IMPORTANT: Set this to your php timezone.
    see: http://www.php.net/manual/en/timezones.php
    ',
        'systemTitle' => 'The system title of this installation.',
        'languages' => 'Comma separated list of supported languages. (systemwide)',
        'adminUrl' => 'Defines under which url the backend is. Default is http://<domain>/jarves. where `jarves` is the `adminUrl`.',
        'email' => 'Is displayed as the administrator\'s email in error messages etc.',
        'id' => 'A installation id. If you have several jarves instances you should define a unique one. Gets defines through the installer.',
        'passwordHashKey' => 'This is a key generated through the installation process. You should not change it!
    The system needs this key to decrypt the passwords in the users database.'
    ];

    /**
     * @var string
     */
    protected $id;

    /**
     * @var string
     */
    protected $systemTitle;

    /**
     * @var string
     */
    protected $languages = 'en';

    /**
     * @var string
     */
    protected $email;

    /**
     * @var string
     */
    protected $timezone;

    /**
     * @var string
     */
    protected $passwordHashKey;


    /**
     * @var Database
     */
    protected $database;

    /**
     * @var Cache
     */
    protected $cache;

    /**
     * @var Logs
     */
    protected $logs;

    /**
     * @var Client
     */
    protected $client;

    /**
     * @var SystemMountPoint[]
     */
    protected $mountPoints;

    /**
     * @var FilePermission
     */
    protected $file;


    /**
     * {@inheritDocs}
     */
    public function save($path, $withDefaults = true)
    {
        return parent::save($path, $withDefaults);
    }

    /**
     * @param string $languages
     */
    public function setLanguages($languages)
    {
        $this->languages = $languages;
    }

    /**
     * @return string
     */
    public function getLanguages()
    {
        return $this->languages;
    }

    /**
     * @param Cache $cache
     */
    public function setCache(Cache $cache = null)
    {
        $this->cache = $cache;
    }

    /**
     * @param bool $orCreate creates the value of not exists.
     *
     * @return Cache
     */
    public function getCache($orCreate = false)
    {
        if ($orCreate && null === $this->cache) {
            $this->cache = new Cache(null, $this->getJarves());
        }
        return $this->cache;
    }

    /**
     * @param Client $client
     */
    public function setClient(Client $client = null)
    {
        $this->client = $client;
    }

    /**
     * @param bool $orCreate creates the value of not exists.
     *
     * @return Client
     */
    public function getClient($orCreate = false)
    {
        if ($orCreate && null === $this->client) {
            $this->client = new Client(null, $this->getJarves());
        }
        return $this->client;
    }

    /**
     * @param FilePermission $file
     */
    public function setFile(FilePermission $file = null)
    {
        $this->file = $file;
    }

    /**
     * @param bool $orCreate creates the value of not exists.
     *
     * @return FilePermission
     */
    public function getFile($orCreate = false)
    {
        if ($orCreate && null === $this->file) {
            $this->file = new FilePermission(null, $this->getJarves());
        }
        return $this->file;
    }

    /**
     * @param string $systemTitle
     */
    public function setSystemTitle($systemTitle)
    {
        $this->systemTitle = $systemTitle;
    }

    /**
     * @return string
     */
    public function getSystemTitle()
    {
        return $this->systemTitle;
    }

    /**
     * @param string $timezone
     */
    public function setTimezone($timezone)
    {
        $this->timezone = $timezone;
    }

    /**
     * @return string
     */
    public function getTimezone()
    {
        return $this->timezone;
    }

    /**
     * @param Database $database
     */
    public function setDatabase(Database $database = null)
    {
        $this->database = $database;
    }

    /**
     * @param bool $orCreate creates the value of not exists.
     *
     * @return Database
     */
    public function getDatabase($orCreate = false)
    {
        if ($orCreate && null === $this->database) {
            $this->database = new Database(null, $this->getJarves());
        }
        return $this->database;
    }

    /**
     * @param string $passwordHashKey
     */
    public function setPasswordHashKey($passwordHashKey)
    {
        $this->passwordHashKey = $passwordHashKey;
    }

    /**
     * @return string
     */
    public function getPasswordHashKey()
    {
        return $this->passwordHashKey;
    }

    /**
     * @param string $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return string
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param string $email
     */
    public function setEmail($email)
    {
        $this->email = $email;
    }

    /**
     * @return string
     */
    public function getEmail()
    {
        return $this->email;
    }

    /**
     * @param Logs $logs
     */
    public function setLogs($logs)
    {
        $this->logs = $logs;
    }

    /**
     * @param bool $orCreate
     * @return Logs
     */
    public function getLogs($orCreate = false)
    {
        if (!$this->logs && $orCreate) {
            $this->logs = new Logs(null, $this->getJarves());
        }
        return $this->logs;
    }

}