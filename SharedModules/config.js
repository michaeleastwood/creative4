var config;
var fs = require('fs');
var async = require('asyncawait/async');
var sync = require('sync');
var _ = require('underscore');

//called on init
exports.init = function()
{
    //creates and unlocks folder if it does not exist
    if(!fs.existsSync('./config'))
    {
	fs.mkdirSync('./config');
        fs.chmod('./config', 0777);
    }

    //creates and unlocks file if it does not exist
    if(!fs.existsSync('./config/config.json'))
    {
	fs.writeFileSync('./config/config.json','{}');
	fs.chmod('./config/config.json', 0777);
    }
    //waits for config to be free
    sync(await_openable());
    
    //sets up main json utility easy-config
    config = require('easy-config');
}

//adds to the config file
var append = function(option)
{
    //waits for the file to be  free
    sync(await_openable());
    
    //creates namespace for tab otions
    if(option.ns != null)
    {
        if(config.ns == null)
	{
	    config.ns = {};
	}
         //appends option and saves
	if(config.ns[option.ns] == null)
	{
	    config.ns[option.ns] = {};
	}
        config.ns[option.ns][option.name] = option.option;
        save();
    }
 
    //speacial case for non tab config option outside of ns
    else
    {
	config = config.extend({[option.name] : option.option});
        save();
    }
}

//saves to hard drive
var save= function()
{
    //waits for file to be free if there is changes new file is saved
    sync(await_openable());
    if(!_.isEqual(config,config.loadConfig(null,true)))
    {
        config.writeConfigFile('config.json',config);
    }
}


//reads an option
var get = function(option)
{
    sync(await_openable);
    //loads file
    config = config.loadConfig(null,true);
    //checks for any ns option tabs
    if(option.ns != null)
    {
        if(config.ns == null)
	{
	    config.ns = {};
	}
	if(config.ns[option.ns] == null)
	{
	    config.ns[option.ns] = {};
	}
        return config.ns[option.ns][option.name];
    }
    //speacial case for non tab config options
    else return config[option.name];
}

//a way to set a value with a default an overide and an acceptable range

var conditionalSet= function(name,input,normal,range,ns)
{
    //gets current value in config
    var current_get = get({name: name, ns: ns});
    
    //confirms invalid input aka input needs to be modified before return
    if(input == null || range != null && (input < range[0] || input > range[1]))
    {
        
        //if the value is not already in config return normal
        if(current_get == null)
        {
            input = normal;
        }

        //if the range makes sense for a stored value return the stored value
        else if(range == null || range != null && (current_get >= range[0] && current_get <= range[1]))
	{
            input = current_get;
	}

        //default case
        else
        {
            input = normal;
            
        }
    }
    //adds and saves the option
    append({name : name, option : input, ns : ns});
    
    //returns the final value
    return input;
}

//checks every 100 ms to see if the file is free returns once the file is free
var await_openable = async(function()
{
    return new Promise(function(res)
    {
        var testloop = setInterval(function()
	{
             try
	     {
	        fs.openSync('./config/config.json')
                fs.closeSync('./config/config.json')
		clearInterval(testLoop);
                res();
             }
             catch(error){} 
	},100);
    });
});

//exposes all methods to the outside
exports.append = append;
exports.save = save;
exports.get = get;
exports.conditionalSet = conditionalSet;

