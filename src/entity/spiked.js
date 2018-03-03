var Cell = require('./Cell');

function PlayerCell() {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    this.virusshield = 0;
    this.cellType = 2;
}

module.exports = PlayerCell;
PlayerCell.prototype = new Cell();

// Main Functions

PlayerCell.prototype.visibleCheck = function(box,centerPos) {
    // Use old fashioned checking method if cell is small
	if (this.mass < 150) {
	    return this.collisionCheck(box.bottomY,box.topY,box.rightX,box.leftX);
	}
	
	// Checks if this cell is visible to the player
    var len = this.getSize() + box.width >> 0; // Width of cell + width of the box (Int)
    
    return ((this.position.x - centerPos.x) < len) && 
           ((this.position.y - centerPos.y) < len);
}

PlayerCell.prototype.calcMergeTime = function(base) {
    this.recombineTicks = base + ((0.01 * this.mass) >> 0); // Int (30 sec + (.02 * mass))
}

// Override

PlayerCell.prototype.onConsume = function(consumer,gameServer) {
   
  var client = consumer.owner;
    var maxSplits = Math.floor(consumer.mass/16) - 1; // Maximum amount of splits
    var numSplits = 600 - client.cells.length; // Get number of splits
    numSplits = Math.min(numSplits,maxSplits);
    var splitMass = Math.min(consumer.mass/(numSplits + 1), 32); // Maximum size of new splits
    
    // Cell consumes mass before splitting
    consumer.addMass(this.mass);
    
    // Cell cannot split any further
    if (numSplits <= 0) {
        return;
    }
    
    // Big cells will split into cells larger than 32 mass (1/4 of their mass)
    var bigSplits = 0;
    var endMass = consumer.mass - (numSplits * splitMass);
    if ((endMass > 300) && (numSplits > 0)) {
        bigSplits++;
        numSplits--;
    } 
    if ((endMass > 1200) && (numSplits > 0)) {
        bigSplits++;
        numSplits--;
    }
    
    // Splitting
    var angle = 0; // Starting angle
    for (var k = 0; k < numSplits; k++) {
        angle += 6/numSplits; // Get directions of splitting cells
        gameServer.newCellVirused(client, consumer, angle, splitMass,150);
        consumer.mass -= splitMass;
    }
    
    for (var k = 0; k < bigSplits; k++) {
        angle = Math.random() * 6.28; // Random directions
        splitMass = consumer.mass / 4;
        gameServer.newCellVirused(client, consumer, angle, splitMass,18);
        consumer.mass -= splitMass;
    }
}

PlayerCell.prototype.onAdd = function(gameServer) {
    // Add to special player node list
    gameServer.nodesPlayer.push(this);
    // Gamemode actions
    gameServer.gameMode.onCellAdd(this);
}

PlayerCell.prototype.onRemove = function(gameServer) {
    var index;
    // Remove from player screen
    index = this.owner.cells.indexOf(this);
    if (index != -1) {
        this.owner.cells.splice(index, 1);
    } else {
        console.log("[Warning] Tried to remove a non existant cell from cell list.");
    }
    // Remove from visible list
    index = this.owner.visibleNodes.indexOf(this);
    if (index != -1) {
        this.owner.visibleNodes.splice(index, 1);
    }
    // Remove from special player controlled node list
    index = gameServer.nodesPlayer.indexOf(this);
    if (index != -1) {
        gameServer.nodesPlayer.splice(index, 1);
    } else {
        console.log("[Warning] Tried to remove a non existant cell from player nodes.");
    }
    // Gamemode actions
    gameServer.gameMode.onCellRemove(this);
}

PlayerCell.prototype.moveDone = function(gameServer) {
	this.setCollisionOff(false);
}
