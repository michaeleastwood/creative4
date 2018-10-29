var socket = getSafe('Color')
var lastColor = [];
var size = 0;
color_mode = 0;
color_modes = 9;
background_mode = 0;
background_modes = 7;
document.onkeydown = function(evt)
{
    console.log(evt)
    if(evt.key.toLowerCase() == 'c')
    {
        color_mode = color_mode +1;
        if (color_mode >= color_modes)
        {
            color_mode = 0;
        }
        console.log(color_mode)
    }

    if(evt.key.toLowerCase() == 's')
    {
        background_mode = background_mode +1;
        if (background_mode >= background_modes)
        {
            background_mode = 0;
        }
        console.log(background_mode)
    }
}
socket.on('Color_change',function(input)
{
    var a = input.split('-');
    var color = a[0];
    size = 50;
    var ori = a[1];
    var str ='';
    var i;
    for(i =0; i < lastColor.length; i++)
    {   
        str += lastColor[i] +',';
    }
    str = str.substring(0,str.length-3)
    str = str + ')';
    switch(background_mode)
    {
        case 0:
            size = a[2];
            document.getElementById("grad").style.background = "linear-gradient(" + ori +'turn,' + str;
            break;
        case 1:
            document.getElementById("grad").style.background = "linear-gradient(" + ori +'turn,' + str;
            break;
        case 2:
            document.getElementById("grad").style.background = "linear-gradient(" + str;
            break; 
        case 3:
            document.getElementById("grad").style.background = "linear-gradient("+ 0.25+'turn,' + str;
            break; 
        case 4:
            document.getElementById("grad").style.background = "linear-gradient("+ 0.5+'turn,' + str;
            break; 
        case 5:
            document.getElementById("grad").style.background = "linear-gradient("+ 0.75+'turn,' + str;
            break; 
        case 6:
            document.getElementById("grad").style.background = color;
            break; 
    }
    var display = 'block'
    switch(color_mode)
    {
        case 0:
            document.getElementById("text").style = "transform: translate(-50%, -100%) rotate("+ (360 * (parseFloat(ori)+0.5))+"deg); color: rgb(255,255,255); mix-blend-mode: difference;";
            break;
        case 1:
            document.getElementById("text").style = "transform: translate(-50%, -100%) rotate("+ (360 * (parseFloat(ori)+0.5))+"deg); background:"+ "linear-gradient(" + (parseFloat(ori) + 0.5) + 'turn,' + str +"; -webkit-background-clip: text; -webkit-text-fill-color: transparent;";
            break;
        case 2:
            document.getElementById("text").style = "transform: translate(-50%, -100%) rotate("+ (360 * (parseFloat(ori)))+"deg); background:"+ "linear-gradient(" + ori +'turn,' + str +"; -webkit-background-clip: text; -webkit-text-fill-color: transparent;";
            break;
         case 3:
             document.getElementById("text").style = "transform: translate(-50%, -100%) rotate("+ (360 * (parseFloat(ori)+0.5))+"deg); color:" + invertColor(color) + ';';
             break;
         case 4:
             document.getElementById("text").style = "transform: translate(-50%, -100%); color: rgb(255,255,255); mix-blend-mode: difference;";
             break;
         case 5:
             document.getElementById("text").style = "transform: translate(-50%, -100%); background: linear-gradient(" + (parseFloat(ori) + 0.5) + 'turn,' + str +"; -webkit-background-clip: text; -webkit-text-fill-color: transparent;";
             break;
         case 6:
             document.getElementById("text").style = "transform: translate(-50%, -100%); background:"+ "linear-gradient(" + ori +'turn,' + str +"; -webkit-background-clip: text; -webkit-text-fill-color: transparent;";
             break;
         case 7:
             document.getElementById("text").style = "transform: translate(-50%, -100%) rotate("+ (360 * (parseFloat(ori)+0.5))+"deg); color:" + invertColor(color) + ';';
             break;
         case 8:
             display = 'none';
             break;
    }
    document.getElementById("text").style.display = display;
    

    lastColor.push(color);
    while(lastColor.length > size)
    {
        lastColor.shift();
    }
});

function invertColor(hex) {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    // invert color components
    var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
        g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
        b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
    // pad each with zeros and return
    return '#' + padZero(r) + padZero(g) + padZero(b);
}

function padZero(str, len) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}
