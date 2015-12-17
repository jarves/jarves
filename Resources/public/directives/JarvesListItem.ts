import {Directive, Inject, angular} from '../angular.ts';
import {each} from '../utils.ts';

@Directive('jarvesListItem', {
    restrict: 'E',
    require: ['^jarvesList']
})
export default class JarvesListItem {

    protected element;

    public constructor(protected $compile){

    }

    link(scope, element, attributes, jarvesListController, translcude) {
        var template = jarvesListController.getItemTemplateElement();
        this.element = element;
        element.empty();
        var previousController;

        if (element.prev() && (previousController = element.prev().controller('jarvesListItem'))) {
            if (previousController) {
                var previousSplitHtml = previousController.getSplitHtml();
                var currentSplitHtml = this.getSplitHtml();
                if (false !== previousSplitHtml && false !== currentSplitHtml) {
                    if (currentSplitHtml !== currentSplitHtml) {
                        this.injectSplit(currentSplitHtml);
                    }
                }
            }
        } else {
            var currentSplitHtml = this.getSplitHtml();
            if (false !== currentSplitHtml) {
                this.injectSplit(currentSplitHtml);
            }
        }

        if (template) {
            element.append(template);
            this.$compile(element.children())(scope);
        } else {
            throw 'No <jarves-list-template></jarves-list-template> specified.';
        }
    }

    protected injectSplit(html:string) {
        var splitElement = angular.element(html);
        if (splitElement) {
            var split = angular.element('<jarves-list-item-split></jarves-list-item-split>');
            split.append(splitElement);

            this.element.before(split);
        }
    }

    public getSplitHtml():string|boolean {
        var text = this.element.text();

        if (text) {
            '<b>' + text.trim()[0] + '</b>';
        }

        return false;
    }
}