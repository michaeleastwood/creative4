//psuedo class returning a wrapper around a express sub router and socket the wrapper prevents collisions with other tabs
exports.run = function(s,tabName, app, sub_app,config_main)
{
    var socket =s;
    var name = tabName;
    var responds = true;
    var discFunc = null;

    //generates sub_router using soket.id
    app.use('/tabs/' + tabName + '/index.html/'+socket.id,sub_app);
    socket.emit('init_'+name,socket.id);
    socket.on('pong_'+name,function()
    {
        responds = true;
    })
    //object to return
    var sConnect =
    {
        //method witch returns express subrouter not recommeded to be used it is only here to support a handful of otherwise impossible features
        getSubRouter : function()
        {
            return sub_app
	},

	//standard socket methods
        on : function(key,func)
        { 
            if(key == 'disconnect')
            {
                discFunc = func;
                socket.on(key,func);
            }
            else
            {
                socket.on(name + '_' + key,func);
            }
        },
        emit : function(key,data)
        {
            socket.emit(name + '_' + key, data);
        },

        id : socket.id,

        //access to config files for tabs
        config : 
        {
            append : function(name,value)
            {
                config_main.append({name : name, option : value,ns : tabName});
            },
            save : function save()
	    {
		config_main.save();
	    },
            get : function(name)
            {
		return config_main.get({name: name,ns : tabName});
            },
            conditionalSet : function(name,input,normal,range)
            {
                return config_main.conditionalSet(name,input,normal,range,tabName);
            }
        },

        //pinging functions to confirm a tab is still connected 
        disconnect : function()
        {
            if(discFunc != null)
            {
                discFunc.call();
            }

            socket.disconnect();
        },
        getType : function()
        {
 	    return name;
        },

        ping : function()
        {
            socket.emit('ping_'+name,socket.id);
        },

        getResponds : function()
        {
	    return responds;
        },

        setResponds : function(res)
        {  
            responds = res;
        }
    };
return sConnect;
}
