const iot_api = 'http://192.168.4.10/api';

// 对ajax的Promise封装
const ajax = function(url,type,data,datatype){
    return new Promise((resolve,reject)=>{
        $.ajax({
            type: type,
            url: url,
            data: data,
            dataType: datatype,
            success: function (res) {
                resolve(res)
            },
            error:function(error){
                reject(error)
            }
        });
    })
}

// 控制系统接口
const ctrl_request = (param) => ajax(`${iot_api}/ctrl.action`,'POST',param,'json')

// 转向系统接口
const turn_request = (param) => ajax(`${iot_api}/turn.action`,'POST',param,'json')

// 动力系统接口
const gear_request = (param) => ajax(`${iot_api}/gear.action`,'POST',param,'json')


// 摇杆封装方法
function Joystick(opt) {
    if (!opt.zone) return;
    var disabledColor = opt && opt.disabledColor || true;

    this.options = {
        mode: opt && opt.mode || 'static',
        size: opt && opt.size || 100,
        color: disabledColor ? '#ddd' : (opt && opt.color || '#eee'),
        position: opt && opt.position || {
            left: '50%',
            top: '50%'
        },
        zone: opt && opt.zone
    };

    this.distance = 0;
    this.angle = null;
    this.time = null;
}

Joystick.prototype.init = function() {
    var manager = nipplejs.create(this.options);
    this.manager = manager;
    this._on();
    return this;
}

Joystick.prototype._on = function() {
    var me = this;
    this.manager
        .on('start', function (evt, data) {
            me.time = setInterval(() => {
                me.onStart && me.onStart(me.distance,me.angle);
            }, 100);
        })
        .on('move', function (evt, data) {
            if (data.direction) {
                me.angle = data.direction.angle;
                me.distance = data.distance;
            }
        })
        .on('end', function (evt, data) {
            clearInterval(me.time);
            me.onEnd && me.onEnd();
        });
}

let cmd_list = [];

function push_cmd(cmd) {
    if (cmd_list === null) {
        cmd_list = []
        cmd_list.push(cmd)
    }else{
        // 如果本地有数据，则将新数据插入到本地数据的前面
        cmd_list.unshift(cmd)
        // 如果本地数据超过20条，则删除最后一条
        if (cmd_list.length > 12) {
            cmd_list.pop()
        }
    }
}

function display_cmd() {
    if (cmd_list === null || cmd_list.length === 0) {
        return;
    }
    let divElements = document.getElementById('console_lines').getElementsByTagName("div");
    let line_index = 0;
    for (let i = cmd_list.length-1; i >= 0;  i--) {
        divElements[line_index].innerText = ">_: "+cmd_list[i];
        line_index = line_index + 1;
    }
}

// 打开视频页面
const baseHost = "http://192.168.4.1"//document.location.origin
const streamUrl = baseHost + ':81'
let video_status = false;

const show = el => {
    el.classList.remove('hidden')
}

let power_status = false;
let motor_status = false;
let light_status = false;

