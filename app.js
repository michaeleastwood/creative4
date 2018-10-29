var express = require('express');
var http = require('http');
var path = require('path');
var server = require('socket.io')
var glob = require('glob');
var fs = require('fs');
var safesocket = require('./SharedModules/safesocket.js');
var config = require(path.resolve('./SharedModules/config.js'));
var _ = require('underscore');
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var globRequires = [];
var oldGlobs = {objs : [], maxGen : 0};
var appSockets = [];
var mainSockets = [];



//handles all exceptions without crashing
process.on('uncaughtException', function(e) {
  console.error('Error: ' + e);
});

//loads config file
config.init();

//loads up tabs
load();

//reads command line
var opts = require('optimist')
    .options({
        port: {
            demand: false,
            alias: 'p',
            description: 'webtools listen port'
        },
        heartbeat: {
            demand: false,
            alias: 'f',
            description: 'heartbeat frequency in seconds between 2 and 3600'
        },
    }).boolean('allow_discovery').argv;



//reads config file if value is set there if value is set in terminal sets config if both are empty defaults
opts.heartbeat = config.conditionalSet('heartbeat',opts.heartbeat,30,[30,3600]);
opts.port = config.conditionalSet('port',opts.port,80);

var clearLoop = setInterval(clearOld, opts.heartbeat * 1000);

//setting up webserver and socket.io
var httpserv;
var app = express();
//setting up main directory
app.use('/', express.static(path.join(__dirname, 'public')));
//listenting on http on port found in command line or config file
httpserv = http.createServer(app).listen(opts.port, function() 
{
     console.log('http on port ' + opts.port);
});
var io = server(httpserv,{path: '/WebTools/socket.io'});
//on new sockete connection
io.on('connection', function(socket)
{
    var request = socket.request;
    var id = request._query['tab_id'];
    var current_date = new Date();
    //main socket
    if(!id)
    {
	//adds socket to main socckets and adds the main events to the socket
        mainSockets.push(socket);
        console.log(current_date +"  ID: "+socket.id+ '  Connection accepted.\n');

        socket.on('disconnect', function() 
        {
            console.log(current_date + "  ID: " + socket.id + "  ENDED\n");
        }); 
    
        socket.on('tabs',function()
        {
            socket.emit('tabSync', buildTabs());
        });

        socket.on('reload',function()
        {
            update(socket);
        });
        
    } 
    //tab socket 
    else
    {
	//finds loaded backend
        globRequires.forEach(function(tab)
        {
            if(tab.name == id)
            {
		//creates new safe socket from a new subdirectory and socket then runs the tab with this safe socket
                var sub_app = express();
                sSocket = safesocket.run(socket,id,app,express(),config);
                appSockets.push(sSocket);
                tab.backend.run(sSocket);
            }
        });
    }
    
});



//loads in files
function load(files, reset)
{
    //establishing defaults for inputs, has to be done messily in node :(
    files = typeof files  !== 'undefined' ? files : glob.sync('./public/tabs/*/*.js');
    reset = typeof reset  !== 'undefined' ? reset : true;

    //resets all tabs
    if(reset)
    {
        globRequires = []
    }

    files.forEach(function(file)
    {
	//imports file
        backend = require(path.resolve(file));
        
	//finds path to file
        path_names = file.split('/');
        tab_name = path_names[path_names.length -2];
        short_path = file.substring(0,file.indexOf(path_names[path_names.length -1]));

        //loads whatever index.html is in the same directory if none is fount it defaults to home.html
        html = short_path + 'index.html';
        if(!fs.existsSync(html))
        {
	    console.log('no html detected for ' + tab_name + ' loading default home page!!!');
            html = '/home.html';
        }
        
        //pushes all of the tabs relevent data to globRequires
        html = html.replace('./public','');
        globRequires.push(
        {
            name : tab_name,
            html : html,
            backend : backend,
            file : file,
            stat : fs.statSync(file)
        });
    });
}


//builds tabs to be sent to the client
function buildTabs(filter)
{
    //establishing defaults for inputs, has to be done messily in node :(
    filter = typeof filter  !== 'undefined' ? filter : function(name){ return true};
    var tabs = [];

    //for each tab if filter push client content to output
    globRequires.forEach(function(tab)
    {
           
        if(filter.call(this,tab.file))
	{
            tabs.push(
            {
                name : tab.name,
                html : tab.html
            });
        }
    });
    return tabs;
}

