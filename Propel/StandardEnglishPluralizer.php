<?php

namespace Jarves\Propel;

class StandardEnglishPluralizer extends \Propel\Common\Pluralizer\StandardEnglishPluralizer
{
    /**
     * @var array
     */
    protected $singular = array(
        '\1i' => '(alumn|bacill|cact|foc|fung|nucle|radi|stimul|syllab|termin|vir)us',
        '\1o' => '(buffal|tomat)oes',

        'matrix'  => 'matrices',
        'matrex'  => 'matrices',

        'vertex'  => 'vertices',
        'vertix'  => 'vertices',

        'index'  => 'indices',
        'indix'  => 'indices',

        'ch' => 'ches',
        'sh' => 'shes',
        'ss' => 'sses',

        'ay' => 'ays',
        'ey' => 'eys',
        'iy' => 'iys',
        'oy' => 'oys',
        'uy' => 'uys',
        'y'  => 'ies',

        'ao' => 'aos',
        'eo' => 'eos',
        'io' => 'ios',
        'oo' => 'oos',
        'uo' => 'uos',
        'o'  => 'os',

        'us' => 'uses',

        'cis' => 'ces',
        'sis' => 'ses',
        'xis' => 'xes',

        'zoon' => 'zoa',

        'itis' => 'itis',
        'ois'  => 'ois',
        'pox'  => 'pox',
        'ox'   => 'oxes',

        'foot'  => 'feet',
        'goose' => 'geese',
        'tooth' => 'teeth',
        'quiz' => 'quizzes',
        'alias' => 'aliases',

        'alf'  => 'alves',
        'elf'  => 'elves',
        'olf'  => 'olves',
        'arf'  => 'arves',
        'nife' => 'nives',
        'life' => 'lives'
    );

    public function getSingularForm($plural)
    {

        // save some time in the case that singular and plural are the same
        if (in_array(strtolower($plural), $this->uncountable)) {
            return $plural;
        }

        // check for irregular singular words
        foreach ($this->irregular as $result => $pattern) {
            $searchPattern = '/' . $pattern . '$/i';
            if (preg_match($searchPattern, $plural)) {
                $replacement = preg_replace($searchPattern, $result, $plural);
                // look at the first char and see if it's upper case
                // I know it won't handle more than one upper case char here (but I'm OK with that)
                if (preg_match('/^[A-Z]/', $plural)) {
                    $replacement = ucfirst($replacement);
                }

                return $replacement;
            }
        }

        // check for irregular singular suffixes
        foreach ($this->singular as $result => $pattern) {
            $searchPattern = '/' . $pattern . '$/i';
            if (preg_match($searchPattern, $plural)) {
                return preg_replace($searchPattern, $result, $plural);
            }
        }

        // fallback to naive singularisation
        return substr($plural, -1) === 's' ? substr($plural, 0, -1) : $plural;
    }

}