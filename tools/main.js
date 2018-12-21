var map;
var fname;
var echange;

var mtime;
var mdistance;

var stat;

const modelTime = [
	['1 секунда',  16],
	['2 секунды', 32],
	['5 секунд', 80],
	['10 секунд', 160],
	['20 секунд', 320],
	['30 секунд', 480],
	['1 минута', 960],
	['2 минуты', 1920],
	['5 минут', 4800],
	['10 минут', 9600],
	['20 минут', 19200]
]

const carrCount = [ 6, 7, 8, 9, 10]

const stationDescrip = [
	['Авиамоторная', 399000],
	['Нижегородская', 190000],
	['Текстильщики',],
	['Печатники', ],
	['Нагатинский затон',],
	['Кленовый бульвар',],
	['Каширская',],
	['Варшавская',],
	['Каховская',],
	['Зюзино', 105000],
	['Воронцовская', 300000],
	['Улица Новаторов', 570000],
	['Проспект Вернадского', 350000],
	['Мичуринский проспект', 400000],
	['Аминьевское шоссе', 230000],
	['Давыдково', 235000],
	['Можайская',  ],
	['Терехово', ],
	['Мнёвники', ],
	['Улица Народного Ополчения', ],
	['Хорошёвская', 300000],
	['ЦСКА', 120000],
	['Петровский парк', 245000],
	['Савеловская', 290000],
	['Шереметьевская', 272000],
	['Ржевская', 280000],
	['Стромынка', 313000],
	['Рубцовская', 337000],
	['Лефортово', 135000]
];


const	input_y = [0,		2.5,	14,		5.5,	12.3,	6.5, 	2,		0];
const	input_x = [5,		6,		8.5,	13,		18.5,	20,	 	22,		24];


window.onload = function(){

	var intensity = newton(input_x, input_y);

	stat = {};
	stat.inSystem = document.getElementById('s-inSystem');
	stat.wait = document.getElementById('s-wait');
	stat.inTrain = document.getElementById('s-inTrain');
	stat.moreThat = document.getElementById('s-moreThat');
	stat.wMax = document.getElementById('s-wMax');
	stat.sCount = document.getElementById('s-sCount');
	stat.pCount = document.getElementById('s-pCount');

	map = new map_m({
		parent: document.getElementById('e-map'),
		intensity: intensity,
		stations: normalizeStations( stationDescrip ),
		scale: 0.5
	});

	sTime = new slider_lib({
		endRange: modelTime.length - 1,
		parent: document.getElementById('e-time-slider'),
		functions: {
			change: function(value){
				document.getElementById('e-time-value').innerHTML = modelTime[value][0];
				map.change({ step: modelTime[value][1] });
			}
		}
	});

	sCarriage = new slider_lib({
		endRange: 4,
		value: 2,
		parent: document.getElementById('e-carriage-slider'),
		functions: {
			change: function(value){
				document.getElementById('e-carriage-value').innerHTML = carrCount[value];
				map.change({ carriage: carrCount[value] });
			}
		}
	});

	sCarriage = new slider_lib({
		endRange: 80,
		value: 20,
		parent: document.getElementById('e-train-slider'),
		functions: {
			change: function(value){
				document.getElementById('e-train-value').innerHTML = value + 10;
				map.change({ trainCount: value + 10 });
			}
		}
	});

}

function model_play(){	map.play();}
function model_pause(){	map.pause();}
function model_stop(){	map.stop();}

function newton(x, y){
	var er = [y.concat()];
	var f = [y[0]];
	for(var i = 1; i < x.length; i++){
		er[i] = [];
		for(var j = 0; j < x.length - i; j++){
			er[i][j] = (er[i - 1][j + 1] - er[i - 1][j])/(x[j + i] - x[j]);
		}
		f.push(er[i][0]);
	}
	var eq = [[1]];
	for(var i = 0; i < f.length - 1; i++){
		var result = [];
		for(var j = 0; j < eq.last().length; j++){
			if(result[j + 1] == undefined)
				result[j + 1] = 0;
			result[j + 1] += eq.last()[j];
		
			if(result[j] == undefined)
				result[j] = 0;
			result[j] += eq.last()[j]*(-x[i]);
		}
		eq.push(result);
	}
	var answer = [];
	for(var i = 0; i < eq.last().length; i++){ answer[i] = 0; }

	for(var i = 0; i < eq.length; i++){
		for(var j = 0; j < eq[i].length; j++){
			answer[j] += f[i] * eq[i][j];
		}
	}

	for(var i = 0; i < eq.last().length; i++){ answer[i] = Math.round(answer[i] * 1000000000)/1000000000; }
	return answer
}

function normalizeStations(st){
	var result = [];
	var sum = 0;
	var count = 0;
	for(var i = 0; i < st.length; i++){
		if(st[i][1] !== undefined){
			sum += st[i][1];
			count++;
		}
	}
	sum = sum / count;
	for(var i = 0; i < st.length; i++){
		result.push(st[i].concat());
		if(result.last()[1] == undefined)
			result.last()[1] = sum; 
	}
	return result;
}
