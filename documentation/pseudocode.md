##Pseudocode for Battleship

// Generate the battleship for each player
CLASS Ship

    STATIC VARIABLE shipName // List all the ship names

    CONSTRUCTOR ()
        // Initialize all ships with their properties (size, name, hit count)
    END CONSTRUCTOR

    METHOD hit(shipName)
        // Validate if the shipName is in the static variable
        // If valid, now check if the ship hasn't been sunk yet
        // If it hasn't been sunk yet, add 1 on the hit count
        // Call isSunk(shipName) method
    END METHOD

    METHOD isSunk(shipName)
        // Compare the ship's size and hit count
        // If the hit count and size are equal, add sunk = true to the ship
    END METHOD

END OF CLASS

CLASS GameBoard
CONSTRUCTOR ()
// Generate the gameboard using Array.from and another Array.from from inside of it
// Create a "shipTracker" map for the ships with the key as the ship name and the properties as the position coordinates
// Create a tracker for sunk ships
// Create a tracker for missed attacks - including the coordinates
END OF CONSTRUCTOR

    METHOD placeShip({ship, direction, loc})
        // If the ship.name is already in the shipTracker map, throw error (DONE)
        // If the ship is not a valid ship, throw error
        // If the ship size goes out of bounds by checking loc, throw error
        // If the ship collides with another ship or goes out of bounds by checking ship.size, direction, and loc, throw error
        // If direction is != to horizontal or vertical, throw error

        // Place the ship
        // For vertical placement, iterate over rows starting at loc to place ship segments
        // For horizontal placement, iterate over columns starting at loc to place ship segments
        // Update the shipTracker map - pass the shipName as the key and the shipObc as the value

    END OF METHOD

    METHOD receiveAttack (loc)
        // If the location is out of bounds, throw error.

        // Retrieve the array based on location
        // If an object is present, check if its already hit
        // If the object has a hit: true, throw an error

        // If the object has not yet hit, add a hit: true, then check if the ship name is also there.
        // call updateShipMethod


        // If the object is not present, add an object with a property of hit: true;
        // Update the missed attacks tracker

    END OF METHOD


    METHOD updateShip(shipName) {
        // Call the shipTracker map, retrieve the value and call the hit method
        // Call checkAllShips method
    }

    METHOD checkAllShips ()
        // Iterate over this.shipTracker and check each isSunk if all of it has been sunk;
        // If everything is sunk, call gameOver method
    END OF METHOD

    METHOD gameOver() {
        // Game over
    }


    CLASS Player {
        constructor (playerName) {
            // Create player object
            // Create an instance of Ship
            // Create an instance of Gameboard
        }
    }
