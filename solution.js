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
                // extra behandlung von calls von floor 0
                if(passingByUp(elevator, floor.floorNum()) && !elevatorFull(elevator)) {
                    addUp(elevator, floor.floorNum());
                } else {
                    _this.globalQueueUp.push(floor.floorNum());
                }
            });
            
            floor.on("down_button_pressed", function() {
                // extra behandlung von calls von floor MAX
                if(passingByDown(elevator, floor.floorNum()) && !elevatorFull(elevator)) {
                    addDown(elevator, floor.floorNum());
                } else {
                    _this.globalQueueDown.push(floor.floorNum());
                }
            });
        });
    },
    update: function(dt, elevators, floors) {
        var _this = this;
        console.log("DT", dt, _this.globalQueueUp, _this.globalQueueDown); 
        elevators.forEach(function(elevator, index){
            console.log(index, elevator.destinationQueue, elevator.goingUpIndicator(), elevator.goingDownIndicator(), elevator.loadFactor());
        });
    }
}