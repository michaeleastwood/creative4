To add a tab you need to:

step 1: Add a folder to WebTools/public/tabs the folders name will be the name of your tab.

step 2: in this new folder add a file ending in .js. This file will work as the server end of your tab. *Note even if you do nothing on the backend this file is required for your tab to be recognized.

step 3: add the following line to your .js file "exports.run = function(socket){}", this function is required and will be ran when the user connects the users socket will be passed into this function. Use this method to add your tabs server socket events.

step 4: in the same directory add a index.html file to serve as your tabs frontend html, make sure to include the folowing lines if you intend to use sockets, "<script src="/WebTools/socket.io/socket.io.js"></script> and "<script src="/WebTools/SharedJS/safesocket.js"></script>"

step 5: to add client side js create a subdirectory in your tabs folder, *Note do not add other files Directly to your tab directory this could cause errors in loading your tab, Only add Folders. Next place your new js file in this subdirectory. To get the client side socket in your java script tuse the following line "var socket = getSafe("tabName");" make sure tabName matches the name of your tab or it will not work.

*look into WebTools/public/examples for example tabs
*you can put any js files you would like to share among tabs into WebTools/public/webtools/sharedJS
