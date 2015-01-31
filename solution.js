{
    globalQueueUp: [],
    globalQueueDown: [],
    init: function(elevators, floors) {
        var _this = this;
                
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
        
        _.each(elevators, function(elevator, index) {
            elevator.goingUpIndicator(true);
            elevator.goingDownIndicator(false);

            elevator.on("floor_button_pressed", function(floorNum) {
                if (!_.contains(elevator.destinationQueue, floorNum)) {
                    if (passingByUp(elevator, floorNum)) {
                        return addUp(elevator, floorNum);
                    }
                    
                    if (passingByDown(elevator, floorNum)) {
                        return addDown(elevator, floorNum);
                    }
                    
                    return elevator.goToFloor(floorNum, true);
                }
            });

            elevator.on("passing_floor", function(floorNum, direction) {
                // TODO: decide wether to stop or skip this floor, based on load
                if (!(direction === "up" && elevator.goingUpIndicator()) && !(direction === "down" && elevator.goingDownIndicator())) console.log("direction and elevator not the same");
                if (direction === "up" && elevator.goingUpIndicator() && !elevatorFull(elevator)){
                    if (_.contains(_this.globalQueueUp, floorNum)){
                        elevator.goToFloor(floorNum, true);
                        _.pull(_this.globalQueueUp, floorNum); // removen oderso 
                    }
                }
                  if (direction === "down" && elevator.goingDownIndicator() && !elevatorFull(elevator)){
                    if (_.contains(_this.globalQueueDown, floorNum)){
                        elevator.goToFloor(floorNum, true);
                        _.pull(_this.globalQueueDown, floorNum); // removen oderso 
                    }
                }
            });

            elevator.on("stopped_at_floor", function(floorNum){
                if (floorNum === floors.length - 1){
                    elevator.goingUpIndicator(false);                
                    elevator.goingDownIndicator(true);
                }
                if (floorNum === 0){
                    elevator.goingUpIndicator(true);                
                    elevator.goingDownIndicator(false);
                }
            })
        });
        
        _.each(floors, function(floor) {
            floor.on("up_button_pressed", function() {
                addToGlobalQueueUp(floor.floorNum());

                // if (floor.floorNum() === 0) {
                //     addToGlobalQueueDown(floor.floorNum());
                // } else {
                //     addToGlobalQueueUp(floor.floorNum());
                // }
            });
            
            floor.on("down_button_pressed", function() {
                addToGlobalQueueDown(floor.floorNum());
                // if (floor.floorNum() === (floors.length - 1)) {
                //     addToGlobalQueueUp(floor.floorNum());
                // } else {
                //     addToGlobalQueueDown(floor.floorNum());
                // }
            });
        });
    },
    update: function(dt, elevators, floors) {
        var _this = this;
        _.each(elevators, function(elevator, index) {
            if(!elevator.destinationQueue.length && !_this.globalQueueUp.length && !_this.globalQueueDown){
                return; //nothing to do, just wait
            }
            if (!elevator.destinationQueue.length ){
                if (elevator.goingUpIndicator()) {
                    var nextStops = _.select(_this.globalQueueUp, function(floorNum){
                        return elevator.currentFloor() <= floorNum;
                    });
                    if (nextStops.length){
                        var nextStop = _.max(nextStops);
                        elevator.goToFloor(nextStop);
                        _.pull(_this.globalQueueUp, nextStop);
                    } else {
                        var nextDownStops = _.select(_this.globalQueueDown, function(floorNum){
                            return elevator.currentFloor() <= floorNum;
                        });
                        console.log("nDs", nextDownStops); // TODO all elevators seem to get the same floor. Does pull not work?
                        if (nextDownStops.length){
                            nextStop = _.min(nextDownStops);
                            elevator.goToFloor(nextStop);
                            _.pull(_this.globalQueueDown, nextStop); 
                        }
                        elevator.goingUpIndicator(false);                
                        elevator.goingDownIndicator(true); 
                    }
                } else { // elevator probably going down
                    var nextStops = _.select(_this.globalQueueDown, function(floorNum){
                        return elevator.currentFloor() >= floorNum;
                    });
                    if (nextStops.length){
                        var nextStop = _.min(nextStops);
                        elevator.goToFloor(nextStop);
                        _.pull(_this.globalQueueDown, nextStop); 
                    } else {
                        nextStops = _.select(_this.globalQueueUp, function(floorNum){
                            return elevator.currentFloor() >= floorNum;
                        });
                        if (nextStops.length){
                            var nextStop = _.max(nextStops);
                            elevator.goToFloor(nextStop);
                            _.pull(_this.globalQueueUp, nextStop); 
                        }
                        elevator.goingUpIndicator(true);                
                        elevator.goingDownIndicator(false);
                    }
                }

            }
        });

        
        console.log("DT", dt, _this.globalQueueUp, _this.globalQueueDown); 
        elevators.forEach(function(elevator, index){
            console.log(index, elevator.destinationQueue, elevator.goingUpIndicator(), elevator.goingDownIndicator(), elevator.loadFactor());
        });
    }
}