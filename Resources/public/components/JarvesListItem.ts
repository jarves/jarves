import {Directive, Inject, angular} from '../angular.ts';
import {each} from '../utils.ts';

@Directive('jarvesListItem', {
    restrict: 'E',
    require: ['^jarvesList']
})
export default class JarvesListItem {

    protected element;

    public constructor(protected $compile) {

    }

    link(scope, element, attributes, jarvesListController, translcude) {
        var template = jarvesListController.getItemTemplateElement();
        this.element = element;
        element.empty();

        if (template) {
            var container = angular.element('<a class="jarves-list-item"></a>');
            container.append(template);
            element.append(container);
            this.$compile(element.children())(scope);
        } else {
            throw 'No <jarves-list-template></jarves-list-template> specified.';
        }

        scope.$watch('item', () => this.updateSplit(), true);

    }

    updateSplit() {
        var previousController;

        if (this.element.prev() && (previousController = this.element.prev().controller('jarvesListItem'))) {
            var previousSplitHtml = previousController.getSplitHtml();
            var currentSplitHtml = this.getSplitHtml();
            if (null !== previousSplitHtml && null !== currentSplitHtml) {
                if (previousSplitHtml !== currentSplitHtml) {
                    this.injectSplit(currentSplitHtml);
                }
            }
        } else {
            var currentSplitHtml = this.getSplitHtml();
            if (null !== currentSplitHtml) {
                this.injectSplit(currentSplitHtml);
            }
        }
    }

    protected lastSplit = null;
    protected lastSplitHtml = null;

    protected injectSplit(html:string) {

        if (this.lastSplitHtml === html) {
            return;
        }

        if (this.lastSplit) {
            this.lastSplit.remove();
        }

        var splitElement = angular.element(html);
        if (splitElement) {
            var split = angular.element('<jarves-list-item-split></jarves-list-item-split>');
            split.append(splitElement);

            this.element.prepend(split);
            this.lastSplit = split;
            this.lastSplitHtml = html;
        }
    }

    public getSplitHtml():string {
        var text = this.element.text();

        if (text) {
            return '<b>' + text.trim()[0] + '</b>';
        }

        return null;
    }
}