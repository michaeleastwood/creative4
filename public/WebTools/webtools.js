//main socket
var socket = io(location.origin, {path: '/WebTools/socket.io'});

//reloads current tab
var locked = false;
function resetTab()
{
    var tabcontent = document.getElementsByClassName("tabcontent");
    for (var index = 0; index < tabcontent.length; index++) 
    {
        if((tabcontent[index].style.zIndex == "1" || tabcontent[index].style.zIndex == 1) && !locked)
        {
            //locks tab while reset is happening
	    locked = true;

            //clones tabs data
            div = tabcontent[index];
            inner = div.innerHTML;
            id = div.id;
            className = div.className;
	    div.parentNode.removeChild(div);

            //inserts tabs data into a fresh div
            var div = document.createElement("div");
      	    div.id = id;
            div.className = className;
            div.innerHTML = inner;
            div.style.zIndex = "1";
           
            //inserts fresh div into the document
            document.body.appendChild(div);
            var target = 'data="';
            var targetIndex = inner.indexOf(target) +target.length;
            var endIndex = inner.indexOf('html"',targetIndex)+4;
            var input = inner.substring(targetIndex,endIndex)+"\n";

            //removes tab if get request fails(no response within 500 ms) note instantly executin funtion to pass in input or html
            (function(html)
            {
                if(tabcontent[index].id != "Home")
                {
                    
                    setTimeout(function(){
			//unlocks  tab reset is now complete
			locked = false;
			//check for empty contentDocument
                        if(div.firstChild.contentDocument == null || div.firstChild.contentDocument == null || div.firstChild.contentDocument.body.innerHTML == 'Cannot GET ' + html)
	                {
			    //remove related elements in case of empty document(usally after a reset removes a tab)
                            btn = document.getElementById('btn_'+div.id.substring(4,div.id.length));
                            btn.parentNode.removeChild(btn);
		            div.parentNode.removeChild(div);
                            document.getElementsByClassName("tabcontent")[0].style.zIndex = "1";
                        }
                    },500);
                 }
             })(input);
        }
    }
}

//sets what tab is in the foreground
function openTab (tabName) 
{
    //gets a container in the document that holds all tabs
    var tabcontent = document.getElementsByClassName("tabcontent");

    //sets all tabs to  zIndex of 0 (zIndex is used rather than visible so tabs can be executing in the background)
    for (var index = 0; index < tabcontent.length; index++) 
    {
        tabcontent[index].style.zIndex = "0";
        if(tabcontent[index].firstChild.contentDocument != null)
        {
  	     tabcontent[index].firstChild.contentDocument.body.style.zIndex = "0";
        }
    }
    
    //gives the selected tab a Zindex of 1
    document.getElementById(tabName).style.zIndex = "1";
    if(document.getElementById(tabName).firstChild.contentDocument != null)
    {
	//finds and focuses any auto focus elements in the tab
	var childs = document.getElementById(tabName).firstChild.contentDocument.body.children;
        document.getElementById(tabName).firstChild.contentDocument.body.style.zIndex = "1";
        for(var index =0; index < childs.length; index++)
	{
	    if(childs[index].attributes.autofocus != null)
	    {
	  	childs[index].focus();
	    }
	}
    }
}

window.onload = function()
{
    //alerts mobile users that they are probably in for a bad time
    if(mobileCheck())
    {
       alert('you are using a mobile device and while this is not forbidden it is also not a good idea');
    }
    //opens main tab and request all other tabs from server
    openTab('Home');
    socket.emit('tabs');

}

//removes selected tabs for when you reset the server scripts and you were the one to do it 
socket.on('removeTabs',function(tabs)
{
    //iterates through tabs forcefully kills them all
    tabs.forEach(function(tab)
    {
        if(document.getElementById("tab_"+tab.name) != null)
        {
             var btn_to_kill = document.getElementById("btn_"+tab.name);
             btn_to_kill.parentNode.removeChild(btn_to_kill);
             var tab_to_kill = document.getElementById("tab_"+tab.name);
             tab_to_kill.parentNode.removeChild(tab_to_kill);
        }
    })
});

//called from the sercer when somone other than this user has pressed the reset button
socket.on('unexpectedUpdate',function(tabs)
{
    //alerts user about the changes
    var alertStr = '';
    var addTabToString = function(tab)
    {
        alertStr += tab.name + '\n';
    }
    if(tabs.updated_tabs.length > 0)
    {
        alertStr += 'Updated Tabs: \n';
        tabs.updated_tabs.forEach(addTabToString);
        alertStr += '\n';
    }
    if(tabs.added_tabs.length > 0)
    {
        alertStr += 'Added Tabs: \n'
        tabs.added_tabs.forEach(addTabToString);
        alertStr += '\n'
    }
    if(tabs.removed_tabs.length > 0)
    {
        alertStr += 'Removed Tabs: \n';
        tabs.removed_tabs.forEach(addTabToString);
        alertStr += '\n';
    }
    alertStr += '*you will need to reload tabs for updates or removals to take effect';
    alert(alertStr,'info','WebTools Update');

    //applies non destructive changes
    add_tabs( tabs.added_tabs.filter(function(added_tab)
    {
        return (document.getElementById('tab_'+added_tab.name) == null);
    }));
});

//hook to add_tabs for server
socket.on('tabSync', (tabs)=> add_tabs(tabs));

//simple way to send messages to the client from the server please use sparingly
socket.on('message', (message)=> alert(message));

//adds tabs to the page
function add_tabs(tabs)
{
    tabs.forEach(function(tab)
    {
        //creates new button for tab
        var btn = document.createElement('button');
        btn.id = "btn_"+tab.name;
        btn.setAttribute("onclick",'openTab("tab_'+tab.name+'")');
        var t = document.createTextNode(tab.name);
        btn.appendChild(t);

        //removes old btn if it exists
        if(document.getElementById("btn_"+tab.name) != null)
        {
              var btn_to_kill = document.getElementById("btn_"+tab.name);
              btn_to_kill.parentNode.removeChild(btn_to_kill)
        }
        //adds button to tab
        document.getElementById('tab').appendChild(btn);
        
        //creates new div to hold tab content
        var div = document.createElement("div");
        div.id = 'tab_'+ tab.name;
        div.className = 'tabcontent';
        div.innerHTML = '<object type="text/html" data='+'"'+tab.html+'"'+'class = objcontent></object>';
        //removes old tab contend if it exists
        if(document.getElementById("tab_"+tab.name) != null)
        {
             var tab_to_kill = document.getElementById("tab_"+tab.name);
             tab_to_kill.parentNode.removeChild(tab_to_kill)
        }
        //adds tab to document
        document.body.appendChild(div);
    })
    sortButtons();
}

//alphebeticly sorts buttons
function sortButtons()
{
    buttons = []
    raw_buttons = document.getElementById("tab").getElementsByTagName("button");
    for(var index =0; index <raw_buttons.length; index++)
    {
        //simple bubble sort with exeption for reset button and home button who have fixed positions
	button = raw_buttons[index];
 	if(!(button.id == 'btn_home' || button.id == 'btn_reset'))
	{
	    buttons.push(button);
	}
    }
    buttons.sort(function(a,b){return (a.id < b.id) ? -1 : (a.id > b.id) ? 1 : 0;})
    buttons.forEach(function(button)
    {
         document.getElementById("tab").append(button);
    });
}




