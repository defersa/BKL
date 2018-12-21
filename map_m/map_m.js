function map_m(options){

	const delay = 5;

	var _canvas;
	var _sources;
	var _model;

	var _setting;
	var _statistic;
	var _functions;
	var _size;

	var link = this;
	var fragment = document.createDocumentFragment();

	//GLOBAL FUNCTIONS

	link.create = function(options){
		if(_canvas)			link.remove();

		if(options.parent == undefined)			options.parent = document.body;
		if(options.type == undefined)			options.type = 0;
		if(options.step == undefined)			options.step = 16;
		if(options.carriage == undefined)		options.carriage = 9;
		if(options.stations == undefined)		options.stations = [['station 1', 10000], ['station 2', 10000]];
		if(options.intensity == undefined)		options.intensity = [1];
		if(options.trainCount == undefined)		options.trainCount = 30;
		if(options.startTime == undefined)		options.startTime = 5.5;
		if(options.endTime == undefined)		options.endTime = 23.5;

		CREATE.canvas();
		CREATE.sources();
		CREATE.model();

		_setting = { layers: [] };
		_functions = {};
		_size = { dpi: 1, scale: 1 };

		window.addEventListener('resize', DISPLAY.generate);

		link.change(options);
	}

	link.change = function(options){
		if(options == undefined)	options = {};

		if(options.parent !== undefined)		CHANGE.parent(options);
		if(options.type !== undefined)			_setting.type = options.type;
		if(options.sources !== undefined)		CHANGE.sources(options);
		if(options.functions !== undefined)		CHANGE.functions(options);
		if(options.layers !== undefined)		CHANGE.layers(options);
		if(options.carriage !== undefined)		_setting.carriage = options.carriage;
		if(options.scale !== undefined)			_size.scale = options.scale;
		if(options.step !== undefined)			_setting.step = options.step;
		if(options.stations !== undefined)		MODEL.stations = options.stations;
		if(options.intensity !== undefined)		MODEL.intensity = options.intensity;
		if(options.trainCount !== undefined)	MODEL.trainCount = options.trainCount;
		if(options.startTime !== undefined)		_setting.startTime = options.startTime;
		if(options.endTime !== undefined)		_setting.endTime = options.endTime;

		DISPLAY.generate();
	}
	
	link.remove = function(){
	}

	link.play = function(){
		MODEL.start();
	}
	link.pause = function(){
		MODEL.pause();
	}
	link.stop = function(){
		MODEL.stop();
	}

	link.setSelect = function(item){
		SELECT.set(item);
		DISPLAY.canvas();
	}

	//INNER OBJECTS

	var GET = {
		
	}

	var EVENTS = {
		e: null,
		key:{
			down: function(e){
				var kc = e.keyCode;
				if(kc == 46 || kc == 8){
					if(SELECT.get()){
						var item = SELECT.get();
						if(item.parent == _sources.building){
							for(var i = 0; i < _sources.building.length; i++){
								if(_sources.building[i] == item){
									_sources.building.splice(i, 1);
									break;
								}
							}
						} else if(item.parent == _sources.roads){
							for(var i = 0; i < _sources.roads.length; i++){
								if(_sources.roads[i] == item){
									_sources.roads.splice(i, 1);
									break;
								}
							}
						} else if(item.parent == _sources.stop){
							for(var i = 0; i < _sources.stop.length; i++){
								if(_sources.stop[i] == item){
									_sources.stop.splice(i, 1);
									break;
								}
							}
						}
						SELECT.set();
					}
					if(_sources.points.length){
						_sources.points.length--;
					}
				}
				if(kc == 192){
					SELECT.set();
				}
				DISPLAY.canvas();
			}
		},
		down: {
			canvas: function(e){
				EVENTS.e = e;
				window.addEventListener("mousemove", EVENTS.move.canvas);
				window.addEventListener("mouseup", EVENTS.up.canvas);
			}
		},
		move: {
			canvas: function(e){
				if( Math.abs(EVENTS.e.pageX - e.pageX) > 3 || Math.abs(EVENTS.e.pageY - e.pageY) ){

					window.removeEventListener("mousemove", EVENTS.move.canvas);
					window.removeEventListener("mouseup", EVENTS.up.canvas);

					SCROLL.down(EVENTS.e);
				}
			}
		},
		up: {
			canvas: function(e){

				window.removeEventListener("mousemove", EVENTS.move.canvas);
				window.removeEventListener("mouseup", EVENTS.up.canvas);
				
				EDIT.click(e);
			}
		},
		wheel: {
			canvas: function(e){
				SCROLL.wheel(e);
			}
		}
	}

	var CREATE = {
		canvas: function(){
			_canvas = {};
			_canvas.html = tools.createHTML({
				tag: 'canvas',
				tabIndex: 1,
				className: 'map-canvas',
				parent: fragment,
				onwheel: EVENTS.wheel.canvas,
				onmousedown: EVENTS.down.canvas,
				onkeydown: EVENTS.key.down
			});
			_canvas.ctx = _canvas.html.getContext("2d");
		},
		sources: function(){
			_sources = {};
		},
		model: function(){
			_model = {};
			_statistic = {};

		}
	}
	
	var CHANGE = {
		parent: function(options){
			_setting.parent = options.parent;
			if(_setting.parent instanceof Node){
				_setting.parent.appendChild(_canvas.html);
			} else {
				fragment.appendChild(_canvas.html);
			}
		},
		sources: function(options){
			
		},
		functions: function(options){
			if(options.functions.select !== undefined)		_functions.select = options.functions.select;
		},
		layers: function(options){
		}
	}

	//INNER FUNCTIONS

	var DISPLAY = new function(){
		var s = this.s = { l: 0, t: 0 };


		var sources = {
			rCarriage: [[3660.5,3],[3660.5,-3],[3662,-3],[3662,3]],
			lCarriage: [[3659.5,3],[3659.5,-3],[3658,-3],[3658,3]],
			rsCarriage: [[3660.7,2.8],[3660.7,-2.8],[3661.8,-2.8],[3661.8,2.8]],
			lsCarriage: [[3659.3,2.8],[3659.3,-2.8],[3658.2,-2.8],[3658.2,2.8]],
			stations: [-0.000435, 0.005214],
			carriageRotate: 0.0006
		}


		this.generate = function(){
			_canvas.coord = _canvas.html.getBoundingClientRect();

			_canvas.width = _canvas.coord.right - _canvas.coord.left;
			_canvas.height = _canvas.coord.bottom - _canvas.coord.top;

			if( (_canvas.height < 0) || (_canvas.width < 0) )	return;

			_canvas.html.width = s.wt = _canvas.width * _size.dpi;
			_canvas.html.height = s.ht = _canvas.height * _size.dpi;

			s.width = _canvas.width * _size.dpi / _size.scale;
			s.height = _canvas.height * _size.dpi / _size.scale;

			DISPLAY.canvas();
		}

		this.canvas = function(){
			var c = _canvas.ctx;

			c.fillStyle = '#FFFFFF';
			c.strokeStyle = '#135ea8';
			c.lineWidth = _size.scale;

			c.fillRect( 0, 0, _canvas.width*_size.dpi, _canvas.height*_size.dpi );

			c.translate( 
				- _size.scale * s.l,
				- _size.scale * s.t );

			gides.h(c);
			gides.v(c);

			layers(c);

			c.translate( 
				 _size.scale * s.l,
				 _size.scale * s.t );

			drow.time(c);
		}
 		var gides = {
 			v: function(c){
 				fline = (Math.floor(s.l/250) + 1)*250;
			
				c.strokeStyle = '#bbbbbb';
				c.fillStyle = '#777777';
	
				c.textAlign = "left";
				c.textBaseline = "top";
				c.font = 10*_size.scale + 'px sans-serif';
	
				c.beginPath();
				while(fline < s.l + s.width){
					c.fillText(
						fline,
						_size.scale * (fline + 2),
						_size.scale * (s.t));
					c.moveTo(
						_size.scale * (fline),
						_size.scale * (s.t) );	
					c.lineTo(
						_size.scale * (fline),
						_size.scale * (s.height + s.t) );
					fline += 250;
				}
				c.stroke();
				c.closePath();
			},
			h: function(c){
				fline = (Math.floor(s.t/250) + 1)*250;

				c.strokeStyle = '#bbbbbb';
				c.fillStyle = '#777777';
	
				c.textAlign = "left";
				c.textBaseline = "top";
				c.font = 10*_size.scale + 'px sans-serif';
				
				c.beginPath();
				while(fline < s.t + s.height){
					c.fillText(
						fline,
						_size.scale * (s.l),
						_size.scale * (fline + 2));
					c.moveTo(
						_size.scale * (s.l),
						_size.scale * (fline) );	
					c.lineTo(
						_size.scale * (s.width + s.l),
						_size.scale * (fline) );
					fline += 250;
				}
				c.stroke();
				c.closePath();
			}
 		}

 		var rotation = function(p, ang){
 			x = p[0]*Math.cos(ang*Math.PI) - p[1]*Math.sin(ang*Math.PI);
 			y = p[0]*Math.sin(ang*Math.PI) + p[1]*Math.cos(ang*Math.PI);
 			return [x, y];
 		}

 		var drow = {
 			road: function(c){
				c.lineWidth = 8*_size.scale;
				c.strokeStyle = '#858585';
	
				c.beginPath();
				c.arc(
					_size.scale * (0),
					_size.scale * (0),
					_size.scale * (3660), 0, Math.PI*2);
				c.stroke();
				c.closePath();
	
 				c.lineWidth = 6*_size.scale;
				c.strokeStyle = '#c0c0c0';
	
				c.beginPath();
				c.arc(
					_size.scale * (0),
					_size.scale * (0),
					_size.scale * (3660), 0, Math.PI*2);
				c.stroke();
				c.closePath();
 			},
 			trainsBig: function(c, ts, carr, carrMin){
				for(var i = 0; i < ts.length; i++){
 					
					var train = ts[i];
					c.fillStyle = '#000000';
	
					for(var k = 0; k < MODEL.carriage; k++){
						var point = rotation(carr[0], train.rect + k*sources.carriageRotate);
						c.beginPath();
						c.moveTo(
 							_size.scale * point[0],
 							_size.scale * point[1]);
						
						for(var j = 1; j < sources.lCarriage.length; j++){
							point = rotation(carr[j], train.rect + k*sources.carriageRotate);
							c.lineTo(
 								_size.scale * point[0],
 								_size.scale * point[1]);
						}
						c.fill();
					}

					if(train.next){
						c.fillStyle = train.next.color;
					} else {
						c.fillStyle = '#FF0000';
					}
	
					for(var k = 0; k < MODEL.carriage; k++){
						var point = rotation(carrMin[0], train.rect + k*sources.carriageRotate);
						c.beginPath();
						c.moveTo(
 							_size.scale * point[0],
 							_size.scale * point[1]);
						
						for(var j = 1; j < sources.lCarriage.length; j++){
							point = rotation(carrMin[j], train.rect + k*sources.carriageRotate);
							c.lineTo(
 								_size.scale * point[0],
 								_size.scale * point[1]);
						}
						c.fill();
					}								
				}
 			},
			trainsSmall: function(c, ts, paralax){
				for(var i = 0; i < ts.length; i++){
					var train = ts[i];
					var point = rotation( [3660, 0], train.rect + paralax);

					c.lineWidth = 12*_size.scale;
					c.strokeStyle = '#444444';
					c.beginPath();
					c.arc(
						_size.scale * (point[0]),
						_size.scale * (point[1]),
						_size.scale * (12), 0, Math.PI*2);
					c.stroke();
					c.closePath();

					c.lineWidth = 10*_size.scale;
					c.strokeStyle = train.next.color;
					c.beginPath();
					c.arc(
						_size.scale * (point[0]),
						_size.scale * (point[1]),
						_size.scale * (12), 0, Math.PI*2);
					c.stroke();
					c.closePath();

					label.string(c, point, train.count);
				}
			},
			stations: function(c){
				
				var points = [3675, 3645];
				for(var i = 0; i < _model.stations.length; i++){

					for(var j = 0; j < points.length; j++){
						c.strokeStyle = '#000000';
 						c.lineWidth = 20*_size.scale;
	
						c.beginPath();
						c.arc(
							_size.scale * (0),
							_size.scale * (0),
							_size.scale * (points[j]),
							(sources.stations[0] + _model.stations[i].rect)*Math.PI,
							(sources.stations[1] + _model.stations[i].rect)*Math.PI);
						c.stroke();
	
						c.strokeStyle = _model.stations[i].color;
 						c.lineWidth = 18*_size.scale;
	
						c.beginPath();
						c.arc(
							_size.scale * (0),
							_size.scale * (0),
							_size.scale * (points[j]),
							(sources.stations[0] + _model.stations[i].rect)*Math.PI,
							(sources.stations[1] + _model.stations[i].rect)*Math.PI);
						c.stroke();
					}

					var point = rotation([3750, 0], _model.stations[i].rect + sources.carriageRotate*4);
					label.station(c, point, _model.stations[i]);
				}
			},
			time: function(c){
				var time = MODEL.get().time + _setting.startTime*3600000;
				var hour = (Math.floor(time/3600000));
				var minutes = (Math.floor((time%3600000)/60000));
				var seconds = (Math.floor((time%60000)/1000));
				if((hour + '').length < 2) hour = '0' + hour;
				if((minutes + '').length < 2) minutes = '0' + minutes;
				if((seconds + '').length < 2) seconds = '0' + seconds;

				c.font = '10px sans-serif';			
				c.fillStyle = '#444444';
 				c.textAlign = "center";
				c.textBaseline = "middle";
				c.fillText(
					hour + ':' + minutes + ':' + seconds,
					s.wt/2,
					12);
			}
 		}

 		var layers = function(c){
			
 			drow.road(c);

 			if(_model.play){
 				drow.stations(c);

 				if(_size.scale > 1){
 					drow.trainsBig(c, _model.ltrains, sources.lCarriage, sources.lsCarriage);
 					drow.trainsBig(c, _model.rtrains, sources.rCarriage, sources.rsCarriage);
 				} else {
 					drow.trainsSmall(c, _model.ltrains, sources.carriageRotate*_setting.carriage);
 					drow.trainsSmall(c, _model.rtrains, 0);
 				}

 				var agentInSystem = Math.round(_statistic.agentInSystem[0]/(_statistic.agentInSystem[1]*1000));
 				var agentWait = Math.round(_statistic.agentWait[0]/(_statistic.agentWait[1]*1000));
 				var agentInTrain = Math.round(_statistic.agentInTrain[0]/(_statistic.agentInTrain[1]*1000));

 				var moreThat = Math.round( (_statistic.moreThatCount[1]/(_statistic.moreThatCount[1] + _statistic.moreThatCount[0]))*10000 )/100;
 				var wMax = Math.round(_statistic.maxAgentWait/1000)

 				var sCount = Math.round( _statistic.s.s / _statistic.s.count );
 				var pCount = [];
 				for(var i = 0; i < _statistic.p.p.length; i++)
 					pCount[i] = _statistic.p.p[i]/_statistic.p.count;

 				stat.inSystem.innerHTML = agentInSystem;
 				stat.wait.innerHTML = agentWait;
 				stat.inTrain.innerHTML = agentInTrain;
 				stat.moreThat.innerHTML = moreThat;
 				stat.wMax.innerHTML = wMax;
 				stat.sCount.innerHTML = sCount;
 			}
 		}

 		var label = {
 			station: function(c, point, station){
				c.fillStyle = '#FFFFFF';
 				c.textAlign = "center";
				c.textBaseline = "middle";
				c.font = '14px sans-serif';
	
				var width = (c.measureText(station.name).width)/2 + 3;
	
				c.font = 14*_size.scale + 'px sans-serif';
	
				c.fillRect(
					_size.scale * (point[0] - width),
					_size.scale * (point[1] - 20),
					_size.scale * (width*2),
					_size.scale * (40),
					);
	
				c.fillStyle = '#444444';
	
				c.fillText(
					station.name,
					_size.scale * (point[0]),
					_size.scale * (point[1] - 10));

				c.fillText(
					'Count: ' + station.countIn,
					_size.scale * (point[0]),
					_size.scale * (point[1] + 10));

 			},
 			string: function(c, point, text){

				c.fillStyle = '#FFFFFF';
	 			c.textAlign = "center";
				c.textBaseline = "middle";
				c.font = '14px sans-serif';

				var width = (c.measureText(text).width)/2 + 3;

				c.font = 14*_size.scale + 'px sans-serif';

				c.fillRect(
					_size.scale * (point[0] - width),
					_size.scale * (point[1] - 10),
					_size.scale * (width*2),
					_size.scale * (20),
					);

				c.fillStyle = '#444444';

				c.fillText(
					text,
					_size.scale * (point[0]),
					_size.scale * (point[1]));
 			}
 		}
	}

	var MODEL = new function(){
		var s = { time: 0 };

		var timer;
		var fps = 16;

		var move = 0.0000007;
		var acce = 0.000000000035;
		var acceDistance = 0.007;

		var stWaiting = 20000;

		this.stations;
		this.intensity;
		this.carriage;
		this.trainCount;



		this.get = function(){ return s; }

		this.start = function(){

			if(!_model.play){

				s.time = 0;
				_model.play = true;

				//trains
				_model.ltrains = [];
				_model.rtrains = [];

				_statistic.maxAgentWait = 0;
				_statistic.agentInSystem = [0,0];
				_statistic.agentInTrain = [0,0];
				_statistic.agentWait = [0,0];

				_statistic.moreThat = 120000;
				_statistic.moreThatCount = [0, 0];
		
				_statistic.p = {};
				_statistic.p.ccount = 0;
				_statistic.p.count = 0;
				_statistic.p.p = [0]; 

				_statistic.s = {};
				_statistic.s.ccount = 0;
				_statistic.s.count = 0;
				_statistic.s.s = 0; 


				var integral = support.getIntegral( MODEL.intensity );
				MODEL.carriage = _setting.carriage;

				var left = 0, right = 0;
				for(var i = 0; i < integral.length; i++){
					left += integral[i] * Math.pow(_setting.endTime, i + 1);
					right += integral[i] * Math.pow(_setting.startTime, i + 1);
				}

				for(var i = 0; i < MODEL.trainCount; i++){
					_model.rtrains[i] = {
						time: 0,
						count: 0,
						capasity: MODEL.carriage*300,
						target: [],
						rect: (i*2)/MODEL.trainCount
					}
					for(var j = 0; j < MODEL.stations.length; j++)	_model.rtrains[i].target[j] = [];
				}
				for(var i = 0; i < MODEL.trainCount; i++){
					_model.ltrains[i] = {
						time: 0,
						count: 0,
						capasity: MODEL.carriage*300,
						target: [],
						rect: (i*2)/MODEL.trainCount
					}
					for(var j = 0; j < MODEL.stations.length; j++)	_model.ltrains[i].target[j] = [];
				}
	
				//stations
				_model.stations = [];
				for(var i = 0; i < MODEL.stations.length; i++){
	
					var cf = (Math.round(Math.random()*100 + 100)).toString(16);
					var cs = (Math.round(Math.random()*100 + 100)).toString(16);
					var ct = (Math.round(Math.random()*100 + 100)).toString(16);

					var coef = MODEL.stations[i][1]/(left - right);

					_model.stations[i] = {
						index: i,
						name: MODEL.stations[i][0],
						amount: MODEL.stations[i][1],
						rect: (2*i)/MODEL.stations.length,
					
						lagents: [],
						ragents: [],
						countIn: 0,
						countOunt: 0,
						lstack: [],
						rstack: [],
					
						gtime: 0,
						coef: coef, 
						color: '#' + cf + cs + ct
					}
				}
	
				for(var i = 0; i < _model.rtrains.length; i++){
					var train = _model.rtrains[i];
					var station = support.getCloseStationClockWise(train);
					station.rstack.push(train);
					train.next = station;
					train.gtime = 20000;
					train.speed = 0;
					train.status = 'accelerate';
					train.goal = support.fixDistance(train.rect + acceDistance);
					train.distance = support.fixDistance( station.rect - train.rect );
				}
				for(var i = 0; i < _model.ltrains.length; i++){
					var train = _model.ltrains[i];
					var station = support.getCloseStationConterWise(train);
					station.lstack.push(train);
					train.next = station;
					train.gtime = 20000;
					train.speed = 0;
					train.status = 'accelerate';
					train.goal = support.fixDistance(train.rect - acceDistance);
					train.distance = support.fixDistance( train.rect - station.rect );
				}
				for(var i = 0; i < _model.stations.length; i++){
					support.sort(_model.stations[i].rstack);
					support.sort(_model.stations[i].lstack);
				}
			}
			console.log(_model.stations);
			if(!timer) 	MODEL.play();
		}
		this.play = function(){

			if(s.time < (_setting.endTime - _setting.startTime)*3600000) timer = setTimeout(MODEL.play, fps);
			else {
 				var pCount = [];
 				for(var i = 0; i < _statistic.p.p.length; i++)
 					pCount[i] = _statistic.p.p[i]/(_statistic.p.count);
 				console.log(pCount)
			}

			var ltime = s.time;
			s.time += _setting.step;
			var agentCount = 0;


			for(var k = 0; k < _model.stations.length; k++){
				
				var station = _model.stations[k];

				for(var i = 0; i < station.rstack.length; i++){
					var train = station.rstack[i];

					while(s.time > train.time){
						if(s.time > train.gtime){
							train.time = train.gtime;

							if(train.status == 'move'){
								train.rect = train.goal;
								train.time = train.gtime;
								train.goal = train.next.rect - acceDistance * (i*2);
		
								train.status = 'bracking';
								train.speed = move;
								train.gtime = train.time + 20000;
		
							} else if(train.status == 'bracking'){
								if(i == 0){
									train.status = 'output';
									train.gtime = train.gtime + stWaiting/2;
								} else {
									train.status = 'waiting';
								}
								train.speed = 0;
								train.rect = train.goal;

							} else if(train.status == 'waiting'){

								train.gtime = s.time;

							} else if(train.status == 'output'){

								support.checkAgent(station);

								train.target[station.index].forEach( agent => {

									_statistic.p.ccount--;
									agent.trainOut = train.gtime;
									_statistic.agentInSystem[0] += (agent.trainOut - agent.timeIn);
									_statistic.agentInSystem[1]++;
									_statistic.agentWait[0] += (agent.trainIn - agent.timeIn);
									_statistic.agentWait[1]++;
									_statistic.agentInTrain[0] += (agent.trainOut - agent.trainIn);
									_statistic.agentInTrain[1]++;
									if(_statistic.maxAgentWait < agent.trainIn - agent.timeIn)
										_statistic.maxAgentWait = agent.trainIn - agent.timeIn;
									if(_statistic.moreThat < agent.trainIn - agent.timeIn)
										_statistic.moreThatCount[1]++;
									else
										_statistic.moreThatCount[0]++;
								});

								train.count += - train.target[station.index].length;
								countbefore = train.count;
								train.target[station.index] = [];
							
								var freeSite = (station.ragents.length > (train.capasity - train.count)) ? (train.capasity - train.count) : (station.ragents.length);

								for(var i = 0; i < freeSite; i++){
									station.ragents[i].trainIn = train.gtime;
									train.target[station.ragents[i].destination].push(station.ragents[i]);
								}
								station.ragents.splice(0, freeSite);
								train.count += freeSite;
								station.countIn += - freeSite;

								train.status = 'input';
								train.gtime = train.gtime + stWaiting/2;
							
							} else if(train.status == 'input'){
								station.rstack.shift();
								var ns = _model.stations[(k+1)%(_model.stations.length)];
								ns.rstack.push(train);
								train.next = ns;

								station.rstack.forEach( (item, j) => {
									if(item.status == 'bracking'){
										var time = ((train.gtime - item.time) < (item.speed/acce)) ? (train.gtime - item.time) : (train.speed/acce);
										item.rect = support.fixDistance( item.rect + item.speed*time - acce*time*time/2 );
										item.speed += - time*acce;
										item.time = item.time + time;
										item.gtime = item.time + (move - item.speed)/acce;
										time = item.gtime - item.time;
										item.status = 'accelerate';
										item.goal = support.fixDistance( item.rect + item.speed*time + acce*time*time/2 );
									} else if(item.status == 'waiting'){
										item.goal = support.fixDistance(station.rect - (acceDistance*(j*2 + 1)));
										item.status = 'accelerate';
										item.time = train.gtime;
										item.gtime = item.time + (move - item.speed)/acce;
									} else if(item.status == 'move'){
										item.goal = support.fixDistance(station.rect - (acceDistance*(j*2 + 1)));
										item.gtime = item.time + support.fixDistance(item.goal - item.rect)/move;
									}
								});

								i--;
								train.status = 'accelerate';
								train.goal = station.rect + acceDistance;
								train.gtime = train.gtime + 20000;

							} else if(train.status == 'accelerate'){
								train.status = 'move';
								train.rect = train.goal;
								train.goal = station.rect - acceDistance*(i*2 + 1);
								train.gtime = train.time + support.fixDistance(train.goal - train.rect)/move;
							}
							train.goal = support.fixDistance(train.goal);
							train.rect = support.fixDistance(train.rect);

						} else {
							var time = s.time - train.time;
							if(train.status == 'move'){
								train.rect += + move*time;
							} else if(train.status == 'bracking'){
								train.rect += train.speed*time - acce*time*time/2;
								train.speed += - time*acce;

							} else if(train.status == 'accelerate'){
								train.rect += train.speed*time + acce*time*time/2;
								train.speed += time*acce;
							}
							train.rect = support.fixDistance(train.rect);
							train.time = s.time;

						}
					}
				}

				for(var i = 0; i < station.lstack.length; i++){
					var train = station.lstack[i];

					while(s.time > train.time){
						if(s.time > train.gtime){
							train.time = train.gtime;

							if(train.status == 'move'){
								train.rect = train.goal;
								train.time = train.gtime;
								train.goal = train.next.rect + acceDistance * (i*2);
		
								train.status = 'bracking';
								train.speed = move;
								train.gtime = train.time + 20000;
		
							} else if(train.status == 'bracking'){
								if(i == 0){
									train.status = 'output';
									train.gtime = train.gtime + stWaiting/2;
								} else {
									train.status = 'waiting';
								}
								train.speed = 0;
								train.rect = train.goal;

							} else if(train.status == 'waiting'){
								train.gtime = s.time;
							} else if(train.status == 'output'){

								support.checkAgent(station);

								train.target[station.index].forEach( agent => {

									_statistic.p.ccount--;
									agent.trainOut = train.gtime;
									_statistic.agentInSystem[0] += (agent.trainOut - agent.timeIn);
									_statistic.agentInSystem[1]++;
									_statistic.agentWait[0] += (agent.trainIn - agent.timeIn);
									_statistic.agentWait[1]++;
									_statistic.agentInTrain[0] += (agent.trainOut - agent.trainIn);
									_statistic.agentInTrain[1]++;
									if(_statistic.maxAgentWait < agent.trainIn - agent.timeIn)
										_statistic.maxAgentWait = agent.trainIn - agent.timeIn;

									if(_statistic.moreThat < agent.trainIn - agent.timeIn)
										_statistic.moreThatCount[1]++;
									else
										_statistic.moreThatCount[0]++;
								});

								train.count += - train.target[station.index].length;
								countbefore = train.count;
								train.target[station.index] = [];
							
								var freeSite = (station.lagents.length > (train.capasity - train.count)) ? (train.capasity - train.count) : (station.lagents.length);

								for(var i = 0; i < freeSite; i++){
									station.lagents[i].trainIn = train.gtime;
									train.target[station.lagents[i].destination].push(station.lagents[i]);
								}
								station.lagents.splice(0, freeSite);
								train.count += freeSite;
								station.countIn += - freeSite;

								train.status = 'input';
								train.gtime = train.gtime + stWaiting/2;
							} else if(train.status == 'input'){
								station.lstack.shift();
								var ns = _model.stations[ ( k - 1 < 0) ? (_model.stations.length - 1) : (k - 1) ];
								ns.lstack.push(train);
								train.next = ns;

								station.lstack.forEach( (item, j) => {
									if(item.status == 'bracking'){
										var time = ((train.gtime - item.time) < (item.speed/acce)) ? (train.gtime - item.time) : (train.speed/acce);
										item.rect = support.fixDistance( item.rect - item.speed*time + acce*time*time/2 );
										item.speed += - time*acce;
										item.time = item.time + time;
										item.gtime = item.time + (move - item.speed)/acce;
										time = item.gtime - item.time;
										item.status = 'accelerate';
										item.goal = support.fixDistance( item.rect - item.speed*time - acce*time*time/2 );
									} else if(item.status == 'waiting'){
										item.goal = support.fixDistance(station.rect + (acceDistance*(j*2 + 1)));
										item.status = 'accelerate';
										item.time = train.gtime;
										item.gtime = item.time + (move - item.speed)/acce;
									} else if(item.status == 'move'){
										item.goal = support.fixDistance(station.rect + (acceDistance*(j*2 + 1)));
										item.gtime = item.time + support.fixDistance(item.rect - item.goal)/move;
									}
								});

								i--;
								train.status = 'accelerate';
								train.goal = support.fixDistance(station.rect - acceDistance);
								train.gtime = train.gtime + 20000;
							} else if(train.status == 'accelerate'){
								train.status = 'move';
								train.rect = train.goal;
								train.goal = station.rect + acceDistance*(i*2 + 1);
								train.gtime = train.time + support.fixDistance(train.rect - train.goal)/move;
							}
							train.goal = support.fixDistance(train.goal);
							train.rect = support.fixDistance(train.rect);

						} else {
							var time = s.time - train.time;
							if(train.status == 'move'){
								train.rect += - move*time;
							} else if(train.status == 'bracking'){
								train.rect += - train.speed*time + acce*time*time/2;
								train.speed += - time*acce;

							} else if(train.status == 'accelerate'){
								train.rect += - train.speed*time - acce*time*time/2;
								train.speed += time*acce;
							}
							train.rect = support.fixDistance(train.rect);
							train.time = s.time;

						}
					}
				}	

				support.checkAgent(station);

				agentCount += station.lagents.length + station.ragents.length;
			}

			_statistic.s.s += (agentCount/MODEL.stations.length);
			_statistic.s.count++;

			var p_count = Math.round(_statistic.p.ccount/10);
			if(!_statistic.p.p[p_count])	_statistic.p.p[p_count] = 0;
			_statistic.p.p[p_count]++;
			_statistic.p.count++;

			DISPLAY.canvas();
		}

		this.stop = function(){
			clearTimeout(timer);
			timer = null;
			_model = {};
			DISPLAY.canvas();
		}

		this.pause = function(){
			clearTimeout(timer);
			timer = null;
		}

		var support = {
			getCloseStationClockWise: function(train){
				var station = _model.stations[0];
				var distance = support.fixDistance(_model.stations[0].rect - train.rect - acceDistance*2);
				for(var j = 1; j < _model.stations.length; j++){
					if(support.fixDistance(_model.stations[j].rect - train.rect - acceDistance*2) < distance){
						distance = support.fixDistance(_model.stations[j].rect - train.rect);
						station = _model.stations[j];
					}
				}
				return station;
			},
			getCloseStationConterWise: function(train){

				var station = _model.stations[0];
				var distance = support.fixDistance(train.rect - _model.stations[0].rect - acceDistance*2);
				for(var j = 1; j < _model.stations.length; j++){
					if(support.fixDistance(train.rect - _model.stations[j].rect - acceDistance*2) < distance){;
						distance = support.fixDistance(train.rect - _model.stations[j].rect - acceDistance*2)
						station = _model.stations[j];
					}
				}
				return station;
			},
			sort: function(ar){
				for(var i = 0; i < ar.length - 1; i++){
					var item = i;
					for(var j = i; j < ar.length; j++){
						if(ar[item].distance > ar[j].distance)
							item = j;
					}
					var buf = ar[i];
					ar[i] = ar[item];
					ar[item] = buf;
				}
			},
			fixDistance: function(d){
				while(d < 0)
					d += 2;
				while(d >= 2)
					d -= 2;
				return d;
			},
			getIntegral: function(polynomial){
				var result = [];
				for(var i = 0; i < polynomial.length; i++){
					result[i] = polynomial[i]/(i + 1);
				}
				return result;
			},
			getIntensity: function(coef, time){
				var result = 0;
				var time = time/3600000 + _setting.startTime;
				for(var i = 0; i < MODEL.intensity.length; i++){
					result += MODEL.intensity[i] * Math.pow ( time, i);
				}
				return result*coef/3600000;
			},
			getExponent: function(lamb){
				return -(Math.log(Math.random())/lamb);
			},
			checkAgent: function(station){
				while(station.gtime < s.time){
					_statistic.p.ccount++;
					support.addAgent(station);
					var ntime = support.getIntensity(station.coef, station.gtime);
					ntime = support.getExponent(Math.abs(ntime));
					station.gtime += ntime;
					station.countIn++;
				}
			},
			addAgent: function(station){
				var destination = 1 + Math.floor(Math.random()*(MODEL.stations.length - 1));
				var agent = {}

				if( destination < MODEL.stations.length/2)	station.ragents.push(agent);
				else 										station.lagents.push(agent);

				agent.timeIn = station.gtime;
				agent.destination = (destination + station.index)%MODEL.stations.length;
			}
		}

	}

	var SELECT = new function(){
		var item;

		this.set = function(nitem){
			var type;
			if(nitem){
				if(nitem.parent == _sources.building)	type = 'b';
				if(nitem.parent == _sources.roads)		type = 'r';
				if(nitem.parent == _sources.stop)		type = 's';
			}
			if(typeof _functions.select == 'function'){
				_functions.select(nitem, type);
			}
			item = nitem;
		}
		this.get = function(){
			return item;
		}
	}

	var SCROLL = new function(){
		var s = this.s = {};

		this.down = function(e){
			s.e = s.ne = e;
			s.show = true;
			s.l = DISPLAY.s.l;
			s.t = DISPLAY.s.t;

			redrow();

			window.addEventListener("mousemove", move);
			window.addEventListener("mouseup", up);
		}

		var redrow = function(){
			if(s.show){
				DISPLAY.s.l = s.l + (s.e.pageX - s.ne.pageX)/_size.scale;
				DISPLAY.s.t = s.t + (s.e.pageY - s.ne.pageY)/_size.scale;
	
				DISPLAY.canvas();
				s.show = false;
			}
			timer = setTimeout(redrow, delay);
		}

		var move = function(e){
			s.show = true;
			s.ne = e;
		}

		var up = function(e){
			window.removeEventListener("mousemove", move);
			window.removeEventListener("mouseup", up);
		}

		this.scale = function(des){
			if(_size.scale + des < 0.1) 	return;
		
			DISPLAY.s.l += + DISPLAY.s.width/2;
			DISPLAY.s.t += + DISPLAY.s.height/2;

			DISPLAY.s.width = DISPLAY.s.width*(_size.scale/(_size.scale + des));
			DISPLAY.s.height = DISPLAY.s.height*(_size.scale/(_size.scale + des));

			DISPLAY.s.l += - DISPLAY.s.width/2;
			DISPLAY.s.t += - DISPLAY.s.height/2;
	
			DISPLAY.s.l = Math.round(DISPLAY.s.l);
			DISPLAY.s.t = Math.round(DISPLAY.s.t);

			_size.scale += des;
		}

		this.wheel = function(e){
			var delta = (e.deltaY || -e.wheelDelta)/2;

			if(delta > 0){
				SCROLL.scale(-0.1);
			} else if(delta < 0) {
				SCROLL.scale(0.1);
			}

			DISPLAY.canvas();
			tools.stopProp(e);
			return false;
		}

	}
	var EDIT = new function(){
		this.click = function(e){


			DISPLAY.canvas(); 
		}
	}

	link.create(options);
}