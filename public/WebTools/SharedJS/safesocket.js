//forcefully imports alertMask so anyone using a socket can't easily wreck the heartbeat
var imported = document.createElement('script');
imported.src = '/WebTools/SharedJS/alertMask.js';
document.head.appendChild(imported);

//letting the client know there id
var socketId = '';

//creates a socket and wraps it in a safe socket
function getSafe(tabName)
{
    //creates socket lets server know what tab it is for
    var socket = io(location.origin, {path: '/WebTools/socket.io', query: 'tab_id='+ tabName});

    socket.on('init_'+tabName,function(id)
    {
         socketId = id;  
    }); 

    //actual wrapper methods exposed to client cod
    var safeSocket=
    {
        on : function(key,func)
        {
            if(key == "connect")
            {
	        socket.on(key,func);
            }
            else
            {
                socket.on(tabName + "_" + key,func);
            }
        },
  
        emit : function(key,data)
        {
            socket.emit(tabName + '_' + key, data);
        },

        getPath : function(path)
        {
            return "/tabs/"+tabName+"/index.html/"+socketId+path;
        }
    };

    //heartbeat ping pong function
    socket.on('ping_'+tabName,function()
    {
        socket.emit('pong_'+tabName);
    });

    return safeSocket;
}



