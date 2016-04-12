/*
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

jarves.SearchResultsPane = Vue.extend({
    template: '<h3>Search</h3>' +
    '<div v-on:click="closeSearch()" class="jarves-search-closer icon-cancel-8"></div>' +
    '<div class="description">Tip: Use a star (*) at the end to find more. Example: keyword*</div>' +
    '<div v-if="loading" class="jarves-search-loading">' +
    'Searching ...' +
    '</div>' +
    '<div class="jarves-search-results">' +
    '  <div class="jarves-search-result-object">' +
    '    <div :is="componentName(key)" :items="result" :object-key="key" v-for="(key, result) in result.items"></div>' +
    '  </div>' +
    '</div>',
    replace: false,
    methods: {
        componentName: function(objectKey){
            return objectKey.replace('/', '-') + '-search-results';
        },
        closeSearch: function(){
            jarves.getAdminInterface().closeSearch();
        }
    }
});