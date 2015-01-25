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
            elevator.goToFloor(index);

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

            elevator.on("passing_floor", function() {
               // TODO: decide wether to stop or skip this floor, based on load
                
                //if(passingByUp(elevator, floor.floorNum()) && !elevatorFull(elevator)) {
                //    addUp(elevator, floor.floorNum());
            });
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
            if (!elevator.destinationQueue.length){
                if (elevator.goingUpIndicator()) {
                    var nextStops = _.select(_this.globalQueueUp, function(floorNum){
                        return elevator.currentFloor() <= floorNum;
                    });
                    if (nextStops.length){
                        console.log("nextStops", nextStops);
                        elevator.destinationQueue = nextStops;
                        _this.globalQueueUp = _.difference(_this.globalQueueUp, nextStops);
                        elevator.checkDestinationQueue();
                    } else {
                        elevator.goingUpIndicator(false);                
                        elevator.goingDownIndicator(true);
                    }
                }
                if (elevator.goingDownIndicator()) {
                    var nextStops = _.select(_this.globalQueueDown, function(floorNum){
                        return elevator.currentFloor() >= floorNum;
                    });
                    if (nextStops.length){
                        elevator.destinationQueue = nextStops;
                        _this.globalQueueDown = _.difference(_this.globalQueueDown, nextStops);
                        elevator.checkDestinationQueue();
                    } else {
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