//大屏
$(function () {

    // 上一次的操作指令
    let last_turn = '';
    let last_gear = '';
    const view = document.getElementById('stream')

    var myChart1 = echarts.init(document.getElementById('air_chart'));
    var option1 = {
        backgroundColor: '#1b1e25',
        title: {
            text: ''
        },
        tooltip: {
            enterable: true, trigger: 'axis'
        },
        grid: {
            left: '3%',
            right: '3%',
            top: '10%',
            bottom: "2%",
            containLabel: true
        },
        xAxis: [
            {
                axisLine: {
                    lineStyle: {
                        color: '#3e4148',
                        width: 1,//这里是为了突出显示加上的
                    }
                },
                type: 'category',
                boundaryGap: false,
                data: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23']
            }
        ],
        yAxis: [
            {
                splitLine: {
                    lineStyle: {
                        color: '#21242b',
                    }
                },
                type: 'value',
                axisLine: {
                    lineStyle: {
                        color: '#43484e',
                        width: 0,//这里是为了突出显示加上的
                    }
                }
            }
        ],
        series: [
            {
                name: '实时指数',
                type: 'line',
                symbol: 'none',
                data: [50, 132, 40, 1500, 2000, 800, 210, 100],
                smooth: true,
                itemStyle: {
                    normal: {
                        lineStyle: {
                            color: '#26a0c9'
                        }
                    }
                },
                areaStyle: {normal: {color: ['rgba(255,255,255,0.1)']}},

            }
        ]
    };

    var myChart2 = echarts.init(document.getElementById('temperature_chart'));
    var option2 =  {
        backgroundColor: '#1b1e25',
        title: {
            text: '实时温度'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    backgroundColor: '#6a7985'
                }
            }
        },
        grid: {
            left: '3%',
            right: '3%',
            top: '10%',
            bottom: "2%",
            containLabel: true
        },
        xAxis: [
            {
                type: 'category',
                boundaryGap: false,
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            }
        ],
        yAxis: [
            {
                splitLine: {
                    lineStyle: {
                        color: '#21242b',
                    }
                },
                type: 'value',
                axisLine: {
                    lineStyle: {
                        color: '#43484e',
                        width: 0,//这里是为了突出显示加上的
                    }
                }
            }
        ],
        series: [
            {
                name: '温度',
                type: 'line',
                stack: 'Total',
                smooth: true,
                lineStyle: {
                    width: 0
                },
                showSymbol: false,
                areaStyle: {
                    opacity: 0.8,
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        {
                            offset: 0,
                            color: 'rgb(128, 255, 165)'
                        },
                        {
                            offset: 1,
                            color: 'rgb(1, 191, 236)'
                        }
                    ])
                },
                emphasis: {
                    focus: 'series'
                },
                data: [140, 232, 101, 264, 90, 340, 250]
            }
        ]
    };

    var myChart3 = echarts.init(document.getElementById('left_driver'));
    var option3 = {
        tooltip: {
            formatter: '电压 : {c}V'
        },
        series: [
            {
                name: '电压',
                type: 'gauge',
                radius: '70',
                progress: {
                    show: true
                },
                detail: {
                    valueAnimation: true,
                    formatter: '{value}V',
                    fontSize: 12
                },
                data: [
                    {
                        value: 80
                    }
                ],
                axisLine:{
                    lineStyle:{
                        width:10
                    }
                },
                axisLabel:{
                    fontSize:10,
                    distance:5
                },
                axisTick:{
                    distance:0,
                },
                pointer: {
                    fontSize:10,
                    width:2
                },
                splitLine:{
                    length:15,
                    distance:10
                }
            }
        ]
    };

    var myChart4 = echarts.init(document.getElementById('right_driver'));
    var option4 = {
        tooltip: {
            formatter: '电压 : {c}V'
        },
        series: [
            {
                name: '电压',
                type: 'gauge',
                radius: '70',
                progress: {
                    show: true
                },
                detail: {
                    valueAnimation: true,
                    formatter: '{value}V',
                    fontSize: 12
                },
                data: [
                    {
                        value: 23
                    }
                ],
                axisLine:{
                    lineStyle:{
                        width:10
                    }
                },
                axisLabel:{
                    fontSize:10,
                    distance:5
                },
                axisTick:{
                    distance:0,
                },
                pointer: {
                    fontSize:10,
                    width:2
                },
                splitLine:{
                    length:15,
                    distance:10
                }
            }
        ]
    };


    var setoption = function () {
        myChart1.setOption(option1);//今日作业趋势
        myChart2.setOption(option2);//货主订单执行情况
        myChart3.setOption(option3);
        myChart4.setOption(option4);
    }
    setoption()
    $(window).resize(function () {
        myChart1.resize();
        myChart2.resize();
        myChart3.resize();
        myChart4.resize();
    })

    $("#video_switch").change((e)=>{
        if(video_status){
           // 上次是打开，本次关闭
            window.stop();
            view.style.width="320px";
            view.style.height="240px";
            view.src = `${baseHost}/capture?_cb=${Date.now()}`
        }else {
            // 上次是关闭，本次打开
            console.log(view)
            view.src = `${streamUrl}/stream`
            view.style.width="320px";
            view.style.height="240px";
        }
        // 重新赋予状态
        video_status = !video_status;
    })

    function send_ctrl(param) {
        ctrl_request(param).then(data=>{
            console.info("set turn success",data)
        }).catch(error=>{
            console.log('控制异常:',error);
        })
    }

    $("#power_switch").change((e)=>{
        if(power_status){
            // 上次是打开，本次关闭
            send_ctrl({fun:1,level:0});
        }else {
            // 上次是关闭，本次打开
            send_ctrl({fun:1,level:1});
        }
        // 重新赋予状态
        power_status = !power_status;
    })

    $("#motor_switch").change((e)=>{
        if(motor_status){
            // 上次是打开，本次关闭
            send_ctrl({fun:2,level:0});
        }else {
            // 上次是关闭，本次打开
            send_ctrl({fun:2,level:1});
        }
        // 重新赋予状态
        motor_status = !motor_status;
    })

    $("#light_switch").change((e)=>{
        if(light_status){
            // 上次是打开，本次关闭
            send_ctrl({fun:3,level:0});
        }else {
            // 上次是关闭，本次打开
            send_ctrl({fun:3,level:1});
        }
        // 重新赋予状态
        light_status = !light_status;
    })

    function send_turn(value) {
        let _level = 0;
        if (value === 'left'){
            _level = 1;
        }
        if (value === 'right'){
            _level = 2;
        }
        turn_request({level: _level}).then(data=>{
            console.info("set turn success",data)
        }).catch(error=>{
            console.log('控制异常:',error);
        })
    }

    const turn_handle = new Joystick({
        zone: document.querySelector('#turn'),
        disabledColor:true
    }).init();
    turn_handle.onStart = function(distance, angle) {
        if ('' === last_turn || angle !== last_turn){
            // 第一次下发指令 或者 本次指令和之前的不同，需要发送新的指令
            send_turn(angle);
            push_cmd('转向架下发[' + angle + ']指令' );
            display_cmd();
            last_turn = angle;
        }
    }
    turn_handle.onEnd = function (){
        send_turn('');
        push_cmd('转向架下发[restore]指令' );
        display_cmd();
        last_turn = '';
    }

    function send_gear(value) {
        let _level = 0;
        if (value === 'up'){
            _level = 1;
        }
        if (value === 'down'){
            _level = 2;
        }
        gear_request({level: _level}).then(data=>{
            console.info("set turn success",data)
        }).catch(error=>{
            console.log('控制异常:',error);
        })
    }
    const gear_handle = new Joystick({
        zone: document.querySelector('#gear'),
        disabledColor:true
    }).init();

    gear_handle.onStart = function(distance, angle) {
        if ('' === last_turn || angle !== last_turn){
            // 第一次下发指令 或者 本次指令和之前的不同，需要发送新的指令
            send_gear(angle);
            push_cmd('动力系统下发[' + angle + ']指令' );
            display_cmd();
            last_turn = angle;
        }
    }
    gear_handle.onEnd = function (){
        send_gear('');
        push_cmd('动力系统下发[restore]指令' );
        display_cmd();
        last_turn = '';
    }

    new Joystick({
        zone: document.querySelector('#extend'),
        disabledColor:true
    }).init()
        .onStart = function(distance, angle) {
        push_cmd('辅助力量下发[' + angle + ']指令' );
        display_cmd();
        //console.log('辅助力量:向 => ' + angle + '移动' + distance + '个单位');
    }


})