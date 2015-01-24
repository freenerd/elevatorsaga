{
    globalQueueUp: [],
    globalQueueDown: [],
    init: function(elevators, floors) {
        var _this = this;
        var elevator = elevators[0]; // Let's use the first elevator

        elevator.goingUpIndicator(false);
        elevator.goingDownIndicator(true);       
        
        // elevator.otherDirectionQueue = [];
        
        function passingByUp(elevator, floorNum) {
            return (
                elevator.goingUpIndicator() &&
                elevator.currentFloor() <= floorNum
            );
        }
        
        function passingByDown(elevator, floorNum) {
            return (
                elevator.goingDownIndicator() &&
                elevator.currentFloor() >= floorNum
            );
        }

        function addUp(elevator, floorNum) {
            if (!_.contains(elevator.destinationQueue, floorNum)) {
                elevator.destinationQueue.push(floorNum);
                elevator.destinationQueue.sort();
                elevator.checkDestinationQueue();
            }
        }
        
        function addDown(elevator, floorNum) {
            if (!_.contains(elevator.destinationQueue, floorNum)) {
                elevator.destinationQueue.push(floorNum);
                elevator.destinationQueue.sort();
                elevator.destinationQueue.reverse();                
                elevator.checkDestinationQueue();
            }
        }
        
        function addToGlobalQueueUp(floorNum){
            if (!_.contains(_this.globalQueueUp, floorNum)) {
                _this.globalQueueUp.push(floorNum);
            } 
        }
        
        function addToGlobalQueueDown(floorNum){
            if (!_.contains(_this.globalQueueDown, floorNum)) {
                _this.globalQueueDown.push(floorNum);
            } 
        }
        
        function elevatorFull(elevator) {
            return elevator.loadFactor() > 0.6;
        }       
        
        elevator.on("floor_button_pressed", function(floorNum) {
            if (!_.contains(elevator.destinationQueue, floorNum)) {
                if (passingByUp(elevator, floorNum)) {
                    return addUp(elevator, floorNum);
                }
                
                if (passingByDown(elevator, floorNum)) {
                    return addDown(elevator, floorNum);
                }
                
                throw ("unexpected button press", elevator, floorNum);
            }
        });

        elevator.on("passing_floor", function() {
           // TODO: decide wether to stop or skip this floor, based on load
            
            //if(passingByUp(elevator, floor.floorNum()) && !elevatorFull(elevator)) {
            //    addUp(elevator, floor.floorNum());
        });

        elevator.on("idle", function() {
            // TODO: merge array more regularly
            
            if(elevator.goingUpIndicator()) {
                // Changing to going down
                elevator.goingUpIndicator(false);                
                elevator.goingDownIndicator(true);
                
                elevator.destinationQueue = _this.globalQueueDown;
                _this.globalQueueDown = [];
                elevator.destinationQueue.sort();
                elevator.destinationQueue.reverse();
                elevator.checkDestinationQueue();                
            } else {
                // Changing to going up
                elevator.goingUpIndicator(true);                
                elevator.goingDownIndicator(false);
                
                elevator.destinationQueue = _this.globalQueueUp;
                _this.globalQueueUp = [];
                elevator.destinationQueue.sort();
                elevator.checkDestinationQueue();                
            }
        });
        
        _.each(floors, function(floor) {
            floor.on("up_button_pressed", function() {
                addToGlobalQueueUp(floor.floorNum());
            });
            
            floor.on("down_button_pressed", function() {
                addToGlobalQueueDown(floor.floorNum());
            });
        });
    },
    update: function(dt, elevators, floors) {
        var _this = this;
        var elevator = elevators[0];
        
        if (elevator.destinationQueue.length === 0){
            if (elevator.goingUpIndicator()){
                var nextStops = _.select(_this.globalQueueUp, function(floorNum){
                    return elevator.currentFloor <= floorNum;
                });
                //TODO continue here
                console.log("eesdkfjskjdfhsdkjfh", elevator.destinationQueue);
                elevator.destinationQueue += nextStops;
                console.log(elevator.destinationQueue);
            }
            // nimm aus deiner Richtung den current florr und alles in guter richtung
            // wechsel die richtung, nimme alles drunter liegt
            // fehler 5 / 0 beachten
            if (_this.globalQueueUp !== 0){
                elevator.goingUpIndicator(true);                
                elevator.goingDownIndicator(false);
                
                elevator.destinationQueue = _this.globalQueueUp;
                _this.globalQueueUp = [];
                elevator.destinationQueue.sort();
                elevator.checkDestinationQueue(); 
            } else {
                elevator.goingUpIndicator(false);                
                elevator.goingDownIndicator(true);
                
                elevator.destinationQueue = _this.globalQueueDown;
                _this.globalQueueDown = [];
                elevator.destinationQueue.sort();
                elevator.destinationQueue.reverse();
                elevator.checkDestinationQueue(); 
            }
        }
        
        console.log("DT", dt, _this.globalQueueUp, _this.globalQueueDown); 
        elevators.forEach(function(elevator, index){
            console.log(index, elevator.destinationQueue, elevator.goingUpIndicator(), elevator.goingDownIndicator(), elevator.loadFactor());
        });
    }
}