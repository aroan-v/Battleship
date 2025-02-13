// CLASS: Ship
CLASS Ship
STATIC VARIABLE shipNames // List of valid ship names

    CONSTRUCTOR ()
        // Initialize all ships with their properties (size, name, hit count)
    END CONSTRUCTOR

    METHOD hit(shipName)
        // Check if shipName is valid
        // If valid, increase hit count
        // If hit count reaches ship size, mark ship as sunk
    END METHOD

END CLASS

CLASS GameBoardDom

    STATIC METHOD generateBlockDom



    //

    CONSTRUCTOR(ARRAY)
        // Generate the table of divs of divs based on the given array
    END CONSTRUCTOR

    METHOD generateBlockDom(blockArray)
        // Create a new div based from the CellDom Class
    END METHOD

    // TODO inject a function call to the object so it can be activated when a ship is placed

END CLASS

FACTORY FUNCTION CellDom
// create a new div
// put the coordinates in the div attribute
// attach the event listener