function update(socket)
{
    //establishes output that will be pushed to the console
    var output = '';

    //checks for any changes in tab src
    var src = src_change();
    if(src[0].length+src[1].length+src[2].length>0)
    {
         output += 'Updating Tabs\nUpdating ' + src[0] + '\nAdding ' + src[1] + '\nRemoving ' + src[2] + '\n';
         var deadGlobs = [];
         
         //if src was modified or removed
         if(src[0].length + src[2].length > 0)
         {
	     //add a new generation
             pushGens();
             var globGeneration = [];
             var genSockets = [];

	     //forEach tab
             globRequires.forEach(function(tab)
             {
		  //if this tabs src was removed or modified
                  if(includes(src[0],tab.file)||includes(src[2],tab.file))
                  {
		       //preserves cache in  generation
                       globGeneration.push({obj: require.cache[path.resolve(tab.file)], tab: tab});

                       //preserves active sockets on this generation
                       appSockets.filter(function(e)
                       { 
		           return e.getType() == tab.name; 
                       }).forEach(function(gen_to_die)
                       {
			   genSockets.push(gen_to_die);
                       });
		       //logs globs to be removed from next generation
                       globRequires.filter(function(e)
                       { 
		           return e.name == tab.name; 
                       }).forEach(function(to_die)
		       {
		           deadGlobs.push(to_die);
                       });
		       //removes old src from cache
                       delete require.cache[path.resolve(tab.file)];
                  }
             });
	     //removes now outdated sockets from next generation
             genSockets.forEach(function(s)
	     {
	          appSockets.splice(appSockets.indexOf(s),1); 
	     });
            
	     //pushes the now parent generation into oldGlobs
             oldGlobs.objs.push(
	     {
	      objs : globGeneration,
              genSockets : genSockets,
              gen : 1
	     });
         }
         //logs removed tabs then removes them along with modified tabs from current genreation
	 var removed_tabs = buildTabs(function(name)
	 { 
	     return includes(src[2],name);
	 });

	 deadGlobs.forEach(function(g)
         {
             globRequires.splice(globRequires.indexOf(g),1) ;
         });

         //loads new and modified tabs and logs them, by loading the tabs they are added to the current generation
         load(src[0],false);
         load(src[1],false);
         var updated_tabs = buildTabs(function(name)
	 { 
	     return includes(src[0],name);
         });
	
         var added_tabs = buildTabs(function(name)
         { 
	     return includes(src[1],name)
	 });

         //notifies potentially unaware users to the changes
         mainSockets.forEach(function(current_socket)
         {
              if(socket == null || current_socket.id != socket.id)
              {
                  current_socket.emit('unexpectedUpdate',{updated_tabs : updated_tabs, added_tabs : added_tabs, removed_tabs : removed_tabs});
              }
         });

         //if a user intiated the update there client is automaticly updated
         if(socket != null)
         {
              socket.emit('tabSync', updated_tabs.concat(added_tabs));
              socket.emit('removeTabs',removed_tabs);
              socket.emit('message','WebTools succesfully updated');
         }
    }

    else if(socket != null)
    {
	//if there is no source change and a user attempted the update they are notified
        socket.emit('message','no changes detected to the server note that changes to client files do not require a reset just reload your browerser tab');
    }

    else
    {
	//if the console attempted the update the message is pushed to the console
        output += 'no changes detected to the server note that changes to client files do not require a reset just reload your browerser tab';
    }

    return output;
}

//moves all generation in old generation up by one for example parent becomes grandparent or 1 becomes 2
function pushGens()
{
    oldGlobs.maxGen = oldGlobs.maxGen + 1;
    oldGlobs.objs.forEach(function(gen)
    {
        gen.gen = gen.gen + 1;
    });
}

//removes a generation then reduces all older generations by one
function pullGen(pullGen)
{
    newGlobs = [];
    oldGlobs.maxGen = oldGlobs.maxGen -1;
    oldGlobs.objs.forEach(function(gen)
    {
        if(gen.gen > pullGen)
        {
            gen.gen = gen.gen - 1;
            newGlobs.push(gen);
	}
        else if(gen.gen < pullGen)
        {
            newGlobs.push(gen);
        }
    })
    oldGlobs.objs = newGlobs;
}

//detects if tab src has changed 
function src_change()
{
    files = glob.sync('./public/tabs/*/*.js');
    //results[0] = modified, results[1] = added, results[2] = removed
    var results = [];
    var updated = []
    var added = [];
    var removed = [];
    
    //compares current file structure and meta data to file structure and meta data at time of load to determine changes
    files.forEach(function(file)
    {
        var exists = false;
        var same = false;
        globRequires.forEach(function(glob)
        {
            if(path.resolve(glob.file) == path.resolve(file))
            {
                exists = true;
                if(!_.isEqual(glob.stat, fs.statSync(file)))
                {
                    updated.push(file);
                }
            }        
        })   
        if(!exists)
        {
            added.push(file);
        }
    })
    globRequires.forEach(function(glob)
    {
        var exists = false;
        files.forEach(function(file)
        {
	    if(path.resolve(glob.file) == path.resolve(file))
            {
                exists = true;
            }
	})
        if(!exists)
        {
             removed.push(glob.file);
        }
    })
    results.push(updated);
    results.push(added);
    results.push(removed);
    return results;
}




//async function that allows heart beat to change with config file
var hbeatChange = async(function()
{ 
    return new Promise(function(res,rej)
    {
	//compares old and new heart beats and documents them
        var old = clearLoop._idleTimeout/1000;
        var beat = config.conditionalSet('heartbeat',null,30,[30,3600]);
        res({change : (beat != old),beat: beat, old: old});
    });
});


