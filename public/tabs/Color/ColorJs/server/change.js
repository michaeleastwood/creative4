var red = 0;
var green = 0;
var blue = 0;
var ori = 0.000;
var oriadd = 0.00015;
var size = 100;
var size_change = 0.05;
var delta_change = .1;
var delta_dydx_change = 0.05;
var delta_derivative_dydx_change = 0.003;
var speed = [];

var colorstep = function()
         {
             process.send({message : 'config',data :{name: 'colorbeat',input : null,norm : 60,range : [0,3600]}})
             delta_dydx_change = inc(delta_derivative_dydx_change,delta_dydx_change,0.01,0.5);
             delta_derivative_dydx_change = delta_derivative_dydx_change * delta_dydx_change[1];

             delta_dydx_change = delta_dydx_change[0];
             //console.log(delta_change+ '#0' )
             //console.log(delta_dydx_change)
             delta_change = inc(delta_dydx_change,delta_change,0,3);
             //console.log(delta_change+ '#1' )
             delta_dydx_change = delta_dydx_change * delta_change[1];
             
             delta_change = delta_change[0];
             ori = inc((oriadd * delta_change),ori,0,1);
             oriadd = oriadd * ori[1];
             ori = ori[0];
             size = inc((size_change * delta_change),size,40,150);
	    // console.log(delta_change+ '#2' )
             size_change = size_change * size[1];
             size = size[0];
             //console.log(red)
             red = increment(red,0);
             //console.log(red)
             green = increment(green,1);
	     //console.log(green);
             blue = increment(blue, 2);
             process.send({message: 'color',data :'#' + stringify(Math.round(red).toString(16))+stringify(Math.round(green).toString(16))+stringify(Math.round(blue).toString(16))+"-"+ ori + '-' + size});
            // console.log({message: 'color',data :'#' + stringify(Math.round(red).toString(16))+stringify(Math.round(green).toString(16))+stringify(Math.round(blue).toString(16))+"-"+ ori + '-' + size})
         }

var colorLoop;
process.on('message', function(s)
    {
     switch(s.message){
     case 'color_timings':
     //console.log('ok')
     speed = s.data.color;
     loop_time = s.data.time
     colorLoop = setInterval(colorstep,300);
     
         break;
    case 'result':
        var old = colorLoop._idleTimeout;
        loop_time = s.data;
        if(old != loop_time)
        {
            clearInterval(colorLoop);
            console.log('color beat moved ' + old + ' -> ' + loop_time);
	    colorLoop = setInterval(colorstep,loop_time);
        }
        break;
    }
        
    });

function increment(start,index)
{
    var add = speed[index] * Math.random() * delta_change;
    //console.log(start)
    var output = start + add;
    //console.log(output)
    if(output > 255 || output < 0)
    {
      // console.log('ahh');
       speed[index] = speed[index] * -1 ;
       add = add * -1; 
       var output = start + add;
    }
    return output;
}
function inc(delta,value,low,high)
{
    output = [];
    neg = 1;
    value = value + delta;
    if(value > high || value < low)
    {
        neg = -1;
        delta = delta * -1;
        value = value + delta;
    }
    output.push(value);
    output.push(neg);
    return output;
}
function stringify(input)
{
    if(input.length == 1)
    {
        return "0" + input;
    }
    return input;
}
