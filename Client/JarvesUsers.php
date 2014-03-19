<?php

namespace Jarves\Client;

use Propel\Runtime\Propel;

class JarvesUsers extends ClientAbstract
{
    /**
     * Checks the given credentials.
     *
     * @param string $login
     * @param string $password
     *
     * @return bool|integer Returns false if credentials are wrong and returns the user id, if credentials are correct.
     */
    public function checkCredentials($login, $password)
    {
        $userColumn = 'username';

        if ($this->getConfigValue('emailLogin') && strpos($login, '@') !== false && strpos($login, '.') !== false) {
            $userColumn = 'email';
        }

        $con = Propel::getWriteConnection('default');

        $sql = "
            SELECT id, passwd, passwd_salt
            FROM " . $this->getJarves()->getSystemConfig()->getDatabase()->getPrefix() . "system_user
            WHERE
                id > 0
                AND $userColumn = ?
                AND passwd IS NOT NULL AND passwd != ''
                AND passwd_salt IS NOT NULL AND passwd_salt != ''
                AND (auth_class IS NULL OR auth_class = 'jarves')";

        $stmt = $con->prepare($sql);

        if ($stmt->execute([$login])) {
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        }

        if (isset($row['id']) && $row['id'] > 0) {

            $hash = self::getHashedPassword($password, $row['passwd_salt'], $this->getJarves());

            if (!$hash || $hash != $row['passwd']) {
                return false;
            }
            return $row['id'];
        }

        return false;
    }

}
