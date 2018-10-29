var red = 0;
var green = 0;
var blue = 0;
var ori = 0.000;
var oriadd = 0.0015;
var size = 50;
var size_change = 0.5;
var delta_change = 1;
var delta_dydx_change = 0.05;
var delta_derivative_dydx_change = 0.003;
var speed = [];

var colorstep = function()
         {
             process.send({message : 'config',data :{name: 'colorbeat',input : null,norm : 60,range : [0,3600]}}))
             delta_dydx_changeO = inc(delta_derivative_dydx_change,delta_dydx_change,0.01,0.5);
             delta_dydx_change = delta_dydx_changeO[0];
             delta_derivative_dydx_change = delta_derivative_dydx_change * delta_dydx_changeO[1];
             delta_changeO = inc(delta_dydx_change,delta_change,0,3);
             delta_change = delta_changeO[0];
             delta_dydx_change = delta_dydx_change * delta_changeO[1];
             oriO = inc((oriadd * delta_change),ori,0,1);
             ori = oriO[0];
             oriadd = oriadd * oriO[1];
             sizeO = inc((size_change * delta_change),size,5,150);
             size = sizeO[0];
             size_change = size_change * sizeO[1];
             red = increment(red,0);
             green = increment(green,1);
             blue = increment(blue, 2);
             process.send({message: 'color',data :'#' + stringify(Math.round(red).toString(16))+stringify(Math.round(green).toString(16))+stringify(Math.round(blue).toString(16))+"-"+ ori + '-' + size});
         }

var colorLoop;
process.on('message', function(s)
    {
     switch(s.message){
     case 'color_timings':
     speed = s.data.color;
     loop_time = s.data.time
     colorLoop = setInterval(colorstep,3);
     
         break;
    case 'result':
        var old = colorLoop._idleTimeout;
        loop_time = s.data;
        if(old != loop_time)
        {
            clearInterval(colorLoop);
            console.log('color beat moved ' + old + ' -> ' + loop_time);
	    //colorLoop = setInterval(colorstep,loop_time);
        }
        break;
    }
        
    });

function increment(start,index)
{
    var add = speed[index] * Math.random() * delta_change;
    var output = start + add;
    if(output > 255 || output < 0)
    {
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
