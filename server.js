const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets; // socket.io being run on port

// Connecting to mongo 
mongo.connect('mongodb://127.0.0.1/Chatapp', function(err, db){ //db used to run queries
    if(err){
        throw err; //if error, throw error 
    }

    console.log('MongoDB connected'); //displaying within console 

    // establishing connection with socket.io
    client.on('connection', function(socket){
        let text = db.collection('texts'); // db collection of text messages

        // function that sends status
        statusSend = function(s){
            socket.emit('status', s); // emit for passing something from server to client
        }

        // retreiving chats from collection 
        text.find().limit(50).sort({_id:1}).toArray(function(err, res){ // mongodb // query
            if(err){
                throw err;
            }

            // emit user's texts
            socket.emit('output', res); // res = result from query above
        }); 

        // handling input events that occur 
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            // make sure user enters both name and message 
            if(name == '' || message == ''){
                // else send error
                statusSend('Enter a name and message');
            } else{
                //  insert message into correct variables
                text.insert({name: name, message: message}, function(){ // passing in objects
                    client.emit('message', [data]);

                    // sending the status object 
                    statusSend({
                        message: 'Sent Message',
                        clear: true
                    });

                }); 
            }
        });

        // clearing the messages (otherwise will extend down screen)
        socket.on('clear', function(data){
            // text removal 
            text.remove({}, function(){
                socket.emit('cleared'); // communicating with socket.io using emit - important
            });
        });
    });
});