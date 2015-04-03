Simple implementation of a structured p2p network using DHT.
The system uses the chord archtecture, without any fingertables,
so it is only forward looking.
In depth description at: http://en.wikipedia.org/wiki/Chord_%28peer-to-peer%29

To run the program you need to have node installed.

Running the system.
--> In terminal go to location of files.

--> start the system by calling:# node chord

--> initalize first node by calling:# init

--> join new nodes by calling:# join (ip of node to join) (port of node to join)

--> simple web interface of each peer with info can be found on ip:port/info
