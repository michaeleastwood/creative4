const fork  = require('child_process');
var process;
var sockets = []
exports.run = function(socket)
{
    if(process == null)
    {
	var time = socket.config.conditionalSet('colorbeat',null,30,[0,3600]);
        console.log(socket.config);
        process = 1;
        process = fork.fork('./public/tabs/Color/ColorJs/server/change.js');
        process.send({data: {color: [3*(Math.random()+1),3*(Math.random()+1),3*(Math.random()+1)], time: time},message : 'color_timings'});
        process.on('message',function(message)
        {
            var data = message.data
	        switch(message.message)
	        {
                case 'color':
                sockets.forEach((socket)=>socket.emit('Color_change',message.data));  
                break; 
	            case 'config':
                process.send({message: 'result',data : socket.config.conditionalSet(data.name,data.input,data.norm,data.range)});
                break; 
            }
    });
    }
    socket.on('disconnect',function()
    {
         sockets = sockets.filter(function(s){return s.id != socket.id})
    })
    sockets.push(socket);
}
