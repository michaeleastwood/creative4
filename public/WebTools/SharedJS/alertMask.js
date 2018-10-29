//forced import of sweetalert this is used so that careless alerts do not kill the heartbeat system
var imported = document.createElement('script');
imported.src = '/WebTools/SharedJS/sweetalert/dist/sweetalert.min.js';
document.head.appendChild(imported);

//basic override functions replacing default alert be adivesed prompt had to be done with a call back
function alert(str)
{
    swal(str);
}
function prompt(title,func)
{
    swal(title, {
      content: "input",
     }).then(func);
}
function alert(str, icon, title)
{
    swal({
      title: title,
      text: str,
      icon: icon,
      buttons: true,
    });
}
