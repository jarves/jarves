import {Directive, angular} from '../../angular.ts';
import Select from "../../fields/Select.ts";
import Jarves from "../../services/Jarves.ts";
import JarvesInterfaceController from "../admin/JarvesInterface.ts";

@Directive('jarvesSelectChooser', {
    restrict: 'E',
    scope: true,
    require: ['^jarvesInterface']
})
export default class JarvesSelectChooser {
    public element;

    public visible:boolean = false;
    protected jarvesSelectFieldController:Select;

    protected jarvesInterface:JarvesInterfaceController;

    constructor(protected jarves:Jarves){
    }

    link(scope, element, attributes, jarvesInterface:JarvesInterfaceController) {
        scope.jarvesSelectChooser = this;
        this.element = element;
        this.jarvesSelectFieldController = scope.selectController;
        this.jarvesSelectFieldController.setJarvesSelectChooser(this);
        this.jarvesInterface = jarvesInterface;
        this.element.detach();

        scope.$on('$destroy', () => this.destruct());
    }

    protected destruct(){
        this.element.detach();
        //detach window resize listener
    }

    public show() {
        this.visible = true;
        angular.element(this.jarvesInterface.getElement()).append(this.element);
        var offset = this.jarvesSelectFieldController.getOffset();
        offset.top += this.jarvesSelectFieldController.getHeight();
        this.element.css(offset);
    }

    public hide() {
        this.visible = false;
        this.element.detach();
    }
}