//clears away old client connections and tabs
function clearOld()
{ 
    //checks for heartbeat change in config file if change is detected heartbeat is updated
    hbeatChange().then(function(obj)
    {
         if(obj.change)
	 {
	     clearInterval(clearLoop);
             console.log('heart beat moved ' + obj.old + ' -> ' + obj.beat);
	     clearLoop = setInterval(clearOld,obj.beat * 1000);
	 }
    });

    var changed = false;
    var inputSockets = [];
    for(var i = 0; i<oldGlobs.maxGen+1;i++)
    {
	//reads in generations sockets
        if(i == 0)
        {
    	    inputSockets = appSockets;
        }
        else
        {
   	    inputSockets = oldGlobs.objs[i-1].genSockets;
	}
 
        //pings generations sockets
	inputSockets.forEach(function(connection)
	{
    	    connection.setResponds(false);
    	    connection.ping();
	});
        
        //immidate execute function to presere i inside timeout
        (function(index){
            //checks for socket response removes unresponive sockets empty generations are removed
	    setTimeout(function()
	    {
                var iSockets;
                if(index == 0)
                {
    	            iSockets = appSockets;
                }
                else
                {
   	            iSockets = oldGlobs.objs[index-1].genSockets;
	        }

    	        var finalSockets= [];
    	        iSockets.forEach(function(connection)
    	        {
        	    if(!connection.getResponds())
        	    { 
                        changed = true;
                        for (k in app.stack) 
			{
        	            if (app.stack[k].route + "" == '/tabs/' + connection.getType() + '/index.html/'+connection.id+ "") 
			    {       
    		                app.stack.splice(k,1);
                                break;
                            }
                        }
        
             	        connection.disconnect();
             	        connetion = null;
        	    }
              	    else
        	    {
             	        finalSockets.push(connection);
               	    }
                }) 
                if(index == 0)
                {
    	            appSockets = finalSockets;
                }
                else
                {
		    oldGlobs.objs[index-1].genSockets = finalSockets;
                }
	    }, 10000);
        })(i)

    }
    
    //detects unneeded tabs in generatios and removes them
    setTimeout(function()
    {
         if(changed)
         {
             oldGlobs.objs.forEach(function(gen)
             {
                 if(gen.genSockets.length == 0)
                 {
                     pullGen(gen.gen);
                     console.log("Generation "+ gen.gen + " has been pulled\n");
                 }
                 else
                 {
                     var unNeededObjs = [];
                     gen.objs.filter(function(tab)
                     {
                         var objNeeded = false;
                         gen.genSockets.forEach(function(sock)
                         {
                             if(sock.getType() == tab.tab.name)
                     	     {
			         objNeeded = true;
			     }
		         })
                         return !objNeeded
  	             }).forEach(function(unNeeded){unNeededObjs.push(unNeeded)});
                     unNeededObjs.forEach(function(unNeeded)
		     {
                         console.log('Generation ' + gen.gen + ' tab ' +  unNeeded.tab.name + ' pulled');
		         var index = gen.objs.indexOf(unNeeded);
                         delete gen.objs[index].obj;
                         gen.objs.splice(index,1);
		     })
              
                 }
             })
         }
    }, 10500);
}

//includes helper function because this version of node does not have on :(
function includes(arr,value)
{
    var toReturn = false;
    arr.forEach(function(val)
    {
        if(val == value)
        {
            toReturn = true;
        } 
    })
    return toReturn;
}


//handle input
var stdin = process.openStdin();

//adds some limited commands to node console
stdin.addListener("data", function(d) {
    var input = d.toString().trim().toLowerCase();
    var output = "\n\nyou entered: [" + 
        input + "]\n\nreponse:\n"
    switch(input)
    {
        case 'connections':
            output += '\n----Current Connections----\n';
            var tab_names = ''
         
            globRequires.forEach(function(tab)
            {
                tab_names += '['+tab.name+'] ';
  	    });
 
            output += '\n  --Generation 0-- active tabs:'+ tab_names+ '\n';

            appSockets.forEach(function(connection)
            {
                 output += ('    ' + connection.getType() + ' Socket: ' + connection.id + '\n');
            });

            oldGlobs.objs.forEach(function(gen)
            {
                tab_names = '';

                gen.objs.forEach(function(tab)
                {
                    tab_names += '['+tab.tab.name+'] ';
  	        });

                output += '\n  --Generation ' + gen.gen + '-- active tabs:' + tab_names + '\n';

                gen.genSockets.forEach(function(connection)
                {
                    output += ('    ' + connection.getType() + ' Socket: ' + connection.id + '\n');
                });
            });
            output += '\n\n----END----';
            break;
        
        case 'reset':
            output += reset();
            break;

        default:
            output += "Unrecognized Command";
            break;
    } 
    console.log(output+'\n\n');
  });
