DOMEvent.implement({
    isMiddleClick: function(){
        // Add which for click: 1 === left; 2 === middle; 3 === right
        var button = this.event.button;
        if (!this.event.which && button !== undefined) {
            this.event.which = (button & 1 ? 1 : (button & 2 ? 3 : (button & 4 ? 2 : 0)));
        }
        return 2 === this.event.which;
    }
});
