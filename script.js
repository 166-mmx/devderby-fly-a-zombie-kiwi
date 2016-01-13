var landscape = false;
var portrait = false;

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

CanvasRenderingContext2D.prototype.fillImage = function(img) {
	this.save();
	
	var w = img.width,
		h = img.height,
		cW = this.canvas.width,
		cH = this.canvas.height,
		i,j;
	
	this.globalCompositeOperation = 'source-atop';
	
	var cols = Math.ceil(cW/w),
		rows = Math.ceil(cH/h);

	for (i = 0; i < cols; i++) {
		for (j = 0; j < rows; j++) {
			this.drawImage(img, i*w, j*w);
		}
	}
	this.restore();
};

window.requestAnimationFrame = (function(){
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function( callback ){
              window.setTimeout(callback, 1000 / 60);
            };
})();


var Kiwi = (function(undefined) {
	function Kiwi(game) {
		this.x = 145;
		this.y = 304;
		this.r = 40;
		
		this.posX = 0;
		this.posY = 0;
		
		this.cx = 145;
		this.cy = 304;
		
		this.vx = 0;
		this.vy = 0;
		
		this.angle = 0;
		
		this.mana = 100;
		this.game = game;
		
		this.ut = -0.005;
		this.g = -0.1;
		this.timestamp = null;
		
		this.level = null;
		this.ctx = ctx;
		this.animStart = 0;
		this.animData = null;
		this.callbacks = {};
		
		var tmpCanvas = document.createElement('canvas');
		tmpCanvas.width = this.r*2;
		tmpCanvas.height = this.r*2;
		var tmpCtx = tmpCanvas.getContext('2d');
		
		this.setCallback = function(type, fn) {
			this.callbacks[type] = fn;
		};
		
		this.restart = function() {
			this.x = 145;
			this.y = 304;
			
			this.posX = 0;
			this.posY = 0;
			this.angle = 0;
			this.mana = 100;
			
			this._handleClick = this.___handleClick;
		};
		
		var image = null;
		
		this.finishAnimation = function() {
			
		};
		
		this.hideAnimation = function(callback) {
			callback();
		};
		
		this.catapultMode = function() {
			this.move = this._precatapultMove;
			this.render = this._render;
			
			mouseHandler.callbackClick = null;
			mouseHandler.callbackUp = this.handleUp;
			mouseHandler.callbackDown = this.handleDown;
			touchHandler._handleStart = touchHandler._catapultStart;
			
		};
		
		this.flyMode = function() {
			self.timestamp = new Date().getTime();
			self.move = self._fly;
			self.render = self._render;
			mouseHandler.callbackClick = self.handleClick;
			mouseHandler.callbackUp = null;
			mouseHandler.callbackDown = null;
			touchHandler._handleStart = touchHandler._flyStart;
		};
		
		this.pauseMode = function() {
			this.move = this._empty;
			this.render = this._empty;
		};
		
		this._empty = function() {};
		
		this.move = this._empty;
		
		this._catapultMove = function(x,y) {
			
			var dx = x - this.x,
				dy = y - this.y,
				cx = x - this.cx,
				cy = y - this.cy,
			
				dist = Math.sqrt(cx*cx + cy*cy),
				factor = 1;
			
			if (cx > 1)
				cx = 1;
			
			if (dist>50) {
				factor = 50/dist;
				x = this.cx + cx * factor;
				y = this.cy + cy * factor;
			}
			
			
			
			this.x = x;
			this.y = y;
			
			this.angle = Math.atan((this.cy - y) / (this.cx - x) );
			
		};
		
		this._precatapultMove = function() {
			this.restart();
		};
		
		var self = this;
		
		this.handleDown = function(x,y) {
			if (x>120 && x<190 && y>240 && y<330) {
				self.move = self._catapultMove;
			}
		};
		
		this.handleUp = function(x,y) {
			if (self.move != self._catapultMove) return;
			self.vx = (self.cx - x)*2;
			self.vy = -(self.cy - y)/10;
			self.posX = self.x;
			self.posY = 500-self.y;
			self.flyMode();
		};

		
		this.___handleClick = function() {
			self._handleClick = self.__handleClick;
		};
		
		this.__handleClick = function() {
			var factor = 1;
			if (self.mana < 10) {
				factor = self.mana/10;
				self.mana = 0;
			} else {
				self.mana -= 7;
			}
			self.vx += 1 * factor;
			self.vy += 1.2 * factor;
		};
		
		this._handleClick = this.___handleClick;
		
		this.handleClick = function() {
			self._handleClick();
		}
		
		
		this.addMana = function(amount) {
			this.mana += amount;
			if (this.mana > 100)
				this.mana = 100;
		};
		
		this._fly = function() {
			var timestamp = new Date().getTime(),
				dt = timestamp - this.timestamp;
			
			this.timestamp = timestamp;
					
			this.vx *= 1+this.ut; // (this.ut * dt) / 100000;
			this.vy += (this.g * dt) / 50;
			
			if (this.vx<1) this.vx = 1;
			
			var prevX = this.posX,
				prevY = this.posY;
			
			this.posX += this.vx * dt/100;
			this.posY += this.vy * dt/10;
			
			if(this.posY < 0) {
				this.game.finishScreen();
				this.posY = 0;
			}
			
			this.x = 350;
			
			if(this.posX < 350) {
				this.x = this.posX;
			}
			
			if (this.posY < 250) {
				this.y = 500 - this.posY;
			} else {
				this.y = 250;
			}
			
			this.x = ~~this.x;
			this.y = ~~this.y;
			
			this.angle = Math.PI*2 - Math.atan((prevY - this.posY) / (prevX - this.posX ) );
			
			// brains
			for (var i =0; i< this.game.brains.length; i++) {
				if (this.game.brains[i].collision(this.posX, this.posY, this.r)) {
					this.addMana(20);
					this.game.brains[i].hide();
				}
			}
			
			// tunnels
			for (var i =0; i< this.game.tunnels.length; i++) {
				if (this.game.tunnels[i].collision(this.posX, this.posY, this.r)) {
					this.vx += 150;
					this.vy = 2;
					this.game.tunnels[i].hide();
				}
			}
			
			// jumpers
			for (var i =0; i< this.game.jumpers.length; i++) {
				if (this.game.jumpers[i].collision(this.posX, this.posY, this.r)) {
					this.vx = 34;
					this.vy = 7;
					this.game.jumpers[i].hide();
				}
			}
			
			if (this.vx>220) this.vx = 220;
			
		};
		
		this.prerender = function() {
			var canvas = document.createElement('canvas');
			canvas.width = this.r*2;
			canvas.height = this.r*2;
 			var ctx = canvas.getContext('2d'),
 				factor = 0.5;
			
			ctx.lineWidth = 2;
			ctx.fillStyle = '#a37a40';
			ctx.strokeStyle = 'rgb(121,95,62)';
			
			ctx.save();
			
			ctx.scale(1,1*factor);
			ctx.beginPath();
			ctx.arc(this.r*0.7, this.r/factor, this.r*0.6, 0, Math.PI*2, true);
			ctx.fill();
			ctx.stroke();
			
			ctx.restore();
			
			
			ctx.save();
			factor = 0.75;
			ctx.scale(1,1*factor);
			ctx.beginPath();
			ctx.arc(this.r*1.2, this.r*0.8/factor, this.r*0.25, 0, Math.PI*2, true);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			
			
			ctx.beginPath();
			
			ctx.moveTo(this.r*1.36, this.r*0.75);
			ctx.bezierCurveTo( this.r*1.4, this.r*0.8, this.r*1.6, this.r*0.8, this.r*1.9, this.r);
			ctx.bezierCurveTo( this.r*1.6, this.r*0.85, this.r*1.4, this.r*0.85, this.r*1.34, this.r*0.88);
			
			ctx.fill();
			ctx.stroke();
			
			// legs
			ctx.beginPath();
			ctx.moveTo(this.r*0.4, this.r*1.1);
			ctx.bezierCurveTo(this.r*0.3, this.r*1.4, this.r*0.6, this.r*1.4, this.r*0.7, this.r*1.1);
			ctx.fill();
			ctx.stroke();
			
			ctx.lineJoin = 'miter';
			ctx.fillStyle = 'rgb(165,141,124)';
			ctx.beginPath();
			ctx.lineWidth = 1;
			ctx.moveTo(this.r*0.43, this.r*1.3);
			ctx.lineTo(this.r*0.3, this.r*1.45);
			ctx.lineTo(this.r*0.15, this.r*1.47);
			ctx.lineTo(this.r*0.34, this.r*1.45);
			ctx.lineTo(this.r*0.25, this.r*1.6);
			ctx.lineTo(this.r*0.36, this.r*1.45);
			
			ctx.lineTo(this.r*0.45, this.r*1.6);
			ctx.lineTo(this.r*0.4, this.r*1.45);
			ctx.lineTo(this.r*0.47, this.r*1.3);
			ctx.stroke();
			ctx.fill();
			
			// eye
			ctx.fillStyle = 'black';
			ctx.beginPath();
			ctx.arc(this.r*1.25, this.r*0.77, this.r*0.06, 0, Math.PI*2, true);
			ctx.fill();
			
			ctx.fillStyle = 'white';
			ctx.beginPath();
			ctx.arc(this.r*1.26, this.r*0.76, this.r*0.015, 0, Math.PI*2, true);
			ctx.fill();
			
			// feather
			ctx.strokeStyle = '#d2b28c';
			ctx.beginPath();
			ctx.moveTo(this.r*0.85, this.r*0.8);
			ctx.bezierCurveTo(this.r*0.8, this.r*0.8, this.r*0.7, this.r*0.7 , this.r*0.25, this.r*0.95);
			ctx.stroke();
			
			ctx.beginPath();
			ctx.moveTo(this.r*1.05, this.r*1.1);
			ctx.bezierCurveTo(this.r*0.95, this.r*1.2, this.r*0.9, this.r*1.2 , this.r*0.8, this.r*1.2);
			ctx.stroke();
			
			ctx.strokeStyle = '#795632';
			ctx.beginPath();
			ctx.moveTo(this.r*0.85, this.r*0.85);
			ctx.bezierCurveTo(this.r*0.8, this.r*0.85, this.r*0.75, this.r*0.75 , this.r*0.25, this.r);
			ctx.stroke();
			
			ctx.beginPath();
			ctx.moveTo(this.r*1.05, this.r*1.05);
			ctx.bezierCurveTo(this.r*0.95, this.r*1.15, this.r*0.9, this.r*1.15 , this.r*0.8, this.r*1.15);
			ctx.stroke();
			
			image = canvas;
		};
		
		this.render = this._empty;
		
		this.renderMana = function() {
			this.ctx.lineWidth = 1;
			this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
			this.ctx.strokeRect(650,10, 20, 80);
			
			this.ctx.fillStyle = 'rgba(180,90,220,0.7)';
			this.ctx.fillRect(650, 10 + 80 * ((100-this.mana)/100), 20, 80*((this.mana)/100) );
			
			this.ctx.save();
			this.ctx.rotate(-Math.PI/2);
			this.ctx.fillStyle = 'black';
			
			this.ctx.font = "14px 'Trade Winds'";
			this.ctx.fillText('brain-mana', -90, 640);
			
			
			
			this.ctx.restore();
		};
		
		this._render = function() {
			if (this.move == this._catapultMove || this.posX < this.cx) {
				// lines
				this.ctx.strokeStyle = 'rgba(0,0,0,0.7)';
				this.ctx.lineWidth = 2;
				
				
				this.ctx.beginPath();
				this.ctx.moveTo(this.cx-3, this.cy);
				this.ctx.lineTo(this.x, this.y);
				this.ctx.stroke();
				
				this.ctx.beginPath();
				this.ctx.moveTo(this.cx-4, this.cy+4);
				this.ctx.lineTo(this.x, this.y);
				this.ctx.stroke();
				
				this.ctx.beginPath();
				this.ctx.moveTo(this.cx-5, this.cy+8);
				this.ctx.lineTo(this.x, this.y);
				this.ctx.stroke();
			}
			
			
			this.ctx.save();
			
			this.ctx.translate(this.x, this.y);
			this.ctx.rotate(this.angle);
			this.ctx.drawImage(image, -this.r,-this.r);
			this.ctx.restore();
			
			if (this.move == this._catapultMove || this.posX < this.cx) {
				// lines
				this.ctx.strokeStyle = 'rgba(0,0,0,0.7)';
				this.ctx.lineWidth = 2;
				
				this.ctx.beginPath();
				this.ctx.moveTo(this.cx-19, this.cy);
				this.ctx.lineTo(this.x, this.y);
				this.ctx.stroke();
				
				this.ctx.beginPath();
				this.ctx.moveTo(this.cx-18, this.cy+4);
				this.ctx.lineTo(this.x, this.y);
				this.ctx.stroke();
				
				this.ctx.beginPath();
				this.ctx.moveTo(this.cx-17, this.cy+8);
				this.ctx.lineTo(this.x, this.y);
				this.ctx.stroke();
			}
			
		};
		
		this.prerender();
	}
	
	return Kiwi;
})();

var Dust = (function() {
	var Dust = function(game) {
		this.game = game;
		this.ctx = ctx;
		
		this.init = function() {
			this.x = 200+600*Math.random();
			this.y = 500*Math.random();
		};
		
		this.init();
		
		this.image = null;
		
		this.render = function() {
			var x = this.x - this.game.centerX + 350,
				y = (500-this.y) + this.game.centerY - 250;
			
			
			if (x < -20) {
				this.x = this.x+700;
				this.y = this.game.centerY -250+500*Math.random();
			}
			
			if (y<-20) {
				this.y -= 500;
			}
			
			if (y>500) {
				this.y += 500;
			}
			
			this.ctx.drawImage(this.image, x, y);
		};
		
		this.prerender = function() {
			var canvas = document.createElement('canvas');
			canvas.width = 20;
			canvas.height = 20;
 			var ctx = canvas.getContext('2d');
 			
 			ctx.strokeStyle = 'rgba(0,0,0,0.2)';
 			ctx.lineWidth = 1.5;
 			
 			ctx.beginPath();
 			ctx.moveTo(10, 0);
 			ctx.bezierCurveTo(20*Math.random(),7,20*Math.random(), 13,10, 20);
 			ctx.stroke();
 			
 			this.image = canvas;
		};
		
		this.prerender();
		
	};
	return Dust;
})();

var Brain = (function() {
	var Brain = function(game) {
		this.game = game;
		this.ctx = ctx;
		
		this.init = function() {
			this.hidden = false;
			this.x = 400+600*Math.random();
			this.y = 500*Math.random();
			this.r = 22;
			this.add = ~~(800*Math.random());
		};
		
		this.image = null;
		
		this.init();
		
		this.collision = function(x,y,r) {
			if (this.hidden) return false;
			
			if ((x + r < this.x - this.r) || (x - r > this.x + this.r) || (y + r < this.y - this.r) || (y - r > this.y + this.r) )
				return false;

			return true;
		
		};
		
		this.hide = function() {
			this.hidden = true;
		};
		
		this.render = function() {
			var x = this.x - this.game.centerX + 350 + this.r,
				y = (500-this.y) + this.game.centerY - 250;
			
			
			if (x < -200) {
				this.hidden = false;
				this.x = this.game.centerX+350 + this.r;
				this.y = this.game.centerY -250+500*Math.random();
			}
			
			
			
			if (y > 1200 + this.add) {
				this.y += 1200 + this.add;
			}
			
			if (y < -this.r) {
				this.y -= 1200 + this.add;
			}

			if (!this.hidden && (x >= -this.r)) {
				this.ctx.drawImage(this.image, x-this.r, y-this.r);
			}
			
		};
		
		this.prerender = function() {
			var canvas = document.createElement('canvas');
			canvas.width = this.r*2;
			canvas.height = this.r*2;
 			var ctx = canvas.getContext('2d'),
 				scale = (this.r*2)/516;
 			
 			// exported from svg
			ctx.save();
			ctx.scale(scale, scale);
			ctx.beginPath();
			ctx.moveTo(0,0);
			ctx.lineTo(515.66138,0);
			ctx.lineTo(515.66138,406);
			ctx.lineTo(0,406);
			ctx.closePath();
			ctx.clip();
			ctx.strokeStyle = 'rgba(0,0,0,0)';
			ctx.lineCap = 'butt';
			ctx.lineJoin = 'miter';
			ctx.miterLimit = 4;
			ctx.save();
			ctx.restore();
			ctx.save();
			ctx.restore();
			ctx.save();
			ctx.save();
			ctx.restore();
			ctx.save();
			ctx.save();
			ctx.fillStyle = "rgba(209,169,174, 1)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 3.75;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(82.564598,260.598511);
			ctx.bezierCurveTo(67.08821900000001,254.92884899999999,53.735619,244.52569599999998,43.645668,231.31669599999998);
			ctx.bezierCurveTo(36.783318,223.59158299999999,27.614906,217.23605299999997,26.136711000000002,206.31321699999998);
			ctx.bezierCurveTo(24.117058,200.00526399999998,20.052254,191.662186,22.478172,187.16891499999997);
			ctx.bezierCurveTo(10.145683,180.92208899999997,16.010605,165.01313799999997,18.821747000000002,154.86758399999997);
			ctx.bezierCurveTo(23.75193,146.05789199999995,13.224205000000001,136.92947399999997,19.430077,128.60494999999997);
			ctx.bezierCurveTo(28.175057000000002,125.24517799999997,20.343872,116.47155799999997,25.723992000000003,110.23436699999998);
			ctx.bezierCurveTo(29.686669000000002,103.76684499999998,36.079156000000005,97.33440399999998,44.178811,96.48487099999997);
			ctx.bezierCurveTo(43.354821,86.28308899999998,53.315377000000005,80.89652999999997,57.3108,72.39476799999997);
			ctx.bezierCurveTo(65.959894,64.97478499999997,73.310373,55.351352999999975,85.29458,53.59027099999997);
			ctx.bezierCurveTo(95.52044099999999,47.70706199999997,107.59835199999999,46.50794999999997,117.20427799999999,39.350516999999975);
			ctx.bezierCurveTo(126.48381899999998,33.02699999999997,136.724031,29.180459999999975,147.85910099999998,27.641139999999975);
			ctx.bezierCurveTo(162.74359199999998,24.763154999999976,177.43585299999998,21.271832999999976,191.156007,14.678946999999976);
			ctx.bezierCurveTo(215.89853,10.586778999999975,241.298127,5.411308999999976,266.33752599999997,8.557600999999977);
			ctx.bezierCurveTo(276.64978199999996,12.349921999999976,286.961733,4.9394929999999775,297.631715,5.763857999999977);
			ctx.bezierCurveTo(312.511537,4.5879139999999765,327.116426,10.078907999999977,341.878358,11.761752999999977);
			ctx.bezierCurveTo(354.181672,15.546037999999978,366.681459,19.92495099999998,378.411805,25.011935999999977);
			ctx.bezierCurveTo(384.17404300000004,32.50617999999998,395.361695,29.729600999999978,401.505158,37.05484799999998);
			ctx.bezierCurveTo(410.643189,44.37906699999998,423.159424,49.55487099999998,428.036805,60.53124999999998);
			ctx.bezierCurveTo(428.584534,67.52790099999999,438.002625,70.28886399999998,442.515931,75.13859599999998);
			ctx.bezierCurveTo(454.53753700000004,82.81439299999998,462.660096,94.90518999999998,470.81897100000003,106.14808699999998);
			ctx.bezierCurveTo(472.58825800000005,112.34687899999997,476.32159600000006,119.87548099999998,474.337098,124.92620099999998);
			ctx.bezierCurveTo(485.82043500000003,134.92649899999998,490.93512000000004,149.80528299999997,499.252564,162.23069799999996);
			ctx.bezierCurveTo(500.724244,170.60574399999996,506.931336,178.85090699999995,504.808411,187.32453999999996);
			ctx.bezierCurveTo(510.971192,192.03140299999995,511.651734,201.13539199999997,513.7866819999999,208.07766799999996);
			ctx.bezierCurveTo(512.5375979999999,218.15638799999996,513.721374,229.06996199999998,506.0858149999999,236.95730699999996);
			ctx.bezierCurveTo(502.2484129999999,244.94162099999997,496.13848799999994,250.67065499999995,488.2152709999999,254.60020599999996);
			ctx.bezierCurveTo(480.64990199999994,259.15203999999994,470.81207299999994,258.35174699999993,462.7340699999999,255.31706399999996);
			ctx.bezierCurveTo(442.8811649999999,249.33815199999995,422.0812379999999,249.46945399999996,401.7728269999999,246.04408399999997);
			ctx.bezierCurveTo(390.6757809999999,250.71438699999996,380.8999019999999,257.94787699999995,368.8789059999999,260.45242399999995);
			ctx.bezierCurveTo(357.69189399999993,263.99981799999995,345.9933769999999,269.94094899999993,334.0925899999999,266.11917199999993);
			ctx.bezierCurveTo(334.39236399999993,276.62793099999993,321.7804259999999,276.0347299999999,314.2175899999999,277.4304209999999);
			ctx.bezierCurveTo(299.76055899999994,280.2858289999999,284.8502499999999,280.92669799999993,270.40060399999993,282.7179269999999);
			ctx.bezierCurveTo(254.44180299999994,291.3689579999999,237.17605599999993,298.3020639999999,222.40170299999994,308.7184459999999);
			ctx.bezierCurveTo(216.10723899999994,316.4568799999999,206.31076099999996,321.10311999999993,196.28311199999993,318.6657119999999);
			ctx.bezierCurveTo(185.31652899999995,317.89413599999995,176.60281399999994,309.3670669999999,166.52197299999995,305.41757399999995);
			ctx.bezierCurveTo(157.90237499999995,299.91397299999994,146.33651799999996,303.40835799999996,138.44354299999995,296.0101639999999);
			ctx.bezierCurveTo(131.96554599999996,292.8976149999999,127.35683499999995,286.3051769999999,123.84912899999995,280.4992999999999);
			ctx.bezierCurveTo(119.80171999999995,275.09686499999987,129.13772599999996,262.8781759999999,121.41881599999995,262.8966079999999);
			ctx.bezierCurveTo(108.46741499999995,262.1305559999999,99.55661799999996,263.3720409999999,82.56459799999995,260.5985119999999);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 2.5;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(143.678833,281.677338);
			ctx.bezierCurveTo(163.087433,274.771637,168.353363,252.45857300000003,184.478516,241.47749400000004);
			ctx.bezierCurveTo(196.44738800000002,233.28637800000004,209.52554400000002,220.08810500000004,225.390229,226.18237400000004);
			ctx.bezierCurveTo(245.75628700000001,232.89021400000004,267.964265,225.39521900000003,283.900147,212.15339800000004);
			ctx.bezierCurveTo(295.427033,201.99629400000003,310.569459,196.77600200000003,325.922608,198.98634500000003);
			ctx.bezierCurveTo(343.71807900000005,203.63374500000003,347.68615800000003,186.23680300000004,353.17474400000003,173.93692200000004);
			ctx.bezierCurveTo(360.05700700000006,160.53927800000002,376.42205800000005,155.44589400000004,379.98840400000006,139.72629000000003);
			ctx.bezierCurveTo(388.89795000000004,126.04443600000003,394.52902300000005,110.54704500000003,397.15463300000005,94.47091900000004);
			ctx.bezierCurveTo(397.41516200000007,82.63199100000004,405.15545700000007,73.69849600000003,412.617066,65.30292700000004);
			ctx.bezierCurveTo(413.70898500000004,63.74929200000004,414.67327900000004,62.10038200000004,415.409852,60.34973000000004);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(182.064636,307.774933);
			ctx.bezierCurveTo(192.739044,300.455017,202.52383400000002,291.671478,209.827514,280.975037);
			ctx.bezierCurveTo(216.12222200000002,275.268189,225.27371200000002,276.993256,232.95446700000002,275.150757);
			ctx.bezierCurveTo(240.12750200000002,274.984833,246.736938,272.027252,252.589019,268.093598);
			ctx.bezierCurveTo(257.764861,263.879059,263.494933,268.662354,268.162109,271.263001);
			ctx.bezierCurveTo(273.408477,274.67175299999997,278.489868,278.34191899999996,284.090057,281.175477);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 3.75;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(123.980858,263.10791);
			ctx.bezierCurveTo(132.76416,242.940765,141.586182,222.000717,160.746033,209.25143400000002);
			ctx.bezierCurveTo(180.638886,193.93850700000002,204.095459,175.69163500000002,230.637909,178.050293);
			ctx.bezierCurveTo(256.615692,187.356445,261.14770500000003,155.797257,279.691101,146.768845);
			ctx.bezierCurveTo(295.89563,137.675995,320.893005,149.378434,331.346588,128.945771);
			ctx.bezierCurveTo(340.25537099999997,111.435731,342.947204,113.377908,347.599304,107.65872300000001);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 2.5;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(263.886993,161.226944);
			ctx.bezierCurveTo(258.542938,141.304901,250.95913700000003,128.877564,255.77365100000003,108.2034);
			ctx.bezierCurveTo(257.54010000000005,98.288582,269.108337,78.088967,276.950683,71.858208);
			ctx.bezierCurveTo(294.13635200000004,45.45879000000001,294.032775,51.62735000000001,317.995757,44.482777000000006);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(390.749634,116.327995);
			ctx.bezierCurveTo(384.72943100000003,95.137016,363.007263,100.766563,354.951996,80.595596);
			ctx.bezierCurveTo(349.49591100000004,71.94548,344.117249,46.246917,338.878632,37.440178);
			ctx.bezierCurveTo(328.155823,32.256825000000006,319.424195,22.104597000000005,318.15948499999996,10.060896000000003);
			ctx.bezierCurveTo(317.91467299999994,9.258152000000003,317.66989099999995,8.455408000000004,317.425079,7.652665000000003);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(405.30835,135.631241);
			ctx.bezierCurveTo(408.477051,140.296234,412.010987,144.715439,414.951844,149.53248599999998);
			ctx.bezierCurveTo(416.317811,162.393387,420.280457,175.745255,415.927064,188.463059);
			ctx.bezierCurveTo(413.15466399999997,197.65606699999998,409.706483,207.05616799999999,410.645875,216.814301);
			ctx.bezierCurveTo(407.572572,222.034195,411.174378,229.885575,417.334107,230.58133);
			ctx.bezierCurveTo(422.770691,233.135667,430.254029,233.82328900000002,434.617859,228.918595);
			ctx.bezierCurveTo(441.26892100000003,223.22897400000002,449.941712,218.996308,458.919495,220.123093);
			ctx.bezierCurveTo(464.425599,219.842667,469.839661,214.719437,468.509705,208.97984300000002);
			ctx.bezierCurveTo(468.361939,207.40968300000003,467.969544,205.869705,467.43274,204.388336);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 2.5;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(434.602783,194.350815);
			ctx.bezierCurveTo(448.34448199999997,191.45236200000002,462.054199,188.33169600000002,475.513977,184.31327800000003);
			ctx.bezierCurveTo(479.164795,185.18804900000003,483.597961,184.94612100000003,486.230102,188.076645);
			ctx.bezierCurveTo(490.650756,191.52026400000003,494.94104,195.278198,497.972167,200.03064);
			ctx.bezierCurveTo(503.05664,206.222428,506.843932,213.29826400000002,510.347167,220.45163);
			ctx.lineTo(510.60821400000003,220.95192);
			ctx.lineTo(510.86926100000005,221.452149);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(474.503784,183.811417);
			ctx.bezierCurveTo(476.520141,177.05571,480.22772199999997,169.741501,477.26361099999997,162.6922);
			ctx.bezierCurveTo(473.76104799999996,153.29365600000003,466.193176,146.215042,461.65124499999996,137.404389);
			ctx.bezierCurveTo(459.882507,132.82354800000002,457.890137,127.81327900000001,453.31610099999995,125.31859600000001);
			ctx.bezierCurveTo(448.9743649999999,122.27546700000002,443.53393499999993,121.87336700000002,438.44909699999994,121.21077700000001);
			ctx.bezierCurveTo(430.22009299999996,118.94695300000001,426.5189209999999,110.50052600000001,421.4707639999999,104.514885);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(390.156067,225.467148);
			ctx.bezierCurveTo(383.358917,227.167786,376.76535,229.790772,369.798554,230.74362200000002);
			ctx.bezierCurveTo(359.734528,231.787628,349.618653,232.49176000000003,339.49829200000005,232.440018);
			ctx.bezierCurveTo(336.12799200000006,232.439606,333.14425800000004,230.577683,330.98156800000004,228.123246);
			ctx.bezierCurveTo(327.59033300000004,224.403672,324.808869,220.185563,321.44436700000006,216.438706);
			ctx.bezierCurveTo(320.6089180000001,215.433793,319.77276700000004,214.429474,318.9403080000001,213.422135);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(325.506287,261.602325);
			ctx.bezierCurveTo(315.817261,250.487197,300.843445,244.794372,293.708344,231.27375700000002);
			ctx.bezierCurveTo(289.454926,225.06376600000002,287.434968,217.39282100000003,288.130646,209.90898);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(289.140808,255.579727);
			ctx.bezierCurveTo(294.883453,252.648224,302.16900599999997,251.425064,305.808319,245.54222099999998);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(370.458099,178.792633);
			ctx.bezierCurveTo(381.73458800000003,181.832718,396.256317,191.254684,386.13156100000003,203.943741);
			ctx.bezierCurveTo(385.055267,206.099594,383.70349100000004,208.12512199999998,382.074829,209.90898099999998);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(388.640839,188.83017);
			ctx.bezierCurveTo(393.186524,186.822678,397.732209,184.81514,402.277893,182.807648);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(416.420044,164.238205);
			ctx.bezierCurveTo(409.59082,166.85330199999999,402.855042,169.70784,396.21698000000004,172.77011099999999);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(397.732208,121.578705);
			ctx.bezierCurveTo(408.40405200000004,111.358917,420.82867400000003,103.196144,433.369507,95.444412);
			ctx.bezierCurveTo(435.95282,91.176636,435.988648,86.029457,437.63324,81.428543);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(468.442871,252.066605);
			ctx.bezierCurveTo(481.141907,244.265992,490.28161600000004,229.65110800000002,487.10003700000004,214.473542);
			ctx.bezierCurveTo(486.60278400000004,210.667054,485.61230500000005,206.919038,484.10028100000005,203.384599);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(346.719513,193.347061);
			ctx.bezierCurveTo(350.953308,196.949341,359.860596,198.56459,358.336273,205.893951);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(358.336273,200.373337);
			ctx.bezierCurveTo(360.52493300000003,199.369568,362.713592,198.36584499999998,364.90225200000003,197.362076);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(237.11795,262.104187);
			ctx.bezierCurveTo(227.463378,258.731934,216.774719,248.50271600000002,221.965667,237.51217700000004);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(361.36673,261.100372);
			ctx.lineTo(354.295655,253.070404);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(455.815979,168.755081);
			ctx.bezierCurveTo(455.81689500000005,159.36572199999998,455.653931,136.22576899999999,440.663696,142.155655);
			ctx.bezierCurveTo(429.916565,146.987183,428.501953,162.331772,419.45050000000003,163.736328);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(458.34137,127.601189);
			ctx.lineTo(459.856568,114.05053000000001);
			ctx.lineTo(456.32104599999997,101.503624);
			ctx.lineTo(453.79565499999995,91.46608);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(479.554565,166.747589);
			ctx.bezierCurveTo(482.921753,164.405502,486.288879,162.0634,489.656066,159.721313);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(123.980858,194.350815);
			ctx.bezierCurveTo(118.333077,191.916748,112.408806,188.521286,110.18100799999999,182.45361300000002);
			ctx.bezierCurveTo(107.80928899999999,177.442596,108.073769,170.471527,102.551491,167.50787300000002);
			ctx.bezierCurveTo(98.76763199999999,163.528488,91.548638,162.73353500000002,90.09771,156.74623100000002);
			ctx.bezierCurveTo(89.78185300000001,150.40809600000003,88.651604,143.104462,82.93348,139.251617);
			ctx.bezierCurveTo(78.57602800000001,136.215683,75.32924700000001,130.359146,69.317345,130.67167600000002);
			ctx.bezierCurveTo(63.92112,130.77813700000002,58.755318,136.76893600000002,53.514336,133.84149100000002);
			ctx.bezierCurveTo(47.410576,129.811034,44.581002,122.73072000000002,41.273919,116.54011500000001);
			ctx.bezierCurveTo(38.900659,111.22973600000002,38.235436,104.62468700000001,41.768273,99.64253200000002);
			ctx.bezierCurveTo(42.243706,98.76185600000002,42.72802,97.88545200000002,43.168648,96.98673200000002);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(84.079826,219.946548);
			ctx.bezierCurveTo(80.881019,216.09883100000002,77.682197,212.251068,74.483375,208.40335000000002);
			ctx.bezierCurveTo(73.809944,205.39208900000003,73.136512,202.380828,72.46308099999999,199.36956700000002);
			ctx.bezierCurveTo(73.68424199999998,193.29684400000002,75.78369899999998,187.275954,79.54112999999998,182.27946400000002);
			ctx.bezierCurveTo(80.52010299999998,179.896362,78.92459899999999,176.66098000000002,76.23413799999999,176.41014);
			ctx.bezierCurveTo(73.70351399999998,176.86888000000002,70.97597499999999,178.07560600000002,68.47414299999998,176.856246);
			ctx.bezierCurveTo(63.42398699999998,175.704894,58.47267799999999,173.029357,55.63568799999999,168.595336);
			ctx.bezierCurveTo(55.205176999999985,168.126281,54.757437999999986,167.672027,54.28032599999999,167.24945);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(64.88694,152.193161);
			ctx.bezierCurveTo(60.846335999999994,151.524002,56.805716999999994,150.854828,52.76509899999999,150.185669);
			ctx.bezierCurveTo(49.73465799999999,151.524002,46.70418599999999,152.862351,43.673728999999994,154.200684);
			ctx.bezierCurveTo(42.497977999999996,157.230469,39.685615999999996,160.013123,40.507178999999994,163.504929);
			ctx.bezierCurveTo(41.14441699999999,170.028275,41.765235999999994,177.118393,46.15726399999999,182.367829);
			ctx.bezierCurveTo(50.025046999999994,186.65355,52.98512999999999,191.683381,55.21512499999999,196.975861);
			ctx.bezierCurveTo(56.760321999999995,199.53074700000002,57.070364999999995,202.688172,56.31891499999999,205.543808);
			ctx.bezierCurveTo(56.30008599999999,205.827332,56.29215099999999,206.11174000000003,56.30063499999999,206.395859);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(116.404716,49.810322);
			ctx.bezierCurveTo(112.800483,52.67833,109.110237,56.267296,104.19345799999999,56.371823);
			ctx.bezierCurveTo(97.44402299999999,57.831727,91.77921199999999,62.107929999999996,86.84127,66.695809);
			ctx.bezierCurveTo(80.81906799999999,70.28508099999999,73.27072899999999,68.875878,67.078559,71.94684699999999);
			ctx.bezierCurveTo(62.57006,74.69210199999999,58.720496,80.12159799999999,60.437689999999996,85.554673);
			ctx.bezierCurveTo(61.623267,88.72155799999999,65.172248,90.555054,65.614036,94.084374);
			ctx.bezierCurveTo(66.31768,97.50070199999999,68.298042,100.640992,71.659675,101.95272899999999);
			ctx.bezierCurveTo(72.131858,102.256875,72.58429699999999,102.59814499999999,72.96814699999999,103.009255);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(191.661102,70.387268);
			ctx.bezierCurveTo(194.361999,67.67437000000001,197.121734,65.019333,199.78598,62.270466000000006);
			ctx.bezierCurveTo(202.607025,56.585640000000005,205.394195,50.856480000000005,208.98547299999998,45.600559000000004);
			ctx.bezierCurveTo(210.19113099999998,43.533596,211.43667499999998,41.38224,213.52017099999998,40.062347);
			ctx.bezierCurveTo(216.166961,37.958301000000006,218.81378099999998,35.854282000000005,221.46060099999997,33.750263000000004);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(89.635674,207.399582);
			ctx.bezierCurveTo(101.852425,205.603394,114.09268999999999,203.78746,126.441597,203.203293);
			ctx.bezierCurveTo(128.895508,203.102524,131.454071,203.05479400000002,133.662384,201.845123);
			ctx.bezierCurveTo(136.159393,200.852676,138.656433,199.860183,141.153442,198.867706);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(236.612885,134.12561);
			ctx.lineTo(236.612885,134.12561);
			ctx.bezierCurveTo(238.633179,159.721313,240.148407,160.725067,240.148407,160.725067);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(185.095093,110.035538);
			ctx.bezierCurveTo(194.186463,129.106827,189.13571199999998,134.125611,189.13571199999998,134.125611);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(299.206451,61.317829);
			ctx.bezierCurveTo(316.379028,75.87223,312.338409,91.932289,312.338409,91.932289);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(287.661469,109.878059);
			ctx.bezierCurveTo(289.660737,134.33348,321.190857,138.17628399999998,321.190857,138.17628399999998);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(69.937706,246.044083);
			ctx.bezierCurveTo(85.089989,228.980332,110.34380300000001,245.04036,110.34380300000001,245.04036);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(220.955505,224.965271);
			ctx.bezierCurveTo(212.47753899999998,217.027359,211.188324,203.386383,216.40982,193.347061);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(249.744873,178.792633);
			ctx.bezierCurveTo(246.85183700000002,187.928833,241.360657,196.149475,239.595978,205.65451);
			ctx.bezierCurveTo(238.537445,207.61733999999998,236.481934,208.719879,235.097656,210.41087299999998);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(289.645874,173.271973);
			ctx.bezierCurveTo(297.042175,174.794892,304.617004,177.509339,312.234772,175.80453500000002);
			ctx.bezierCurveTo(319.87558,176.864517,321.71475200000003,167.730164,324.49615500000004,162.73257500000003);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(328.031677,149.1819);
			ctx.bezierCurveTo(335.901794,150.839966,344.371246,153.16333,352.212463,150.12037700000002);
			ctx.bezierCurveTo(358.775299,149.855103,364.531585,153.49786400000002,370.458099,155.70631500000002);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(360.861633,68.881638);
			ctx.bezierCurveTo(364.733886,68.547043,368.60614,68.212471,372.478393,67.877877);
			ctx.bezierCurveTo(378.084899,63.861095999999996,383.798431,59.989537,389.65099999999995,56.334706);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(410.864197,60.851597);
			ctx.bezierCurveTo(403.985565,52.992335999999995,393.743622,49.495922,384.099823,46.285885);
			ctx.bezierCurveTo(376.725098,43.25267,367.814545,42.079395,360.568848,46.098423000000004);
			ctx.bezierCurveTo(357.794098,47.483028000000004,355.151368,49.132179,352.27533,50.312187);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(370.963165,43.285938);
			ctx.bezierCurveTo(369.7453,40.013073,371.821472,35.984192,375.186096,35.014938);
			ctx.bezierCurveTo(377.741577,33.211643,379.623535,30.655279,382.074829,28.731508);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(291.666199,12.169554);
			ctx.bezierCurveTo(299.154602,13.909013,304.124298,27.414952,293.305664,27.828968);
			ctx.bezierCurveTo(284.101318,29.450739,274.584228,30.85548,266.712677,36.286705);
			ctx.bezierCurveTo(260.401337,40.236866,251.297668,45.355143999999996,252.82897899999998,54.122947999999994);
			ctx.bezierCurveTo(257.21658299999996,60.377807999999995,253.49563499999996,66.395111,246.39272999999997,67.84758);
			ctx.bezierCurveTo(239.32797199999996,73.18367799999999,236.73177999999996,82.12706,234.56371999999996,90.458832);
			ctx.bezierCurveTo(230.84878499999996,97.690163,228.02783099999996,106.761696,220.87484699999996,111.17997);
			ctx.bezierCurveTo(211.11630199999996,114.977051,213.41134599999995,125.941727,216.26525799999996,133.33693);
			ctx.bezierCurveTo(216.52129999999997,142.915879,206.14788699999997,145.898911,202.15020699999997,152.898316);
			ctx.bezierCurveTo(200.59735099999997,160.814957,194.25506499999997,164.991028,188.51910299999997,169.817399);
			ctx.bezierCurveTo(181.909362,174.65294,187.31930399999996,181.791902,192.31793099999996,185.26615999999999);
			ctx.bezierCurveTo(193.07775799999996,185.830277,193.87078699999995,186.350251,194.69152699999995,186.822648);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 2.5;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(255.30069,13.173317);
			ctx.bezierCurveTo(244.736298,14.941069,240.754029,26.370886,238.989685,35.506371);
			ctx.bezierCurveTo(232.586975,41.921620000000004,230.235626,51.38139,230.22641000000002,59.471722);
			ctx.bezierCurveTo(224.98654200000001,65.253586,214.00048800000002,69.577973,216.710877,79.10434000000001);
			ctx.bezierCurveTo(218.205445,90.883767,202.588074,90.51138300000001,194.582184,92.20493400000001);
			ctx.bezierCurveTo(186.12857100000002,92.07490600000001,174.30349700000002,89.42717100000002,169.68634,98.790513);
			ctx.bezierCurveTo(165.029236,108.475198,169.683044,119.295045,168.470306,129.48095800000002);
			ctx.bezierCurveTo(166.74075299999998,144.624986,156.952606,157.542481,155.512878,172.80829);
			ctx.bezierCurveTo(153.998382,183.628007,154.831115,194.617738,156.305755,205.392091);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(149.23468,182.807648);
			ctx.bezierCurveTo(147.92807,172.080475,145.71994,161.092575,148.176147,150.358307);
			ctx.bezierCurveTo(148.87588499999998,144.245209,148.30969199999998,138.064453,147.27682399999998,132.02204899999998);
			ctx.bezierCurveTo(145.88748099999998,127.92914599999997,142.74432299999998,124.78631599999999,140.64837599999998,121.07680499999998);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(217.925049,16.184576);
			ctx.bezierCurveTo(217.45166,20.502567,212.501892,21.685577,208.857636,21.930475);
			ctx.bezierCurveTo(198.786896,22.98488,189.51684600000002,27.427656000000002,179.781403,29.909605);
			ctx.bezierCurveTo(173.035523,32.253033,166.811768,35.79145,160.34637500000002,38.76902);
			ctx.bezierCurveTo(157.14755300000002,43.787803999999994,153.948731,48.80656,150.74990900000003,53.825344);
			ctx.bezierCurveTo(150.68023700000003,58.016155,151.55267400000002,63.510548,156.21469200000004,64.946403);
			ctx.bezierCurveTo(160.91693200000003,66.911621,165.44906700000004,69.247169,170.09762700000005,71.33010800000001);
			ctx.bezierCurveTo(175.05117900000005,75.69668500000002,177.33709800000005,82.08078700000002,180.76495500000004,87.546676);
			ctx.bezierCurveTo(181.53982700000003,89.01788300000001,182.30471900000003,90.494247,183.07480000000004,91.967948);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(167.417419,102.005493);
			ctx.bezierCurveTo(164.06085199999998,99.770927,160.314178,97.456001,156.099517,97.82334900000001);
			ctx.bezierCurveTo(152.01891999999998,97.37582400000001,147.95187299999998,98.36837000000001,144.233581,99.976707);
			ctx.bezierCurveTo(139.18658399999998,101.524398,134.20190399999998,103.46296600000001,129.89105199999997,106.548309);
			ctx.bezierCurveTo(126.81395699999997,108.263565,124.21599599999998,110.65960700000001,121.93569199999997,113.30564100000001);
			ctx.bezierCurveTo(119.48822799999998,115.65185500000001,117.20008099999997,118.305778,116.20569599999997,121.602203);
			ctx.bezierCurveTo(115.35443899999997,124.102928,113.47977399999998,126.470039,114.01927899999997,129.214141);
			ctx.bezierCurveTo(114.11539399999997,132.937072,114.13539799999997,136.85787900000003,116.07964299999998,140.175902);
			ctx.bezierCurveTo(117.19815799999998,142.843306,118.31667299999998,145.510726,119.43517299999998,148.178145);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(112.364098,128.60495);
			ctx.bezierCurveTo(107.416832,129.505035,101.048775,127.181809,99.98775499999999,121.799103);
			ctx.bezierCurveTo(97.041969,116.682274,98.24887899999999,109.36300700000001,92.88606999999999,105.67272200000001);
			ctx.bezierCurveTo(86.85788699999999,104.490898,82.93701899999999,97.84997600000001,84.54503599999998,92.010582);
			ctx.bezierCurveTo(85.77460399999998,84.750412,92.88565799999998,80.952393,98.51808899999997,77.267571);
			ctx.bezierCurveTo(107.87541899999998,71.608552,118.51802799999997,68.170052,127.25305899999998,61.478852);
			ctx.bezierCurveTo(131.872436,57.48800000000001,127.05295499999998,51.301518,129.26827999999998,46.693474);
			ctx.bezierCurveTo(132.62326,41.672596,139.25582899999998,41.342549000000005,144.34344499999997,39.005367);
			ctx.bezierCurveTo(149.63363699999996,36.975429,155.82046499999998,35.712364,161.09326199999998,38.499496);
			ctx.lineTo(161.86160299999997,38.76902);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.25;
			ctx.miterLimit = 4;
			ctx.beginPath();
			ctx.moveTo(138.490662,59.639961);
			ctx.bezierCurveTo(137.83090199999998,64.192779,131.38232499999998,68.025192,130.05480999999997,74.00419600000001);
			ctx.bezierCurveTo(132.30676299999996,84.42861200000002,128.10845999999998,85.036766,117.72020799999997,85.01921100000001);
			ctx.bezierCurveTo(113.76337499999997,86.12979900000002,111.85010599999997,90.19434400000002,110.63030299999997,93.75283800000001);
			ctx.bezierCurveTo(109.30509199999997,97.54579100000001,108.85019699999997,101.55960100000001,108.32349499999997,105.51864600000002);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(165.902191,68.379745);
			ctx.bezierCurveTo(166.094696,63.727306,167.194641,58.991989000000004,170.86709599999998,55.813644);
			ctx.bezierCurveTo(173.18160999999998,53.399561999999996,174.80239899999998,50.39825,174.94528199999996,47.038867999999994);
			ctx.lineTo(174.98428299999998,46.845096999999996);
			ctx.lineTo(174.99355999999997,46.799065);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.restore();
			ctx.restore();
			ctx.restore();
 				
 			
 			this.image = canvas;
		};
		
		this.prerender();
	};
	return Brain;
})();

var Tunnel = (function() {
	var Tunnel = function(game) {
		this.game = game;
		this.ctx = ctx;
		this.image = null;
		
		this.init = function() {
			this.hidden = false;
			this.x = 500+600*Math.random();
			this.y = 500*Math.random();
			this.w = 173;
			this.h = 69;
			this.add = ~~(800*Math.random());
		};
		
		this.init();
		this.prerender();
		
		
		
	};
	
	Tunnel.prototype.collision = function(x,y,r) {
		if (this.hidden) return false;
		if ((x + r < this.x) || (x - r > this.x + this.w) || (y + r < this.y - this.h) || (y - r > this.y) )
			return false;

		
		return true;
	};
	
	Tunnel.prototype.hide = function() {
		this.hidden = true;
	};
	
	Tunnel.prototype.render = function() {
		var x = this.x - this.game.centerX + 350,
			y = (500-this.y) + this.game.centerY - 250;
		
		
		if (x < -800) {
			this.hidden = false;
			this.x = this.game.centerX+350 + this.w;
			this.y = this.game.centerY -250+500*Math.random();
		}			
		
		if (y > 1200 + this.add) {
			this.y += 1200 + this.add;
		}
		
		if (y<-this.h) {
			this.y -= 1200 + this.add;
		}

		if (x >= -this.w) {
			this.ctx.drawImage(this.image, x, y);
		}
		
	};
	
	Tunnel.prototype.prerender = function() {
		var canvas = document.createElement('canvas');
		canvas.width = this.w;
		canvas.height = this.h;
		var ctx = canvas.getContext('2d');
		
		
			ctx.save();
			ctx.translate(0,0);
			ctx.beginPath();
			ctx.moveTo(0,0);
			ctx.lineTo(173,0);
			ctx.lineTo(173,69);
			ctx.lineTo(0,69);
			ctx.closePath();
			ctx.clip();
			ctx.translate(0,0);
			ctx.translate(0,0);
			ctx.scale(1,1);
			ctx.translate(0,0);
			ctx.strokeStyle = 'rgba(0,0,0,0)';
			ctx.lineCap = 'butt';
			ctx.lineJoin = 'miter';
			ctx.miterLimit = 4;
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.lineWidth = 0.5;
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(19.484,17.01);
			ctx.bezierCurveTo(19.484,17.01,88.381,38.42700000000001,154.477,11.464000000000002);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.lineWidth = 0.5;
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(157.651,28.02);
			ctx.bezierCurveTo(127.36500000000001,32.711,45.06300000000002,32.482,16.308999999999997,28.02);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.lineWidth = 0.5;
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(16.31,39.064);
			ctx.bezierCurveTo(32.902,37.916,125.021,34.565,156.532,43.522);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.lineWidth = 0.5;
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(153.442,56.637);
			ctx.bezierCurveTo(85.759,34.265,21.724,51.03,21.724,51.03);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(17.887,10.306);
			ctx.bezierCurveTo(17.887,10.306,81.239,38.481,148.184,7.050999999999999);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(17.887,57.315);
			ctx.bezierCurveTo(17.887,57.315,89.361,34.181,148.184,63.003);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(39.086,17.01);
			ctx.bezierCurveTo(43.683,17.01,47.407,24.687,47.407,34.636);
			ctx.bezierCurveTo(47.407,44.585,43.681999999999995,52.295,39.086,52.295);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(60.779,20.807);
			ctx.bezierCurveTo(63.467000000000006,20.807,65.647,26.174,65.647,34.573);
			ctx.bezierCurveTo(65.647,42.971000000000004,63.467000000000006,49.265,60.779,49.265);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(77.041,21.883);
			ctx.bezierCurveTo(77.893,21.883,78.584,27.4,78.584,35.361999999999995);
			ctx.bezierCurveTo(78.584,43.324,77.893,48.55,77.041,48.55);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(133.361,56.637);
			ctx.bezierCurveTo(127.47099999999999,56.637,122.69699999999999,47.047,122.69699999999999,35.216);
			ctx.bezierCurveTo(122.69699999999999,23.385,127.47099999999999,13.098000000000003,133.361,13.098000000000003);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(91.461,48.833);
			ctx.bezierCurveTo(90.223,48.833,89.22,42.808,89.22,35.375);
			ctx.bezierCurveTo(89.22,27.942,90.223,21.916,91.461,21.916);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(110.262,51.03);
			ctx.bezierCurveTo(106.616,51.03,103.662,43.921,103.662,35.149);
			ctx.bezierCurveTo(103.662,26.379,106.617,19.270000000000003,110.262,19.270000000000003);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			g=ctx.createLinearGradient(0,34.5,173,34.5);
			g.addColorStop(0,"rgba(255, 255, 255, 0)");
			g.addColorStop(0.0199,"rgba(238, 248, 253, 0.0299)");
			g.addColorStop(0.0851,"rgba(185, 228, 245, 0.1281)");
			g.addColorStop(0.1514,"rgba(141, 210, 239, 0.2278)");
			g.addColorStop(0.2175,"rgba(104, 196, 234, 0.3272)");
			g.addColorStop(0.2833,"rgba(75, 184, 230, 0.4262)");
			g.addColorStop(0.3489,"rgba(55, 176, 227, 0.5249)");
			g.addColorStop(0.414,"rgba(43, 172, 226, 0.623)");
			g.addColorStop(0.4785,"rgba(39, 170, 225, 0.72)");
			g.addColorStop(0.5709,"rgba(42, 171, 225, 0.5925)");
			g.addColorStop(0.6439,"rgba(52, 175, 227, 0.4917)");
			g.addColorStop(0.7103,"rgba(69, 182, 229, 0.4)");
			g.addColorStop(0.7728,"rgba(92, 191, 232, 0.3137)");
			g.addColorStop(0.8325,"rgba(123, 203, 237, 0.2312)");
			g.addColorStop(0.8902,"rgba(160, 218, 242, 0.1515)");
			g.addColorStop(0.9452,"rgba(204, 235, 248, 0.0756)");
			g.addColorStop(0.9987,"rgba(254, 254, 255, 0.0018)");
			g.addColorStop(1,"rgba(255, 255, 255, 0)");
			ctx.fillStyle = g;
			ctx.beginPath();
			ctx.moveTo(161.759,69);
			ctx.bezierCurveTo(174.60199999999998,59.82,178.749,20.807000000000002,161.759,0);
			ctx.bezierCurveTo(75.561,45.033,13.205,7.198,7.908,4.246);
			ctx.bezierCurveTo(-8.336,35.216,5.48,63.002,5.48,63.002);
			ctx.bezierCurveTo(53.569,41.692,107.585,44.048,161.759,69);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(77.041,48.549);
			ctx.bezierCurveTo(76.188,48.549,75.49799999999999,43.324,75.49799999999999,35.361);
			ctx.bezierCurveTo(75.49799999999999,27.398999999999997,76.18799999999999,21.881999999999998,77.041,21.881999999999998);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(133.361,13.098);
			ctx.bezierCurveTo(139.25099999999998,13.098,144.02499999999998,23.386000000000003,144.02499999999998,35.216);
			ctx.bezierCurveTo(144.02499999999998,47.047,139.25099999999998,56.637,133.361,56.637);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(39.086,52.296);
			ctx.bezierCurveTo(34.491,52.296,30.766,44.586,30.766,34.637);
			ctx.bezierCurveTo(30.766,24.687,34.491,17.011,39.086,17.011);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(60.779,49.264);
			ctx.bezierCurveTo(58.091,49.264,55.910000000000004,42.971000000000004,55.910000000000004,34.572);
			ctx.bezierCurveTo(55.910000000000004,26.173000000000002,58.09,20.806000000000004,60.779,20.806000000000004);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(91.461,21.916);
			ctx.bezierCurveTo(92.698,21.916,93.701,27.942,93.701,35.375);
			ctx.bezierCurveTo(93.701,42.808,92.698,48.833,91.461,48.833);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(110.262,19.27);
			ctx.bezierCurveTo(113.907,19.27,116.862,26.38,116.862,35.149);
			ctx.bezierCurveTo(116.862,43.92,113.907,51.03,110.262,51.03);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(10.896,33.539);
			ctx.lineTo(154.477,34.573);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(13.375,21.174);
			ctx.bezierCurveTo(13.375,21.174,86.513,36.729,151.489,20.945);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.strokeStyle = "#ffffff";
			ctx.miterLimit = 10;
			ctx.beginPath();
			ctx.moveTo(13.375,45.214);
			ctx.bezierCurveTo(13.375,45.214,87.26,32.907,151.489,49.778999999999996);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			ctx.restore();
			ctx.restore();
			
		
		/*ctx.strokeStyle = 'rgba(255,255,255,0.8)';
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.moveTo(this.w*0.05, 0);
		ctx.bezierCurveTo(this.w*0.25, this.h*0.3, this.w*0.75, this.h*0.3, this.w*0.95, 0);
		ctx.stroke();
		
		ctx.strokeStyle = 'rgba(255,255,255,0)';
		ctx.bezierCurveTo(this.w, this.h*0.3, this.w, this.h*0.7, this.w*0.95, this.h);
		ctx.bezierCurveTo(this.w*0.75, this.h*0.7, this.w*0.25, this.h*0.7, this.w*0.05, this.h);
		ctx.bezierCurveTo(0, this.h*0.7, 0, this.h*0.3, this.w*0.05, 0);
		
		var radgrad = ctx.createRadialGradient(this.w*0.5, this.h*0.5, 20, this.w*0.5, this.h*0.5, this.w/2);
		radgrad.addColorStop(0, 'rgb(100,120,255)');
		radgrad.addColorStop(1, 'rgba(100,120,255, 0)');
		
		ctx.fillStyle = radgrad;
		
		ctx.fill();

		ctx.beginPath();
		ctx.moveTo(this.w*0.95, this.h);
		ctx.strokeStyle = 'rgba(255,255,255,0.8)';
		ctx.bezierCurveTo(this.w*0.75, this.h*0.7, this.w*0.25, this.h*0.7, this.w*0.05, this.h);
		ctx.stroke();
		
		ctx.lineWidth = 1;
		ctx.beginPath();
		
		ctx.moveTo(this.w*0.05, this.h*0.23);
		ctx.strokeStyle = 'rgba(255,255,255,0.6)';
		ctx.bezierCurveTo(this.w*0.05, this.h*0.43, this.w*0.95, this.h*0.43, this.w*0.95, this.h*0.23);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(this.w*0.05, this.h*0.76);
		ctx.bezierCurveTo(this.w*0.05, this.h*0.56, this.w*0.95, this.h*0.56, this.w*0.95, this.h*0.76);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(this.w*0.25, this.h*0.18);
		ctx.bezierCurveTo(this.w*0.15, this.h*0.4, this.w*0.15, this.h*0.6, this.w*0.25, this.h*0.82);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(this.w*0.75, this.h*0.18);
		ctx.bezierCurveTo(this.w*0.85, this.h*0.4, this.w*0.85, this.h*0.6, this.w*0.75, this.h*0.82);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(this.w*0.38, this.h*0.2);
		ctx.bezierCurveTo(this.w*0.32, this.h*0.4, this.w*0.32, this.h*0.6, this.w*0.38, this.h*0.8);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(this.w*0.62, this.h*0.2);
		ctx.bezierCurveTo(this.w*0.68, this.h*0.4, this.w*0.68, this.h*0.6, this.w*0.62, this.h*0.8);
		ctx.stroke();*/
		
		this.image = canvas;
		
	};
	
	return Tunnel;
})();

var Jumper = (function() {
	var Jumper = function(game) {
		this.game = game;
		this.ctx = ctx;
		
		this.init = function() {
			this.x = 600+600*Math.random();
			this.y = 50;
			this.w = 250;
			this.h = 50;
			this.add = ~~(800*Math.random());
			this.hidden = false;
		};
		this.image = null;
		
		this.init();
		this.prerender();
		
	};
	
	Jumper.prototype.collision = function(x,y,r) {
		if (this.hidden) return false;
		if ((x + r < this.x) || (x - r > this.x + this.w) || (y + r < this.y - this.h) || (y - r > this.y) )
			return false;

		
		return true;
	};
	
	Jumper.prototype.hide = function() {
		this.hidden = true;
	};
	
	Jumper.prototype.render = function() {
		var x = this.x - this.game.centerX + 350,
			y = (500-this.y) + this.game.centerY - 250;
		
		
		if (x < -700) {
			this.hidden = false;
			this.x = this.game.centerX+350 + this.w;
		}			

		if (x >= -this.w) {
			this.ctx.drawImage(this.image, x, y);
		}
		
	};
	
	Jumper.prototype.prerender = function() {
		var canvas = document.createElement('canvas');
		canvas.width = this.w;
		canvas.height = this.h;
		var ctx = canvas.getContext('2d');
		
		/*ctx.strokeStyle = 'rgba(255,155,155,0.8)';
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.moveTo(this.w*0.38, this.h*0.3);
		ctx.bezierCurveTo(this.w*-0.15, this.h*0.7, this.w*-0.1, this.h, this.w*0.43, this.h*0.55);
		ctx.bezierCurveTo(this.w*0.48, this.h, this.w*0.52, this.h, this.w*0.57, this.h*0.55);
		
		ctx.bezierCurveTo(this.w*1.15, this.h, this.w*1.1, this.h*0.7, this.w*0.62, this.h*0.3);
		
		ctx.bezierCurveTo(this.w*0.5, 0, this.w*0.5, 0, this.w*0.38, this.h*0.3);
		
		var radgrad = ctx.createRadialGradient(this.w*0.5, this.h*0.5, 0, this.w*0.5, this.h*0.5, this.w*0.5);
		radgrad.addColorStop(0, 'rgb(218,40,81)');
		radgrad.addColorStop(0.7, 'rgb(190,9,52)');
		
		ctx.fillStyle = radgrad;
		
		ctx.fill();
		ctx.stroke();
		
		ctx.lineWidth = 2;
		ctx.strokeStyle = 'white';
		ctx.fillStyle = 'rgba(255,255,255,0.7)';
		ctx.beginPath();
		ctx.moveTo(this.w*0.15, this.h*0.65);
		ctx.bezierCurveTo(this.w*0.15, this.h*0.5, this.w*0.2, this.h*0.5, this.w*0.2, this.h*0.6);
		ctx.stroke();
		ctx.fill();
		
		ctx.beginPath();
		ctx.moveTo(this.w*0.3, this.h*0.5);
		ctx.bezierCurveTo(this.w*0.3, this.h*0.33, this.w*0.35, this.h*0.33, this.w*0.35, this.h*0.45);
		ctx.stroke();
		ctx.fill();
		
		ctx.beginPath();
		ctx.moveTo(this.w*0.85, this.h*0.65);
		ctx.bezierCurveTo(this.w*0.85, this.h*0.5, this.w*0.8, this.h*0.5, this.w*0.8, this.h*0.6);
		ctx.stroke();
		ctx.fill();
		
		ctx.beginPath();
		ctx.moveTo(this.w*0.7, this.h*0.5);
		ctx.bezierCurveTo(this.w*0.7, this.h*0.33, this.w*0.65, this.h*0.33, this.w*0.65, this.h*0.45);
		ctx.stroke();
		ctx.fill();
		
		ctx.beginPath();
		ctx.moveTo(this.w*0.475, this.h*0.7);
		ctx.bezierCurveTo(this.w*0.475, this.h*0.55, this.w*0.525, this.h*0.55, this.w*0.525, this.h*0.7);
		ctx.stroke();
		ctx.fill();*/
		
		ctx.save();
		ctx.translate(0,0);
		ctx.beginPath();
		ctx.moveTo(0,0);
		ctx.lineTo(250,0);
		ctx.lineTo(250,50);
		ctx.lineTo(0,50);
		ctx.closePath();
		ctx.clip();
		ctx.translate(0,0);
		ctx.translate(0,0);
		ctx.scale(1,1);
		ctx.translate(0,0);
		ctx.strokeStyle = 'rgba(0,0,0,0)';
		ctx.lineCap = 'butt';
		ctx.lineJoin = 'miter';
		ctx.miterLimit = 4;
		ctx.save();
		ctx.save();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.restore();
		ctx.save();
		g=ctx.createRadialGradient(42.171913229999994,27.002364990000004,0,62.12918588999999,33.23841463,30.8533);
		g.addColorStop(0,"#D0C085");
		g.addColorStop(0.1715,"#CFB97F");
		g.addColorStop(0.4647,"#CCA870");
		g.addColorStop(0.8418,"#C78B5A");
		g.addColorStop(1,"#C47F51");
		ctx.fillStyle = g;
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 2;
		ctx.miterLimit = 10;
		ctx.beginPath();
		ctx.moveTo(96.186,48.884);
		ctx.bezierCurveTo(78.04,50.903,64.30600000000001,51.739,35.87800000000001,59.813);
		ctx.bezierCurveTo(32.495000000000005,48.814,37.83700000000001,31.256000000000004,28.427000000000007,18.700000000000003);
		ctx.bezierCurveTo(52.288,17.981,64.844,8.157,88.735,7.77);
		ctx.bezierCurveTo(87.626,18.676,91.561,38.887,96.186,48.884);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(38.129,32.082);
		ctx.bezierCurveTo(37.666999999999994,30.304000000000002,37.425999999999995,28.455000000000002,36.805,26.802);
		ctx.bezierCurveTo(36.496,25.957,35.99,25.33,35.474,24.62);
		ctx.bezierCurveTo(34.961999999999996,23.912000000000003,34.351,23.153000000000002,34.035999999999994,22.239);
		ctx.lineTo(34.117,22.18);
		ctx.bezierCurveTo(34.87,22.758,35.568,23.289,36.239999999999995,23.976);
		ctx.bezierCurveTo(36.928,24.649,37.340999999999994,25.644,37.565999999999995,26.555);
		ctx.bezierCurveTo(38.056,28.404,38.047999999999995,30.243,38.227999999999994,32.064);
		ctx.lineTo(38.129,32.082);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(42.497,29.568);
		ctx.bezierCurveTo(41.578,27.913,41.031,26.059,40.105,24.504);
		ctx.bezierCurveTo(39.638999999999996,23.722,39.01499999999999,23.117,38.376999999999995,22.587);
		ctx.bezierCurveTo(37.72899999999999,22.047,36.92999999999999,21.685,36.023999999999994,21.328);
		ctx.lineTo(36.032999999999994,21.227999999999998);
		ctx.bezierCurveTo(36.992999999999995,21.034,38.059999999999995,21.215999999999998,38.949999999999996,21.767999999999997);
		ctx.bezierCurveTo(39.86299999999999,22.314999999999998,40.398999999999994,23.255999999999997,40.809999999999995,24.127999999999997);
		ctx.bezierCurveTo(41.642999999999994,25.907999999999998,41.934,27.766999999999996,42.586,29.528);
		ctx.lineTo(42.497,29.568);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(47.936,22.064);
		ctx.bezierCurveTo(47.251,22.255,46.581,22.485,45.866,22.641);
		ctx.bezierCurveTo(45.16,22.779999999999998,44.361,22.836,43.602,22.593);
		ctx.bezierCurveTo(42.873999999999995,22.37,42.172999999999995,22.095,41.602,21.688);
		ctx.bezierCurveTo(41.022,21.282999999999998,40.501999999999995,20.881999999999998,39.903,20.429);
		ctx.lineTo(39.929,20.331999999999997);
		ctx.bezierCurveTo(40.7,20.257999999999996,41.446000000000005,20.522999999999996,42.095,20.817999999999998);
		ctx.bezierCurveTo(42.754999999999995,21.108999999999998,43.274,21.570999999999998,43.878,21.842);
		ctx.bezierCurveTo(44.447,22.122,45.113,22.18,45.805,22.145);
		ctx.bezierCurveTo(46.497,22.127,47.207,22.026,47.917,21.965);
		ctx.lineTo(47.936,22.064);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(38.321,47.49);
		ctx.bezierCurveTo(38.293,48.18,38.315999999999995,48.856,38.33,49.548);
		ctx.bezierCurveTo(38.333,50.230000000000004,38.308,50.947,38.25,51.628);
		ctx.bezierCurveTo(38.208,52.279,38.325,52.918,38.354,53.535);
		ctx.bezierCurveTo(38.391,54.163,38.499,54.779999999999994,38.615,55.503);
		ctx.lineTo(38.53,55.556);
		ctx.bezierCurveTo(37.933,55.11,37.551,54.422,37.368,53.699);
		ctx.bezierCurveTo(37.172000000000004,52.963,37.321000000000005,52.217,37.459,51.512);
		ctx.bezierCurveTo(37.616,50.84,37.734,50.196,37.832,49.511);
		ctx.bezierCurveTo(37.95,48.837,38.062,48.146,38.222,47.479);
		ctx.lineTo(38.321,47.49);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(43.353,48.72);
		ctx.bezierCurveTo(42.882000000000005,49.644999999999996,42.296,50.498999999999995,41.796,51.365);
		ctx.bezierCurveTo(41.543,51.800000000000004,41.391,52.275,41.114,52.661);
		ctx.lineTo(40.251999999999995,53.889);
		ctx.lineTo(40.151999999999994,53.879000000000005);
		ctx.bezierCurveTo(39.92999999999999,53.324000000000005,40.035999999999994,52.721000000000004,40.21999999999999,52.211000000000006);
		ctx.bezierCurveTo(40.40399999999999,51.685,40.806999999999995,51.303000000000004,41.14199999999999,50.903000000000006);
		ctx.bezierCurveTo(41.81599999999999,50.099000000000004,42.569999999999986,49.41100000000001,43.26899999999999,48.66400000000001);
		ctx.lineTo(43.353,48.72);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(49.152,52.308);
		ctx.bezierCurveTo(48.502,52.207,47.848,52.199,47.205,52.247);
		ctx.bezierCurveTo(46.562999999999995,52.28,45.927,52.374,45.321,52.539);
		ctx.bezierCurveTo(44.71,52.701,44.174,53.008,43.632,53.225);
		ctx.bezierCurveTo(43.083999999999996,53.458,42.583,53.735,42.028,54.163000000000004);
		ctx.lineTo(41.94,54.114000000000004);
		ctx.bezierCurveTo(42.021,53.383,42.544,52.752,43.144999999999996,52.351000000000006);
		ctx.bezierCurveTo(43.75599999999999,51.92900000000001,44.492999999999995,51.837,45.172,51.75200000000001);
		ctx.bezierCurveTo(46.544999999999995,51.59600000000001,47.922,51.74700000000001,49.175999999999995,52.20900000000001);
		ctx.lineTo(49.152,52.308);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(75.866,14.595);
		ctx.bezierCurveTo(77.003,13.252,78.192,11.924000000000001,79.675,10.865);
		ctx.bezierCurveTo(80.41,10.344,81.202,9.803,82.137,9.616);
		ctx.bezierCurveTo(83.055,9.421,84.05,9.463,84.889,9.868);
		ctx.lineTo(84.874,9.967);
		ctx.bezierCurveTo(83.97399999999999,10.114,83.17699999999999,10.293000000000001,82.407,10.579);
		ctx.bezierCurveTo(81.648,10.868,80.84899999999999,11.117,80.10499999999999,11.539000000000001);
		ctx.bezierCurveTo(78.62299999999999,12.383000000000001,77.276,13.526000000000002,75.93599999999999,14.665000000000001);
		ctx.lineTo(75.866,14.595);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(79.565,15.852);
		ctx.bezierCurveTo(80.238,15.051,80.826,14.209,81.42399999999999,13.362);
		ctx.bezierCurveTo(81.72399999999999,12.94,81.95599999999999,12.456,82.354,12.105);
		ctx.bezierCurveTo(82.746,11.751000000000001,83.181,11.424,83.741,11.24);
		ctx.lineTo(83.813,11.309000000000001);
		ctx.bezierCurveTo(83.652,11.872000000000002,83.397,12.321000000000002,83.113,12.755);
		ctx.bezierCurveTo(82.835,13.192,82.405,13.507000000000001,82.035,13.878);
		ctx.bezierCurveTo(81.29599999999999,14.618,80.50399999999999,15.335,79.634,15.925);
		ctx.lineTo(79.565,15.852);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(85.182,20.308);
		ctx.bezierCurveTo(84.72800000000001,20.029,84.408,19.517,84.258,18.983);
		ctx.bezierCurveTo(84.118,18.441,84.106,17.881,84.15299999999999,17.336000000000002);
		ctx.bezierCurveTo(84.20899999999999,16.794,84.246,16.225,84.52199999999999,15.743000000000002);
		ctx.bezierCurveTo(84.78999999999999,15.268000000000002,85.148,14.810000000000002,85.689,14.555000000000001);
		ctx.lineTo(85.76799999999999,14.617);
		ctx.bezierCurveTo(85.68499999999999,15.182,85.573,15.648000000000001,85.448,16.122);
		ctx.bezierCurveTo(85.336,16.592,85.07199999999999,17.01,84.94099999999999,17.48);
		ctx.bezierCurveTo(84.80699999999999,17.944,84.725,18.426000000000002,84.75299999999999,18.901);
		ctx.bezierCurveTo(84.76399999999998,19.375,84.89899999999999,19.858999999999998,85.25199999999998,20.235);
		ctx.lineTo(85.182,20.308);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(88.63,38.551);
		ctx.bezierCurveTo(88.979,39.908,89.547,41.168,90.18299999999999,42.388000000000005);
		ctx.bezierCurveTo(90.50099999999999,43.00000000000001,90.92099999999999,43.559000000000005,91.17399999999999,44.205000000000005);
		ctx.bezierCurveTo(91.43199999999999,44.85000000000001,91.67099999999999,45.514,91.75999999999999,46.260000000000005);
		ctx.lineTo(91.672,46.307);
		ctx.bezierCurveTo(91.098,45.825,90.669,45.261,90.285,44.665);
		ctx.bezierCurveTo(89.895,44.072,89.698,43.377,89.451,42.711999999999996);
		ctx.bezierCurveTo(88.95899999999999,41.38099999999999,88.594,39.98,88.53099999999999,38.568);
		ctx.lineTo(88.63,38.551);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(82.987,38.586);
		ctx.bezierCurveTo(83.591,39.231,83.984,40.054,84.46199999999999,40.745999999999995);
		ctx.bezierCurveTo(84.91599999999998,41.443999999999996,85.55199999999999,42.010999999999996,86.18299999999999,42.602);
		ctx.bezierCurveTo(86.82799999999999,43.187999999999995,87.51599999999999,43.800999999999995,87.99699999999999,44.522);
		ctx.lineTo(89.45499999999998,46.658);
		ctx.lineTo(89.39499999999998,46.738);
		ctx.bezierCurveTo(88.52099999999999,46.43,87.81699999999998,45.786,87.22199999999998,45.156);
		ctx.bezierCurveTo(86.61799999999998,44.519,86.18499999999997,43.803,85.60399999999998,43.156);
		ctx.bezierCurveTo(85.04299999999998,42.492,84.43499999999999,41.815,84.02699999999999,40.995999999999995);
		ctx.bezierCurveTo(83.63699999999999,40.187,83.39599999999999,39.364,82.90599999999999,38.645999999999994);
		ctx.lineTo(82.987,38.586);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(77.74,43.762);
		ctx.bezierCurveTo(78.487,44.089,79.285,44.204,80.085,44.24);
		ctx.bezierCurveTo(80.88499999999999,44.292,81.69399999999999,44.267,82.51899999999999,44.27);
		ctx.bezierCurveTo(83.33899999999998,44.281000000000006,84.21,44.232000000000006,85.044,44.535000000000004);
		ctx.bezierCurveTo(85.87899999999999,44.847,86.575,45.29900000000001,87.191,45.906000000000006);
		ctx.lineTo(87.147,45.99600000000001);
		ctx.bezierCurveTo(86.30000000000001,45.88600000000001,85.51100000000001,45.64000000000001,84.777,45.50000000000001);
		ctx.bezierCurveTo(84.035,45.37100000000001,83.272,45.166000000000004,82.46600000000001,45.06900000000001);
		ctx.bezierCurveTo(81.664,44.96600000000001,80.84,44.89000000000001,80.02000000000001,44.73600000000001);
		ctx.bezierCurveTo(79.20600000000002,44.56600000000001,78.38700000000001,44.30300000000001,77.69300000000001,43.85200000000001);
		ctx.lineTo(77.74,43.762);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.restore();
		ctx.save();
		g=ctx.createRadialGradient(197.84102454,43.83482099999999,0,218.35807794,47.86475811999999,30.8533);
		g.addColorStop(0,"#D0C085");
		g.addColorStop(0.1715,"#CFB97F");
		g.addColorStop(0.4647,"#CCA870");
		g.addColorStop(0.8418,"#C78B5A");
		g.addColorStop(1,"#C47F51");
		ctx.fillStyle = g;
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 2;
		ctx.miterLimit = 10;
		ctx.beginPath();
		ctx.moveTo(253.906,59.713);
		ctx.bezierCurveTo(236.086,63.692,222.524,66.018,195.143,77.13300000000001);
		ctx.bezierCurveTo(190.585,66.56700000000001,193.988,48.531000000000006,183.268,37.07200000000001);
		ctx.bezierCurveTo(206.91,33.76400000000001,218.323,22.634000000000007,242.031,19.65300000000001);
		ctx.bezierCurveTo(242.114,30.615,248.222,50.278,253.906,59.713);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(194.367,49.321);
		ctx.bezierCurveTo(193.715,47.602999999999994,193.273,45.793,192.477,44.217);
		ctx.bezierCurveTo(192.078,43.41,191.506,42.842,190.917,42.193);
		ctx.bezierCurveTo(190.331,41.544999999999995,189.641,40.855999999999995,189.229,39.982);
		ctx.lineTo(189.30300000000003,39.916);
		ctx.bezierCurveTo(190.11500000000004,40.407999999999994,190.866,40.86,191.60900000000004,41.471);
		ctx.bezierCurveTo(192.36600000000004,42.065,192.88400000000004,43.01,193.20700000000005,43.88999999999999);
		ctx.bezierCurveTo(193.89500000000004,45.67499999999999,194.08700000000005,47.50399999999999,194.46300000000005,49.294999999999995);
		ctx.lineTo(194.367,49.321);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(198.436,46.348);
		ctx.bezierCurveTo(197.342,44.802,196.597,43.019,195.508,41.574);
		ctx.bezierCurveTo(194.96,40.847,194.274,40.314,193.58200000000002,39.855);
		ctx.bezierCurveTo(192.87900000000002,39.388999999999996,192.04600000000002,39.116,191.10600000000002,38.858999999999995);
		ctx.lineTo(191.104,38.75899999999999);
		ctx.bezierCurveTo(192.038,38.46099999999999,193.11800000000002,38.52799999999999,194.06300000000002,38.97899999999999);
		ctx.bezierCurveTo(195.03000000000003,39.422999999999995,195.66600000000003,40.29999999999999,196.168,41.12299999999999);
		ctx.bezierCurveTo(197.189,42.80199999999999,197.681,44.61799999999999,198.52100000000002,46.29799999999999);
		ctx.lineTo(198.436,46.348);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(203.027,38.297);
		ctx.bezierCurveTo(202.368,38.562,201.725,38.863,201.03199999999998,39.096);
		ctx.bezierCurveTo(200.34499999999997,39.311,199.55599999999998,39.452,198.77599999999998,39.293);
		ctx.bezierCurveTo(198.028,39.15,197.29999999999998,38.954,196.689,38.611);
		ctx.bezierCurveTo(196.069,38.270999999999994,195.50799999999998,37.93,194.864,37.544999999999995);
		ctx.lineTo(194.88,37.44499999999999);
		ctx.bezierCurveTo(195.63899999999998,37.288,196.408,37.46999999999999,197.08599999999998,37.69299999999999);
		ctx.bezierCurveTo(197.77399999999997,37.90999999999999,198.33899999999997,38.31399999999999,198.969,38.51599999999999);
		ctx.bezierCurveTo(199.567,38.73299999999999,200.23399999999998,38.71799999999999,200.918,38.60799999999999);
		ctx.bezierCurveTo(201.60500000000002,38.514999999999986,202.299,38.33799999999999,202.99800000000002,38.20099999999999);
		ctx.lineTo(203.027,38.297);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(196.233,64.618);
		ctx.bezierCurveTo(196.281,65.306,196.377,65.976,196.466,66.66199999999999);
		ctx.bezierCurveTo(196.543,67.339,196.595,68.056,196.612,68.73799999999999);
		ctx.bezierCurveTo(196.641,69.38999999999999,196.827,70.01199999999999,196.923,70.62199999999999);
		ctx.bezierCurveTo(197.02700000000002,71.24299999999998,197.201,71.84499999999998,197.397,72.55099999999999);
		ctx.lineTo(197.31699999999998,72.612);
		ctx.bezierCurveTo(196.67499999999998,72.234,196.22099999999998,71.591,195.96099999999998,70.892);
		ctx.bezierCurveTo(195.68699999999998,70.182,195.753,69.42399999999999,195.815,68.709);
		ctx.bezierCurveTo(195.898,68.023,195.945,67.37,195.968,66.679);
		ctx.bezierCurveTo(196.012,65.996,196.048,65.297,196.135,64.617);
		ctx.lineTo(196.233,64.618);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(201.369,65.294);
		ctx.bezierCurveTo(201.001,66.26299999999999,200.511,67.176,200.108,68.091);
		ctx.bezierCurveTo(199.904,68.55,199.804,69.03999999999999,199.572,69.452);
		ctx.lineTo(198.848,70.76599999999999);
		ctx.lineTo(198.74800000000002,70.76799999999999);
		ctx.bezierCurveTo(198.467,70.23999999999998,198.507,69.62799999999999,198.63500000000002,69.10199999999999);
		ctx.bezierCurveTo(198.76000000000002,68.55899999999998,199.11900000000003,68.13499999999999,199.40800000000002,67.70299999999999);
		ctx.bezierCurveTo(199.991,66.83099999999999,200.66600000000003,66.064,201.28000000000003,65.24499999999999);
		ctx.lineTo(201.369,65.294);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(207.524,68.229);
		ctx.bezierCurveTo(206.867,68.2,206.216,68.261,205.582,68.379);
		ctx.bezierCurveTo(204.947,68.483,204.325,68.64500000000001,203.73999999999998,68.87400000000001);
		ctx.bezierCurveTo(203.14999999999998,69.102,202.64999999999998,69.465,202.13599999999997,69.739);
		ctx.bezierCurveTo(201.61699999999996,70.031,201.14899999999997,70.35900000000001,200.64399999999998,70.846);
		ctx.lineTo(200.55199999999996,70.807);
		ctx.bezierCurveTo(200.55199999999996,70.072,201.00399999999996,69.387,201.55799999999996,68.923);
		ctx.bezierCurveTo(202.11999999999998,68.437,202.84199999999996,68.266,203.50799999999995,68.108);
		ctx.bezierCurveTo(204.85599999999997,67.803,206.24099999999996,67.805,207.53799999999995,68.129);
		ctx.lineTo(207.524,68.229);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(229.979,27.837);
		ctx.bezierCurveTo(230.96300000000002,26.378,232.001,24.928,233.36,23.714);
		ctx.bezierCurveTo(234.03400000000002,23.116,234.763,22.491999999999997,235.67200000000003,22.205);
		ctx.bezierCurveTo(236.56500000000003,21.910999999999998,237.55800000000002,21.845,238.43600000000004,22.157);
		ctx.lineTo(238.43200000000004,22.257);
		ctx.bezierCurveTo(237.55300000000005,22.502000000000002,236.78100000000003,22.765,236.04500000000004,23.133000000000003);
		ctx.bezierCurveTo(235.32200000000003,23.503000000000004,234.55600000000004,23.837000000000003,233.86100000000005,24.338);
		ctx.bezierCurveTo(232.48000000000005,25.338,231.26500000000004,26.621000000000002,230.05700000000004,27.900000000000002);
		ctx.lineTo(229.979,27.837);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(233.794,28.684);
		ctx.bezierCurveTo(234.376,27.815,234.869,26.913,235.371,26.007);
		ctx.bezierCurveTo(235.624,25.554000000000002,235.80200000000002,25.048000000000002,236.15900000000002,24.655);
		ctx.bezierCurveTo(236.51100000000002,24.26,236.907,23.888,237.44500000000002,23.645);
		ctx.lineTo(237.52300000000002,23.707);
		ctx.bezierCurveTo(237.42400000000004,24.284,237.21900000000002,24.758,236.98400000000004,25.221);
		ctx.bezierCurveTo(236.75500000000002,25.685,236.36200000000002,26.046,236.03500000000003,26.454);
		ctx.bezierCurveTo(235.38000000000002,27.27,234.67200000000003,28.069,233.87000000000003,28.751);
		ctx.lineTo(233.794,28.684);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(239.861,32.503);
		ctx.bezierCurveTo(239.38,32.275,239.006,31.801000000000002,238.79899999999998,31.286);
		ctx.bezierCurveTo(238.60099999999997,30.763,238.528,30.208000000000002,238.515,29.66);
		ctx.bezierCurveTo(238.512,29.115,238.488,28.545,238.70899999999997,28.036);
		ctx.bezierCurveTo(238.92399999999998,27.534000000000002,239.22999999999996,27.040000000000003,239.73899999999998,26.728);
		ctx.lineTo(239.825,26.781000000000002);
		ctx.bezierCurveTo(239.804,27.351000000000003,239.743,27.828000000000003,239.67,28.312);
		ctx.bezierCurveTo(239.60899999999998,28.791,239.393,29.236,239.314,29.716);
		ctx.bezierCurveTo(239.231,30.193,239.202,30.68,239.28,31.150000000000002);
		ctx.bezierCurveTo(239.342,31.62,239.529,32.087,239.921,32.422000000000004);
		ctx.lineTo(239.861,32.503);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(245.272,50.264);
		ctx.bezierCurveTo(245.767,51.575,246.469,52.765,247.23399999999998,53.909000000000006);
		ctx.bezierCurveTo(247.617,54.483000000000004,248.09499999999997,54.99300000000001,248.41599999999997,55.608000000000004);
		ctx.bezierCurveTo(248.74299999999997,56.221000000000004,249.05199999999996,56.855000000000004,249.22299999999996,57.587);
		ctx.lineTo(249.14099999999996,57.644000000000005);
		ctx.bezierCurveTo(248.51799999999997,57.226000000000006,248.02999999999997,56.71300000000001,247.58399999999997,56.163000000000004);
		ctx.bezierCurveTo(247.13199999999998,55.61600000000001,246.85899999999998,54.946000000000005,246.54199999999997,54.31100000000001);
		ctx.bezierCurveTo(245.908,53.04200000000001,245.39299999999997,51.68900000000001,245.17699999999996,50.29200000000001);
		ctx.lineTo(245.272,50.264);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(239.667,50.911);
		ctx.bezierCurveTo(240.328,51.486000000000004,240.821,52.261,241.367,52.897);
		ctx.bezierCurveTo(241.896,53.54,242.587,54.039,243.28,54.556);
		ctx.bezierCurveTo(243.984,55.07,244.735,55.604,245.292,56.268);
		ctx.lineTo(246.975,58.233000000000004);
		ctx.lineTo(246.924,58.319);
		ctx.bezierCurveTo(246.023,58.107,245.252,57.544000000000004,244.592,56.982);
		ctx.bezierCurveTo(243.923,56.415,243.41400000000002,55.751,242.76700000000002,55.17);
		ctx.bezierCurveTo(242.13500000000002,54.572,241.46200000000002,53.962,240.96500000000003,53.193000000000005);
		ctx.bezierCurveTo(240.49000000000004,52.42700000000001,240.15700000000004,51.64900000000001,239.59300000000002,50.979000000000006);
		ctx.lineTo(239.667,50.911);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(235.013,56.627);
		ctx.bezierCurveTo(235.791,56.871,236.598,56.898,237.397,56.846000000000004);
		ctx.bezierCurveTo(238.197,56.81100000000001,238.999,56.699000000000005,239.82,56.61300000000001);
		ctx.bezierCurveTo(240.636,56.535000000000004,241.49699999999999,56.39000000000001,242.35899999999998,56.602000000000004);
		ctx.bezierCurveTo(243.22199999999998,56.821000000000005,243.96399999999997,57.194,244.64299999999997,57.731);
		ctx.lineTo(244.60799999999998,57.825);
		ctx.bezierCurveTo(243.75399999999996,57.807,242.94499999999996,57.649,242.19899999999998,57.589000000000006);
		ctx.bezierCurveTo(241.44699999999997,57.543000000000006,240.66699999999997,57.42100000000001,239.855,57.412000000000006);
		ctx.bezierCurveTo(239.046,57.397000000000006,238.219,57.41100000000001,237.387,57.34700000000001);
		ctx.bezierCurveTo(236.559,57.26700000000001,235.716,57.09600000000001,234.978,56.72200000000001);
		ctx.lineTo(235.013,56.627);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.restore();
		ctx.save();
		g=ctx.createRadialGradient(14.056996880000003,42.87634648,0,33.908239519999995,49.441583120000004,30.8536);
		g.addColorStop(0,"#D0C085");
		g.addColorStop(0.1715,"#CFB97F");
		g.addColorStop(0.4647,"#CCA870");
		g.addColorStop(0.8418,"#C78B5A");
		g.addColorStop(1,"#C47F51");
		ctx.fillStyle = g;
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 2;
		ctx.miterLimit = 10;
		ctx.beginPath();
		ctx.moveTo(67.702,65.651);
		ctx.bezierCurveTo(49.525,67.368,35.778999999999996,67.97699999999999,7.222000000000001,75.579);
		ctx.bezierCurveTo(4.022000000000001,64.52499999999999,9.655000000000001,47.05799999999999,0.4540000000000015,34.34799999999999);
		ctx.bezierCurveTo(24.323,34.02499999999999,37.04,24.40999999999999,60.934,24.41999999999999);
		ctx.bezierCurveTo(59.644,35.306,63.243,55.579,67.702,65.651);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(9.932,47.89);
		ctx.bezierCurveTo(9.499,46.104,9.289,44.252,8.696,42.588);
		ctx.bezierCurveTo(8.402,41.738,7.904999999999999,41.103,7.401999999999999,40.385);
		ctx.bezierCurveTo(6.900999999999999,39.668,6.302999999999999,38.899,6.004,37.98);
		ctx.lineTo(6.085999999999999,37.922999999999995);
		ctx.bezierCurveTo(6.829,38.513,7.517999999999999,39.056999999999995,8.177999999999999,39.754);
		ctx.bezierCurveTo(8.854999999999999,40.439,9.251,41.440999999999995,9.460999999999999,42.355);
		ctx.bezierCurveTo(9.919999999999998,44.211,9.880999999999998,46.050999999999995,10.030999999999999,47.875);
		ctx.lineTo(9.932,47.89);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(14.34,45.448);
		ctx.bezierCurveTo(13.448,43.778,12.932,41.915,12.033,40.344);
		ctx.bezierCurveTo(11.58,39.555,10.966,38.94,10.338,38.399);
		ctx.bezierCurveTo(9.697999999999999,37.848,8.905999999999999,37.472,8.006,37.101);
		ctx.lineTo(8.016,37.001);
		ctx.bezierCurveTo(8.98,36.821999999999996,10.043,37.022,10.925,37.589);
		ctx.bezierCurveTo(11.828000000000001,38.150999999999996,12.349,39.101,12.745000000000001,39.98);
		ctx.bezierCurveTo(13.549000000000001,41.772999999999996,13.809000000000001,43.637,14.432,45.409);
		ctx.lineTo(14.34,45.448);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(19.903,38.034);
		ctx.bezierCurveTo(19.215999999999998,38.214999999999996,18.540999999999997,38.434,17.823999999999998,38.577999999999996);
		ctx.bezierCurveTo(17.116,38.705,16.316,38.748,15.560999999999998,38.492);
		ctx.bezierCurveTo(14.836999999999998,38.257,14.139999999999999,37.971,13.575999999999999,37.553999999999995);
		ctx.bezierCurveTo(13.002999999999998,37.13999999999999,12.488999999999999,36.730999999999995,11.898,36.266999999999996);
		ctx.lineTo(11.926,36.171);
		ctx.bezierCurveTo(12.698,36.11,13.439,36.387,14.083,36.692);
		ctx.bezierCurveTo(14.738,36.994,15.249,37.465,15.849,37.745);
		ctx.bezierCurveTo(16.414,38.034,17.078,38.102999999999994,17.771,38.08);
		ctx.bezierCurveTo(18.464000000000002,38.073,19.175,37.984,19.886000000000003,37.934999999999995);
		ctx.lineTo(19.903,38.034);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(9.868,63.299);
		ctx.bezierCurveTo(9.829,63.988,9.84,64.665,9.844000000000001,65.357);
		ctx.bezierCurveTo(9.836000000000002,66.039,9.799000000000001,66.755,9.729000000000001,67.435);
		ctx.bezierCurveTo(9.676,68.086,9.782000000000002,68.726,9.801,69.343);
		ctx.bezierCurveTo(9.827,69.97200000000001,9.925,70.59100000000001,10.029,71.316);
		ctx.lineTo(9.943,71.367);
		ctx.bezierCurveTo(9.353,70.911,8.983,70.217,8.812,69.49000000000001);
		ctx.bezierCurveTo(8.629,68.75200000000001,8.79,68.00900000000001,8.94,67.30600000000001);
		ctx.bezierCurveTo(9.107999999999999,66.63700000000001,9.235999999999999,65.99400000000001,9.346,65.311);
		ctx.bezierCurveTo(9.475,64.63900000000001,9.599,63.95000000000001,9.77,63.28600000000001);
		ctx.lineTo(9.868,63.299);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(14.879,64.612);
		ctx.bezierCurveTo(14.392999999999999,65.52799999999999,13.793,66.37299999999999,13.279,67.22999999999999);
		ctx.bezierCurveTo(13.019,67.66,12.859,68.133,12.576,68.51299999999999);
		ctx.lineTo(11.694,69.72699999999999);
		ctx.lineTo(11.594000000000001,69.71499999999999);
		ctx.bezierCurveTo(11.382000000000001,69.15599999999999,11.497000000000002,68.55499999999999,11.690000000000001,68.04799999999999);
		ctx.bezierCurveTo(11.882000000000001,67.52599999999998,12.292000000000002,67.14999999999999,12.633000000000001,66.75699999999999);
		ctx.bezierCurveTo(13.32,65.96499999999999,14.086,65.288,14.797,64.553);
		ctx.lineTo(14.879,64.612);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(20.619,68.294);
		ctx.bezierCurveTo(19.97,68.184,19.317,68.164,18.673,68.201);
		ctx.bezierCurveTo(18.029999999999998,68.22399999999999,17.392999999999997,68.30799999999999,16.784,68.463);
		ctx.bezierCurveTo(16.169999999999998,68.61399999999999,15.629,68.91199999999999,15.082999999999998,69.11999999999999);
		ctx.bezierCurveTo(14.531999999999998,69.34499999999998,14.025999999999998,69.612,13.463999999999999,70.03099999999999);
		ctx.lineTo(13.376999999999999,69.98199999999999);
		ctx.bezierCurveTo(13.469999999999999,69.25199999999998,14.002999999999998,68.62899999999999,14.610999999999999,68.23899999999999);
		ctx.bezierCurveTo(15.229,67.82699999999998,15.966999999999999,67.74799999999999,16.648,67.675);
		ctx.bezierCurveTo(18.023,67.541,19.397,67.715,20.644,68.198);
		ctx.lineTo(20.619,68.294);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(47.953,31.03);
		ctx.bezierCurveTo(49.113,29.707,50.323,28.398,51.823,27.364);
		ctx.bezierCurveTo(52.566,26.855,53.368,26.328,54.305,26.156000000000002);
		ctx.bezierCurveTo(55.227,25.976000000000003,56.22,26.035000000000004,57.052,26.453000000000003);
		ctx.lineTo(57.036,26.553000000000004);
		ctx.bezierCurveTo(56.133,26.686000000000003,55.334,26.851000000000003,54.558,27.124000000000006);
		ctx.bezierCurveTo(53.795,27.400000000000006,52.992,27.636000000000006,52.241,28.046000000000006);
		ctx.bezierCurveTo(50.745,28.864000000000008,49.379,29.985000000000007,48.021,31.103000000000005);
		ctx.lineTo(47.953,31.03);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(51.632,32.349);
		ctx.bezierCurveTo(52.318,31.558999999999997,52.919999999999995,30.726999999999997,53.532,29.889999999999997);
		ctx.bezierCurveTo(53.839,29.472999999999995,54.07899999999999,28.993999999999996,54.483,28.648999999999997);
		ctx.bezierCurveTo(54.879999999999995,28.301,55.321,27.981999999999996,55.884,27.807);
		ctx.lineTo(55.954,27.877);
		ctx.bezierCurveTo(55.784,28.438,55.522,28.883,55.230000000000004,29.311999999999998);
		ctx.bezierCurveTo(54.94500000000001,29.744999999999997,54.510000000000005,30.051999999999996,54.134,30.416999999999998);
		ctx.bezierCurveTo(53.382,31.144,52.578,31.848,51.698,32.422999999999995);
		ctx.lineTo(51.632,32.349);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(57.173,36.896);
		ctx.bezierCurveTo(56.723,36.611000000000004,56.412,36.092,56.271,35.556);
		ctx.bezierCurveTo(56.14,35.012,56.137,34.452,56.192,33.907999999999994);
		ctx.bezierCurveTo(56.257,33.367,56.304,32.797999999999995,56.588,32.31999999999999);
		ctx.bezierCurveTo(56.863,31.849999999999994,57.230000000000004,31.397999999999993,57.775,31.15299999999999);
		ctx.lineTo(57.853,31.214999999999993);
		ctx.bezierCurveTo(57.76,31.77799999999999,57.641,32.242999999999995,57.507000000000005,32.71399999999999);
		ctx.bezierCurveTo(57.38700000000001,33.181999999999995,57.11600000000001,33.59599999999999,56.977000000000004,34.06399999999999);
		ctx.bezierCurveTo(56.836000000000006,34.525999999999996,56.746,35.004999999999995,56.765,35.480999999999995);
		ctx.bezierCurveTo(56.768,35.955999999999996,56.895,36.44199999999999,57.242,36.824);
		ctx.lineTo(57.173,36.896);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(60.319,55.194);
		ctx.bezierCurveTo(60.645,56.556000000000004,61.194,57.826,61.809000000000005,59.056000000000004);
		ctx.bezierCurveTo(62.117000000000004,59.673,62.528000000000006,60.239000000000004,62.769000000000005,60.89000000000001);
		ctx.bezierCurveTo(63.017,61.53900000000001,63.24400000000001,62.20600000000001,63.321000000000005,62.95300000000001);
		ctx.lineTo(63.232000000000006,63.00000000000001);
		ctx.bezierCurveTo(62.66700000000001,62.507000000000005,62.24700000000001,61.937000000000005,61.873000000000005,61.33500000000001);
		ctx.bezierCurveTo(61.493,60.73500000000001,61.307,60.03600000000001,61.071000000000005,59.367000000000004);
		ctx.bezierCurveTo(60.601000000000006,58.028000000000006,60.25900000000001,56.621,60.21900000000001,55.209);
		ctx.lineTo(60.319,55.194);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(54.676,55.136);
		ctx.bezierCurveTo(55.269000000000005,55.790000000000006,55.647,56.619,56.114000000000004,57.32);
		ctx.bezierCurveTo(56.556000000000004,58.026,57.18300000000001,58.603,57.804,59.206);
		ctx.bezierCurveTo(58.438,59.803000000000004,59.117000000000004,60.428000000000004,59.586,61.156000000000006);
		ctx.lineTo(61.009,63.315000000000005);
		ctx.lineTo(60.948,63.395);
		ctx.bezierCurveTo(60.079,63.072,59.386,62.416000000000004,58.802,61.776);
		ctx.bezierCurveTo(58.209,61.13,57.788,60.407000000000004,57.217999999999996,59.75);
		ctx.bezierCurveTo(56.668,59.077,56.071999999999996,58.39,55.677,57.564);
		ctx.bezierCurveTo(55.301,56.749,55.073,55.921,54.594,55.195);
		ctx.lineTo(54.676,55.136);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(49.343,60.225);
		ctx.bezierCurveTo(50.084,60.564,50.881,60.692,51.68000000000001,60.741);
		ctx.bezierCurveTo(52.47800000000001,60.805,53.288000000000004,60.795,54.11300000000001,60.812);
		ctx.bezierCurveTo(54.93300000000001,60.836,55.80400000000001,60.800999999999995,56.63400000000001,61.119);
		ctx.bezierCurveTo(57.464000000000006,61.444,58.153000000000006,61.908,58.75900000000001,62.524);
		ctx.lineTo(58.71300000000001,62.614000000000004);
		ctx.bezierCurveTo(57.86800000000001,62.489000000000004,57.08400000000001,62.231,56.35200000000001,62.078);
		ctx.bezierCurveTo(55.61200000000001,61.937000000000005,54.85200000000001,61.720000000000006,54.049000000000014,61.609);
		ctx.bezierCurveTo(53.24800000000001,61.493,52.426000000000016,61.404,51.609000000000016,61.235);
		ctx.bezierCurveTo(50.79700000000002,61.052,49.98300000000002,60.777,49.29700000000002,60.313);
		ctx.lineTo(49.343,60.225);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.restore();
		ctx.save();
		g=ctx.createRadialGradient(155.60687880999998,12.6582313,0,173.78069727,22.996849299999997,30.8533);
		g.addColorStop(0,"#D0C085");
		g.addColorStop(0.1715,"#CFB97F");
		g.addColorStop(0.4647,"#CCA870");
		g.addColorStop(0.8418,"#C78B5A");
		g.addColorStop(1,"#C47F51");
		ctx.fillStyle = g;
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 2;
		ctx.miterLimit = 10;
		ctx.beginPath();
		ctx.moveTo(203.725,45.539);
		ctx.bezierCurveTo(185.564,43.649,171.96699999999998,41.546,142.47299999999998,43.385000000000005);
		ctx.bezierCurveTo(141.50799999999998,31.918000000000006,150.464,15.899000000000004,143.94099999999997,1.6280000000000072);
		ctx.bezierCurveTo(167.40899999999996,6.003000000000007,181.76699999999997,-0.9239999999999928,205.19399999999996,3.782000000000007);
		ctx.bezierCurveTo(201.788,14.202,201.332,34.787,203.725,45.539);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(150.573,16.769);
		ctx.bezierCurveTo(150.499,14.932999999999998,150.657,13.075999999999999,150.40200000000002,11.328);
		ctx.bezierCurveTo(150.28,10.437,149.92000000000002,9.716,149.567,8.913);
		ctx.bezierCurveTo(149.216,8.112,148.782,7.24,148.669,6.281000000000001);
		ctx.lineTo(148.76100000000002,6.2410000000000005);
		ctx.bezierCurveTo(149.37300000000002,6.966,149.943,7.634,150.45200000000003,8.448);
		ctx.bezierCurveTo(150.98100000000002,9.251000000000001,151.17300000000003,10.312000000000001,151.19900000000004,11.25);
		ctx.bezierCurveTo(151.28400000000005,13.161,150.88400000000004,14.956,150.67300000000003,16.773);
		ctx.lineTo(150.573,16.769);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(155.375,15.241);
		ctx.bezierCurveTo(154.829,13.429,154.689,11.5,154.116,9.783999999999999);
		ctx.bezierCurveTo(153.82700000000003,8.921,153.34500000000003,8.197,152.836,7.542999999999999);
		ctx.bezierCurveTo(152.317,6.876999999999999,151.614,6.353,150.806,5.811999999999999);
		ctx.lineTo(150.835,5.715999999999999);
		ctx.bezierCurveTo(151.815,5.7299999999999995,152.818,6.135999999999999,153.571,6.863999999999999);
		ctx.bezierCurveTo(154.345,7.591999999999999,154.67,8.626,154.885,9.565);
		ctx.bezierCurveTo(155.322,11.482,155.209,13.36,155.47199999999998,15.219);
		ctx.lineTo(155.375,15.241);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(162.287,9.066);
		ctx.bezierCurveTo(161.577,9.108,160.87300000000002,9.190000000000001,160.14100000000002,9.190000000000001);
		ctx.bezierCurveTo(159.42200000000003,9.175,158.62900000000002,9.06,157.94000000000003,8.661000000000001);
		ctx.bezierCurveTo(157.27600000000004,8.288000000000002,156.64900000000003,7.871000000000001,156.17800000000003,7.351000000000001);
		ctx.bezierCurveTo(155.69800000000004,6.832000000000001,155.27400000000003,6.330000000000001,154.78500000000003,5.760000000000001);
		ctx.lineTo(154.83200000000002,5.671);
		ctx.bezierCurveTo(155.60100000000003,5.763,156.27300000000002,6.180000000000001,156.84500000000003,6.607);
		ctx.bezierCurveTo(157.42800000000003,7.031000000000001,157.83600000000004,7.594,158.36900000000003,7.986000000000001);
		ctx.bezierCurveTo(158.86600000000004,8.381,159.50300000000001,8.579,160.18700000000004,8.692);
		ctx.bezierCurveTo(160.86800000000005,8.822000000000001,161.58300000000003,8.875,162.28900000000004,8.966000000000001);
		ctx.lineTo(162.287,9.066);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(147.481,31.865);
		ctx.bezierCurveTo(147.307,32.533,147.185,33.199,147.052,33.878);
		ctx.bezierCurveTo(146.91,34.544,146.73399999999998,35.24,146.531,35.894);
		ctx.bezierCurveTo(146.351,36.521,146.329,37.17,146.226,37.778999999999996);
		ctx.bezierCurveTo(146.128,38.4,146.102,39.026999999999994,146.062,39.757999999999996);
		ctx.lineTo(145.96800000000002,39.791);
		ctx.bezierCurveTo(145.479,39.227999999999994,145.252,38.474999999999994,145.227,37.729);
		ctx.bezierCurveTo(145.193,36.967999999999996,145.497,36.271,145.782,35.613);
		ctx.bezierCurveTo(146.079,34.99,146.33100000000002,34.384,146.573,33.736);
		ctx.bezierCurveTo(146.83100000000002,33.102999999999994,147.088,32.452,147.386,31.833999999999996);
		ctx.lineTo(147.481,31.865);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(152.137,34.138);
		ctx.bezierCurveTo(151.48,34.94,150.725,35.650999999999996,150.053,36.39);
		ctx.bezierCurveTo(149.713,36.76,149.464,37.194,149.112,37.51);
		ctx.lineTo(148.009,38.528);
		ctx.lineTo(147.91299999999998,38.497);
		ctx.bezierCurveTo(147.814,37.908,148.046,37.341,148.33499999999998,36.882);
		ctx.bezierCurveTo(148.62599999999998,36.407,149.10199999999998,36.119,149.51299999999998,35.800999999999995);
		ctx.bezierCurveTo(150.343,35.15899999999999,151.22699999999998,34.64699999999999,152.069,34.065);
		ctx.lineTo(152.137,34.138);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(157.04,38.877);
		ctx.bezierCurveTo(156.426,38.641000000000005,155.79,38.492000000000004,155.15,38.402);
		ctx.bezierCurveTo(154.51500000000001,38.298,153.874,38.255,153.247,38.287);
		ctx.bezierCurveTo(152.615,38.315,152.026,38.501,151.45000000000002,38.598);
		ctx.bezierCurveTo(150.866,38.71,150.317,38.873,149.68400000000003,39.174);
		ctx.lineTo(149.60800000000003,39.108);
		ctx.bezierCurveTo(149.84200000000004,38.410999999999994,150.48900000000003,37.904999999999994,151.16100000000003,37.641);
		ctx.bezierCurveTo(151.84800000000004,37.359,152.58800000000002,37.425999999999995,153.26900000000003,37.488);
		ctx.bezierCurveTo(154.64400000000003,37.628,155.95700000000002,38.069,157.08400000000003,38.788);
		ctx.lineTo(157.04,38.877);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(191.166,7.712);
		ctx.bezierCurveTo(192.563,6.6419999999999995,194.008,5.5969999999999995,195.682,4.878);
		ctx.bezierCurveTo(196.511,4.525,197.40099999999998,4.166,198.35399999999998,4.182);
		ctx.bezierCurveTo(199.29199999999997,4.187,200.255,4.44,200.98899999999998,5.014);
		ctx.lineTo(200.95399999999998,5.1080000000000005);
		ctx.bezierCurveTo(200.04299999999998,5.0600000000000005,199.22599999999997,5.065,198.41299999999998,5.181000000000001);
		ctx.bezierCurveTo(197.60999999999999,5.302000000000001,196.77599999999998,5.375000000000001,195.95999999999998,5.629000000000001);
		ctx.bezierCurveTo(194.332,6.138000000000002,192.772,6.968000000000002,191.22199999999998,7.7970000000000015);
		ctx.lineTo(191.166,7.712);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(194.513,9.728);
		ctx.bezierCurveTo(195.34900000000002,9.083,196.091,8.393,196.86100000000002,7.6899999999999995);
		ctx.bezierCurveTo(197.24300000000002,7.34,197.57600000000002,6.919,198.037,6.659999999999999);
		ctx.bezierCurveTo(198.497,6.396999999999999,198.99200000000002,6.174999999999999,199.577,6.109999999999999);
		ctx.lineTo(199.632,6.193);
		ctx.bezierCurveTo(199.359,6.712999999999999,199.01,7.093999999999999,198.641,7.457);
		ctx.bezierCurveTo(198.277,7.827,197.78699999999998,8.04,197.34799999999998,8.325);
		ctx.bezierCurveTo(196.904,8.604,196.452,8.876,195.99499999999998,9.138);
		ctx.bezierCurveTo(195.51899999999998,9.388,195.04699999999997,9.608,194.56599999999997,9.814);
		ctx.lineTo(194.513,9.728);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(199.053,15.276);
		ctx.bezierCurveTo(198.668,14.907,198.465,14.338,198.432,13.785);
		ctx.bezierCurveTo(198.411,13.226,198.518,12.677,198.67999999999998,12.153);
		ctx.bezierCurveTo(198.849,11.636000000000001,199.00699999999998,11.087,199.379,10.674);
		ctx.bezierCurveTo(199.74099999999999,10.267,200.19,9.895999999999999,200.772,9.761999999999999);
		ctx.lineTo(200.83599999999998,9.838999999999999);
		ctx.bezierCurveTo(200.635,10.373,200.426,10.804999999999998,200.20299999999997,11.240999999999998);
		ctx.bezierCurveTo(199.99299999999997,11.675999999999998,199.646,12.028999999999998,199.41799999999998,12.458999999999998);
		ctx.bezierCurveTo(199.18899999999996,12.883999999999999,199.00599999999997,13.336999999999998,198.93099999999998,13.806999999999999);
		ctx.bezierCurveTo(198.84099999999998,14.272999999999998,198.86899999999997,14.774999999999999,199.135,15.216999999999999);
		ctx.lineTo(199.053,15.276);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(198.541,33.835);
		ctx.bezierCurveTo(198.594,35.235,198.881,36.587,199.242,37.915);
		ctx.bezierCurveTo(199.423,38.580999999999996,199.715,39.216,199.82299999999998,39.900999999999996);
		ctx.bezierCurveTo(199.938,40.586999999999996,200.02999999999997,41.285999999999994,199.95899999999997,42.034);
		ctx.lineTo(199.86299999999997,42.061);
		ctx.bezierCurveTo(199.40499999999997,41.467,199.10599999999997,40.825,198.85699999999997,40.162);
		ctx.bezierCurveTo(198.60299999999998,39.499,198.55799999999996,38.778,198.45899999999997,38.074999999999996);
		ctx.bezierCurveTo(198.26199999999997,36.67099999999999,198.20299999999997,35.223,198.44099999999997,33.830999999999996);
		ctx.lineTo(198.541,33.835);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(193.02,32.668);
		ctx.bezierCurveTo(193.473,33.428,193.681,34.314,194,35.092999999999996);
		ctx.bezierCurveTo(194.296,35.872,194.797,36.56099999999999,195.287,37.273999999999994);
		ctx.bezierCurveTo(195.792,37.983999999999995,196.335,38.73,196.651,39.535999999999994);
		ctx.lineTo(197.622,41.93299999999999);
		ctx.lineTo(197.548,41.998999999999995);
		ctx.bezierCurveTo(196.76,41.51199999999999,196.208,40.73199999999999,195.761,39.989999999999995);
		ctx.bezierCurveTo(195.30599999999998,39.239,195.036,38.44799999999999,194.606,37.69199999999999);
		ctx.bezierCurveTo(194.2,36.922999999999995,193.749,36.13199999999999,193.525,35.245999999999995);
		ctx.bezierCurveTo(193.316,34.373,193.255,33.516999999999996,192.93,32.711);
		ctx.lineTo(193.02,32.668);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(186.79,36.609);
		ctx.bezierCurveTo(187.45,37.088,188.207,37.370000000000005,188.98,37.574000000000005);
		ctx.bezierCurveTo(189.75099999999998,37.795,190.546,37.943000000000005,191.35199999999998,38.123000000000005);
		ctx.bezierCurveTo(192.15099999999998,38.30800000000001,193.01199999999997,38.444,193.76299999999998,38.919000000000004);
		ctx.bezierCurveTo(194.51299999999998,39.401,195.09699999999998,39.99,195.56999999999996,40.715);
		ctx.lineTo(195.50799999999995,40.793000000000006);
		ctx.bezierCurveTo(194.70399999999995,40.50500000000001,193.98599999999996,40.098000000000006,193.29799999999994,39.80400000000001);
		ctx.bezierCurveTo(192.60099999999994,39.52100000000001,191.89899999999994,39.15800000000001,191.13199999999995,38.89200000000001);
		ctx.bezierCurveTo(190.36999999999995,38.62100000000001,189.58099999999996,38.37100000000001,188.81299999999996,38.046000000000014);
		ctx.bezierCurveTo(188.05299999999997,37.707000000000015,187.30899999999997,37.27600000000001,186.72799999999995,36.68800000000002);
		ctx.lineTo(186.79,36.609);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.restore();
		ctx.save();
		g=ctx.createRadialGradient(86.51484255999999,16.34143113,0,105.48625159999999,25.12942103,30.8537);
		g.addColorStop(0,"#D0C085");
		g.addColorStop(0.1715,"#CFB97F");
		g.addColorStop(0.4647,"#CCA870");
		g.addColorStop(0.8418,"#C78B5A");
		g.addColorStop(1,"#C47F51");
		ctx.fillStyle = g;
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 2;
		ctx.miterLimit = 10;
		ctx.beginPath();
		ctx.moveTo(137.213,45.085);
		ctx.bezierCurveTo(118.958,44.716,105.23299999999999,43.754,75.99499999999999,48.048);
		ctx.bezierCurveTo(74.07699999999998,36.701,81.66499999999999,19.990000000000002,73.975,6.313000000000002);
		ctx.bezierCurveTo(97.725,8.715000000000003,111.45599999999999,0.6140000000000025,135.19299999999998,3.3500000000000023);
		ctx.bezierCurveTo(132.67,14.018,133.933,34.569,137.213,45.085);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(81.847,20.847);
		ctx.bezierCurveTo(81.61999999999999,19.024,81.62299999999999,17.16,81.223,15.439);
		ctx.bezierCurveTo(81.027,14.562,80.606,13.874,80.189,13.102);
		ctx.bezierCurveTo(79.773,12.333,79.267,11.501000000000001,79.074,10.554);
		ctx.lineTo(79.16199999999999,10.506);
		ctx.bezierCurveTo(79.833,11.177,80.455,11.796,81.032,12.564);
		ctx.bezierCurveTo(81.62599999999999,13.321,81.90599999999999,14.362,82.00999999999999,15.293);
		ctx.bezierCurveTo(82.25399999999999,17.189999999999998,82.00599999999999,19.012999999999998,81.94699999999999,20.842);
		ctx.lineTo(81.847,20.847);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(86.504,18.925);
		ctx.bezierCurveTo(85.80900000000001,17.164,85.50800000000001,15.255,84.79400000000001,13.592);
		ctx.bezierCurveTo(84.43400000000001,12.756,83.894,12.075000000000001,83.33200000000001,11.466000000000001);
		ctx.bezierCurveTo(82.75900000000001,10.846000000000002,82.01500000000001,10.383000000000001,81.164,9.911000000000001);
		ctx.lineTo(81.185,9.813);
		ctx.bezierCurveTo(82.163,9.745000000000001,83.196,10.066,84.007,10.729000000000001);
		ctx.bezierCurveTo(84.84,11.39,85.24900000000001,12.394000000000002,85.543,13.312000000000001);
		ctx.bezierCurveTo(86.137,15.185,86.182,17.066000000000003,86.599,18.897000000000002);
		ctx.lineTo(86.504,18.925);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(92.877,12.195);
		ctx.bezierCurveTo(92.173,12.296000000000001,91.478,12.436,90.749,12.497);
		ctx.bezierCurveTo(90.03099999999999,12.542,89.231,12.494,88.50999999999999,12.153);
		ctx.bezierCurveTo(87.818,11.837,87.15799999999999,11.473,86.645,10.995000000000001);
		ctx.bezierCurveTo(86.12299999999999,10.517000000000001,85.65899999999999,10.053,85.125,9.525);
		ctx.lineTo(85.164,9.433);
		ctx.bezierCurveTo(85.938,9.459999999999999,86.643,9.82,87.248,10.197);
		ctx.bezierCurveTo(87.864,10.572,88.318,11.097999999999999,88.881,11.444999999999999);
		ctx.bezierCurveTo(89.409,11.796999999999999,90.062,11.940999999999999,90.753,11.996999999999998);
		ctx.bezierCurveTo(91.442,12.069999999999999,92.159,12.062999999999999,92.871,12.094999999999999);
		ctx.lineTo(92.877,12.195);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(80.025,36.148);
		ctx.bezierCurveTo(79.90700000000001,36.829,79.84100000000001,37.502,79.766,38.189);
		ctx.bezierCurveTo(79.68,38.866,79.56200000000001,39.574,79.415,40.242);
		ctx.bezierCurveTo(79.28800000000001,40.882999999999996,79.32000000000001,41.531,79.269,42.146);
		ctx.bezierCurveTo(79.223,42.773,79.24900000000001,43.4,79.271,44.131);
		ctx.lineTo(79.179,44.172);
		ctx.bezierCurveTo(78.645,43.650999999999996,78.35600000000001,42.919999999999995,78.269,42.178);
		ctx.bezierCurveTo(78.171,41.422999999999995,78.41600000000001,40.702,78.646,40.022999999999996);
		ctx.bezierCurveTo(78.889,39.376999999999995,79.09,38.75299999999999,79.276,38.086999999999996);
		ctx.bezierCurveTo(79.481,37.434,79.68299999999999,36.763,79.928,36.12199999999999);
		ctx.lineTo(80.025,36.148);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(84.854,38.026);
		ctx.bezierCurveTo(84.267,38.88,83.574,39.650000000000006,82.966,40.443000000000005);
		ctx.bezierCurveTo(82.65799999999999,40.84,82.445,41.293000000000006,82.121,41.638000000000005);
		ctx.lineTo(81.106,42.742000000000004);
		ctx.lineTo(81.008,42.719);
		ctx.bezierCurveTo(80.86099999999999,42.14,81.044,41.556000000000004,81.294,41.074);
		ctx.bezierCurveTo(81.545,40.577,81.99499999999999,40.251,82.378,39.899);
		ctx.bezierCurveTo(83.151,39.191,83.988,38.606,84.779,37.957);
		ctx.lineTo(84.854,38.026);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(90.136,42.339);
		ctx.bezierCurveTo(89.50399999999999,42.153999999999996,88.857,42.061,88.213,42.025);
		ctx.bezierCurveTo(87.57199999999999,41.974,86.92899999999999,41.985,86.30699999999999,42.068999999999996);
		ctx.bezierCurveTo(85.67899999999999,42.148999999999994,85.10799999999999,42.382999999999996,84.54199999999999,42.528);
		ctx.bezierCurveTo(83.969,42.687999999999995,83.43599999999999,42.896,82.82999999999998,43.248999999999995);
		ctx.lineTo(82.74999999999999,43.19);
		ctx.bezierCurveTo(82.92499999999998,42.474999999999994,83.52599999999998,41.918,84.17399999999999,41.598);
		ctx.bezierCurveTo(84.835,41.26,85.577,41.265,86.26199999999999,41.269999999999996);
		ctx.bezierCurveTo(87.64299999999999,41.294,88.98899999999999,41.623999999999995,90.17199999999998,42.245999999999995);
		ctx.lineTo(90.136,42.339);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(121.543,8.437);
		ctx.bezierCurveTo(122.846,7.254,124.19800000000001,6.091999999999999,125.805,5.235999999999999);
		ctx.bezierCurveTo(126.602,4.814999999999999,127.45800000000001,4.381999999999999,128.40900000000002,4.318999999999999);
		ctx.bezierCurveTo(129.34600000000003,4.244999999999999,130.32500000000002,4.416999999999999,131.104,4.926999999999999);
		ctx.lineTo(131.07700000000003,5.023999999999999);
		ctx.bezierCurveTo(130.16500000000002,5.051999999999999,129.35200000000003,5.1259999999999994,128.55100000000002,5.308999999999999);
		ctx.bezierCurveTo(127.76100000000001,5.496999999999999,126.93700000000001,5.638999999999999,126.14400000000002,5.959999999999999);
		ctx.bezierCurveTo(124.56500000000003,6.602999999999999,123.08000000000001,7.560999999999999,121.60300000000002,8.515999999999998);
		ctx.lineTo(121.543,8.437);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(125.047,10.165);
		ctx.bezierCurveTo(125.818,9.457999999999998,126.511,8.700999999999999,127.215,7.938999999999999);
		ctx.bezierCurveTo(127.568,7.559999999999999,127.861,7.109999999999999,128.30100000000002,6.813999999999999);
		ctx.bezierCurveTo(128.73600000000002,6.513999999999999,129.21,6.246999999999999,129.78900000000002,6.137999999999999);
		ctx.lineTo(129.85100000000003,6.215999999999999);
		ctx.bezierCurveTo(129.61800000000002,6.752999999999999,129.30600000000004,7.164999999999999,128.96800000000002,7.558);
		ctx.bezierCurveTo(128.63500000000002,7.955,128.168,8.211,127.75200000000002,8.531);
		ctx.bezierCurveTo(126.92300000000003,9.167,126.04400000000003,9.776,125.10500000000002,10.247);
		ctx.lineTo(125.047,10.165);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(130.033,15.316);
		ctx.bezierCurveTo(129.619,14.981,129.368,14.431000000000001,129.289,13.881);
		ctx.bezierCurveTo(129.22199999999998,13.326,129.28199999999998,12.769,129.39999999999998,12.234);
		ctx.bezierCurveTo(129.52599999999998,11.704,129.63699999999997,11.144,129.974,10.702);
		ctx.bezierCurveTo(130.301,10.266,130.71699999999998,9.859,131.286,9.677);
		ctx.lineTo(131.356,9.748);
		ctx.bezierCurveTo(131.2,10.296999999999999,131.028,10.745,130.841,11.197999999999999);
		ctx.bezierCurveTo(130.669,11.649,130.353,12.03,130.161,12.477999999999998);
		ctx.bezierCurveTo(129.968,12.919999999999998,129.823,13.386999999999999,129.788,13.861999999999998);
		ctx.bezierCurveTo(129.73700000000002,14.333999999999998,129.80800000000002,14.831999999999999,130.108,15.249999999999998);
		ctx.lineTo(130.033,15.316);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(131.07,33.854);
		ctx.bezierCurveTo(131.239,35.245,131.63899999999998,36.568,132.10999999999999,37.861);
		ctx.bezierCurveTo(132.345,38.509,132.689,39.117999999999995,132.85399999999998,39.793);
		ctx.bezierCurveTo(133.02599999999998,40.466,133.17499999999998,41.155,133.16699999999997,41.906);
		ctx.lineTo(133.07299999999998,41.940999999999995);
		ctx.bezierCurveTo(132.56699999999998,41.38699999999999,132.21599999999998,40.772999999999996,131.91299999999998,40.132);
		ctx.bezierCurveTo(131.60399999999998,39.492,131.499,38.778,131.34199999999998,38.086);
		ctx.bezierCurveTo(131.028,36.702,130.849,35.265,130.96999999999997,33.857);
		ctx.lineTo(131.07,33.854);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(125.471,33.151);
		ctx.bezierCurveTo(125.986,33.869,126.268,34.736000000000004,126.652,35.48500000000001);
		ctx.bezierCurveTo(127.01,36.23700000000001,127.568,36.88100000000001,128.116,37.55100000000001);
		ctx.bezierCurveTo(128.67800000000003,38.21600000000001,129.281,38.91400000000001,129.66400000000002,39.69200000000001);
		ctx.lineTo(130.831,42);
		ctx.lineTo(130.76299999999998,42.072);
		ctx.bezierCurveTo(129.93699999999998,41.652,129.32299999999998,40.922000000000004,128.81399999999996,40.219);
		ctx.bezierCurveTo(128.29799999999997,39.508,127.96299999999997,38.741,127.47099999999996,38.025);
		ctx.bezierCurveTo(127.00199999999997,37.294,126.48699999999997,36.543,126.18999999999996,35.677);
		ctx.bezierCurveTo(125.90999999999995,34.823,125.77699999999996,33.976,125.38499999999995,33.199);
		ctx.lineTo(125.471,33.151);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(119.593,37.599);
		ctx.bezierCurveTo(120.291,38.020999999999994,121.068,38.239,121.85600000000001,38.376999999999995);
		ctx.bezierCurveTo(122.64200000000001,38.532999999999994,123.447,38.614,124.266,38.72599999999999);
		ctx.bezierCurveTo(125.078,38.843999999999994,125.94800000000001,38.90899999999999,126.735,39.31899999999999);
		ctx.bezierCurveTo(127.519,39.73599999999999,128.156,40.27499999999999,128.685,40.95899999999999);
		ctx.lineTo(128.62800000000001,41.04299999999999);
		ctx.bezierCurveTo(127.80400000000002,40.818999999999996,127.05700000000002,40.477999999999994,126.34400000000001,40.239999999999995);
		ctx.bezierCurveTo(125.62500000000001,40.016,124.89600000000002,39.711999999999996,124.11000000000001,39.510999999999996);
		ctx.bezierCurveTo(123.32800000000002,39.303999999999995,122.52100000000002,39.120999999999995,121.72900000000001,38.861);
		ctx.bezierCurveTo(120.94400000000002,38.587999999999994,120.16600000000001,38.22,119.537,37.681);
		ctx.lineTo(119.593,37.599);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.restore();
		ctx.save();
		g=ctx.createRadialGradient(135.58668268,20.946129040000002,0,152.69990268,32.959763679999995,30.8533);
		g.addColorStop(0,"#D0C085");
		g.addColorStop(0.1715,"#CFB97F");
		g.addColorStop(0.4647,"#CCA870");
		g.addColorStop(0.8418,"#C78B5A");
		g.addColorStop(1,"#C47F51");
		ctx.fillStyle = g;
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 2;
		ctx.miterLimit = 10;
		ctx.beginPath();
		ctx.moveTo(180.376,58.228);
		ctx.bezierCurveTo(162.476,54.628,149.138,51.247,119.60300000000001,50.286);
		ctx.bezierCurveTo(119.72800000000001,38.779,130.161,23.68,125.01800000000001,8.855000000000004);
		ctx.bezierCurveTo(147.966,15.432000000000004,162.91600000000003,9.895000000000003,185.79100000000003,16.798000000000002);
		ctx.bezierCurveTo(181.415,26.848,179.012,47.298,180.376,58.228);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(130.186,24.555);
		ctx.bezierCurveTo(130.287,22.721,130.621,20.887,130.532,19.122999999999998);
		ctx.bezierCurveTo(130.495,18.224999999999998,130.204,17.471999999999998,129.929,16.639999999999997);
		ctx.bezierCurveTo(129.657,15.808999999999997,129.306,14.899999999999997,129.28300000000002,13.933999999999997);
		ctx.lineTo(129.37900000000002,13.902999999999997);
		ctx.bezierCurveTo(129.92000000000002,14.681999999999997,130.42300000000003,15.401999999999997,130.854,16.259999999999998);
		ctx.bezierCurveTo(131.305,17.110999999999997,131.394,18.183,131.33200000000002,19.119);
		ctx.bezierCurveTo(131.23700000000002,21.03,130.669,22.779,130.28600000000003,24.567999999999998);
		ctx.lineTo(130.186,24.555);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(135.111,23.489);
		ctx.bezierCurveTo(134.73899999999998,21.633,134.78199999999998,19.7,134.375,17.937);
		ctx.bezierCurveTo(134.169,17.051000000000002,133.758,16.285,133.313,15.585);
		ctx.bezierCurveTo(132.85899999999998,14.873000000000001,132.20899999999997,14.285,131.45499999999998,13.670000000000002);
		ctx.lineTo(131.49399999999997,13.577000000000002);
		ctx.bezierCurveTo(132.46799999999996,13.684000000000001,133.42899999999997,14.182000000000002,134.10899999999998,14.979000000000001);
		ctx.bezierCurveTo(134.81199999999998,15.777000000000001,135.03699999999998,16.837,135.16299999999998,17.793);
		ctx.bezierCurveTo(135.415,19.742,135.12599999999998,21.602,135.212,23.477999999999998);
		ctx.lineTo(135.111,23.489);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(142.577,17.997);
		ctx.bezierCurveTo(141.867,17.971,141.157,17.986,140.429,17.917);
		ctx.bezierCurveTo(139.715,17.834000000000003,138.937,17.644000000000002,138.287,17.182000000000002);
		ctx.bezierCurveTo(137.662,16.748,137.077,16.273000000000003,136.657,15.712000000000002);
		ctx.bezierCurveTo(136.228,15.150000000000002,135.853,14.610000000000001,135.422,13.996000000000002);
		ctx.lineTo(135.477,13.912000000000003);
		ctx.bezierCurveTo(136.234,14.077000000000002,136.864,14.556000000000003,137.392,15.034000000000002);
		ctx.bezierCurveTo(137.932,15.512000000000002,138.286,16.110000000000003,138.779,16.551000000000002);
		ctx.bezierCurveTo(139.237,16.991000000000003,139.853,17.249000000000002,140.523,17.426000000000002);
		ctx.bezierCurveTo(141.188,17.619000000000003,141.895,17.739,142.589,17.898000000000003);
		ctx.lineTo(142.577,17.997);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(125.68,39.29);
		ctx.bezierCurveTo(125.444,39.939,125.26,40.591,125.063,41.254);
		ctx.bezierCurveTo(124.85900000000001,41.903,124.616,42.58,124.354,43.211);
		ctx.bezierCurveTo(124.115,43.818999999999996,124.032,44.463,123.872,45.059);
		ctx.bezierCurveTo(123.716,45.669,123.63,46.288999999999994,123.521,47.013999999999996);
		ctx.lineTo(123.424,47.037);
		ctx.bezierCurveTo(122.99000000000001,46.431,122.83600000000001,45.659,122.882,44.914);
		ctx.bezierCurveTo(122.92,44.153,123.28800000000001,43.488,123.634,42.859);
		ctx.bezierCurveTo(123.988,42.267,124.297,41.688,124.598,41.066);
		ctx.bezierCurveTo(124.91499999999999,40.46,125.233,39.836000000000006,125.588,39.249);
		ctx.lineTo(125.68,39.29);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(130.099,41.994);
		ctx.bezierCurveTo(129.36999999999998,42.73,128.551,43.366,127.81199999999998,44.039);
		ctx.bezierCurveTo(127.43899999999998,44.375,127.14899999999999,44.783,126.76799999999999,45.065000000000005);
		ctx.lineTo(125.57399999999998,45.97200000000001);
		ctx.lineTo(125.48199999999999,45.93300000000001);
		ctx.bezierCurveTo(125.43999999999998,45.336000000000006,125.72399999999999,44.793000000000006,126.05399999999999,44.36500000000001);
		ctx.bezierCurveTo(126.38999999999999,43.92000000000001,126.88999999999999,43.67800000000001,127.32999999999998,43.400000000000006);
		ctx.bezierCurveTo(128.21599999999998,42.839000000000006,129.14399999999998,42.413000000000004,130.03799999999998,41.91400000000001);
		ctx.lineTo(130.099,41.994);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(134.531,47.177);
		ctx.bezierCurveTo(133.942,46.883,133.322,46.675,132.695,46.525999999999996);
		ctx.bezierCurveTo(132.07299999999998,46.361999999999995,131.438,46.257999999999996,130.811,46.230999999999995);
		ctx.bezierCurveTo(130.179,46.199,129.576,46.327999999999996,128.994,46.37);
		ctx.bezierCurveTo(128.401,46.427,127.84,46.537,127.181,46.775999999999996);
		ctx.lineTo(127.113,46.70399999999999);
		ctx.bezierCurveTo(127.412,46.032,128.102,45.58899999999999,128.797,45.39099999999999);
		ctx.bezierCurveTo(129.508,45.17399999999999,130.237,45.31199999999999,130.91,45.43799999999999);
		ctx.bezierCurveTo(132.265,45.70699999999999,133.531,46.26999999999999,134.585,47.091999999999985);
		ctx.lineTo(134.531,47.177);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(171.455,19.382);
		ctx.bezierCurveTo(172.94600000000003,18.449,174.483,17.546000000000003,176.21800000000002,16.988);
		ctx.bezierCurveTo(177.07600000000002,16.715,177.996,16.441,178.94400000000002,16.548);
		ctx.bezierCurveTo(179.87900000000002,16.642,180.812,16.985,181.48800000000003,17.625999999999998);
		ctx.lineTo(181.44500000000002,17.715999999999998);
		ctx.bezierCurveTo(180.54200000000003,17.581999999999997,179.729,17.509999999999998,178.90800000000002,17.548);
		ctx.bezierCurveTo(178.097,17.592,177.26100000000002,17.586,176.424,17.761999999999997);
		ctx.bezierCurveTo(174.756,18.115,173.124,18.793999999999997,171.501,19.470999999999997);
		ctx.lineTo(171.455,19.382);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(174.597,21.706);
		ctx.bezierCurveTo(175.49,21.143,176.293,20.526,177.125,19.899);
		ctx.bezierCurveTo(177.539,19.587,177.91,19.199,178.394,18.984);
		ctx.bezierCurveTo(178.876,18.766000000000002,179.39100000000002,18.591,179.979,18.583000000000002);
		ctx.lineTo(180.026,18.671000000000003);
		ctx.bezierCurveTo(179.704,19.162000000000003,179.321,19.509000000000004,178.92000000000002,19.836000000000002);
		ctx.bezierCurveTo(178.52300000000002,20.17,178.01500000000001,20.336000000000002,177.55100000000002,20.577);
		ctx.bezierCurveTo(177.08200000000002,20.812,176.608,21.040000000000003,176.127,21.259);
		ctx.bezierCurveTo(175.63,21.462,175.139,21.636,174.64100000000002,21.796);
		ctx.lineTo(174.597,21.706);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(178.59,27.659);
		ctx.bezierCurveTo(178.242,27.255,178.094,26.669999999999998,178.113,26.115);
		ctx.bezierCurveTo(178.144,25.555999999999997,178.302,25.019,178.513,24.514);
		ctx.bezierCurveTo(178.731,24.015,178.941,23.483999999999998,179.35,23.108);
		ctx.bezierCurveTo(179.749,22.737000000000002,180.231,22.41,180.823,22.332);
		ctx.lineTo(180.88,22.415);
		ctx.bezierCurveTo(180.629,22.928,180.38,23.337,180.11599999999999,23.750999999999998);
		ctx.bezierCurveTo(179.86599999999999,24.163999999999998,179.488,24.482,179.22,24.889999999999997);
		ctx.bezierCurveTo(178.951,25.290999999999997,178.727,25.724999999999998,178.608,26.185999999999996);
		ctx.bezierCurveTo(178.47400000000002,26.640999999999995,178.455,27.142999999999997,178.67600000000002,27.607999999999997);
		ctx.lineTo(178.59,27.659);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(176.323,46.086);
		ctx.bezierCurveTo(176.24200000000002,47.484,176.401,48.857,176.63500000000002,50.214);
		ctx.bezierCurveTo(176.752,50.894,176.98300000000003,51.553,177.026,52.245999999999995);
		ctx.bezierCurveTo(177.07600000000002,52.93899999999999,177.101,53.642999999999994,176.96,54.382);
		ctx.lineTo(176.862,54.4);
		ctx.bezierCurveTo(176.462,53.766,176.225,53.098,176.041,52.415);
		ctx.bezierCurveTo(175.851,51.731,175.873,51.009,175.841,50.3);
		ctx.bezierCurveTo(175.77800000000002,48.882999999999996,175.856,47.437,176.225,46.07299999999999);
		ctx.lineTo(176.323,46.086);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(170.937,44.401);
		ctx.bezierCurveTo(171.317,45.199000000000005,171.44,46.102000000000004,171.68400000000003,46.907000000000004);
		ctx.bezierCurveTo(171.90500000000003,47.711000000000006,172.33800000000002,48.445,172.75900000000001,49.201);
		ctx.bezierCurveTo(173.19500000000002,49.955,173.663,50.749,173.90300000000002,51.582);
		ctx.lineTo(174.64200000000002,54.061);
		ctx.lineTo(174.562,54.12);
		ctx.bezierCurveTo(173.823,53.559999999999995,173.348,52.732,172.973,51.951);
		ctx.bezierCurveTo(172.591,51.160000000000004,172.39800000000002,50.347,172.04000000000002,49.554);
		ctx.bezierCurveTo(171.70800000000003,48.75,171.336,47.92,171.19500000000002,47.016000000000005);
		ctx.bezierCurveTo(171.07000000000002,46.127,171.091,45.269000000000005,170.842,44.43600000000001);
		ctx.lineTo(170.937,44.401);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(164.362,47.735);
		ctx.bezierCurveTo(165.61599999999999,48.797,167.208,49.15,168.761,49.673);
		ctx.bezierCurveTo(169.53799999999998,49.934000000000005,170.382,50.155,171.085,50.694);
		ctx.bezierCurveTo(171.785,51.245000000000005,172.312,51.886,172.714,52.652);
		ctx.lineTo(172.644,52.724000000000004);
		ctx.bezierCurveTo(171.872,52.361000000000004,171.195,51.888000000000005,170.53900000000002,51.531000000000006);
		ctx.bezierCurveTo(169.86800000000002,51.18500000000001,169.20600000000002,50.755,168.46900000000002,50.41700000000001);
		ctx.bezierCurveTo(167.73600000000002,50.07600000000001,166.97500000000002,49.75000000000001,166.241,49.35500000000001);
		ctx.bezierCurveTo(165.52,48.95000000000001,164.81400000000002,48.43500000000001,164.294,47.80600000000001);
		ctx.lineTo(164.362,47.735);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.restore();
		ctx.save();
		g=ctx.createRadialGradient(180.88963658,28.83516874,0,200.31953818000002,36.55796682,30.8539);
		g.addColorStop(0,"#D0C085");
		g.addColorStop(0.1715,"#CFB97F");
		g.addColorStop(0.4647,"#CCA870");
		g.addColorStop(0.8418,"#C78B5A");
		g.addColorStop(1,"#C47F51");
		ctx.fillStyle = g;
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 2;
		ctx.miterLimit = 10;
		ctx.beginPath();
		ctx.moveTo(233.104,54.735);
		ctx.bezierCurveTo(214.85700000000003,55.379,201.09900000000002,55.177,172.14300000000003,61.084);
		ctx.bezierCurveTo(169.60000000000002,49.861000000000004,176.25200000000004,32.756,167.81600000000003,19.525000000000006);
		ctx.bezierCurveTo(191.66300000000004,20.608000000000004,204.92400000000004,11.760000000000005,228.77600000000004,13.177000000000007);
		ctx.bezierCurveTo(226.847,23.968,229.245,44.419,233.104,54.735);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(176.479,33.602);
		ctx.bezierCurveTo(176.15300000000002,31.792999999999996,176.05100000000002,29.932999999999996,175.55700000000002,28.236999999999995);
		ctx.bezierCurveTo(175.31300000000002,27.371999999999996,174.85600000000002,26.707999999999995,174.39600000000002,25.961999999999996);
		ctx.bezierCurveTo(173.93800000000002,25.216999999999995,173.38600000000002,24.413999999999994,173.14100000000002,23.479999999999997);
		ctx.lineTo(173.22700000000003,23.426999999999996);
		ctx.bezierCurveTo(173.93400000000003,24.059999999999995,174.58900000000003,24.642999999999997,175.20700000000002,25.377999999999997);
		ctx.bezierCurveTo(175.84300000000002,26.100999999999996,176.17900000000003,27.124999999999996,176.33400000000003,28.049999999999997);
		ctx.bezierCurveTo(176.68400000000003,29.929999999999996,176.53700000000003,31.763999999999996,176.57800000000003,33.592999999999996);
		ctx.lineTo(176.479,33.602);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(181.024,31.424);
		ctx.bezierCurveTo(180.233,29.704,179.827,27.814999999999998,179.022,26.194);
		ctx.bezierCurveTo(178.61599999999999,25.38,178.039,24.73,177.444,24.152);
		ctx.bezierCurveTo(176.838,23.565,176.069,23.143,175.19299999999998,22.719);
		ctx.lineTo(175.20899999999997,22.62);
		ctx.bezierCurveTo(176.182,22.498,177.23099999999997,22.761,178.07799999999997,23.378);
		ctx.bezierCurveTo(178.94599999999997,23.992,179.41099999999997,24.971,179.75499999999997,25.872);
		ctx.bezierCurveTo(180.45099999999996,27.709,180.60099999999997,29.585,181.11799999999997,31.391);
		ctx.lineTo(181.024,31.424);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(187.015,24.352);
		ctx.bezierCurveTo(186.31799999999998,24.491,185.631,24.67,184.90699999999998,24.771);
		ctx.bezierCurveTo(184.19299999999998,24.856,183.391,24.851,182.653,24.552);
		ctx.bezierCurveTo(181.944,24.275,181.265,23.948,180.727,23.499);
		ctx.bezierCurveTo(180.179,23.051,179.691,22.613,179.12800000000001,22.115);
		ctx.lineTo(179.161,22.020999999999997);
		ctx.bezierCurveTo(179.935,22.005,180.659,22.325999999999997,181.284,22.668999999999997);
		ctx.bezierCurveTo(181.92,23.007999999999996,182.402,23.508999999999997,182.98399999999998,23.823999999999998);
		ctx.bezierCurveTo(183.53199999999998,24.145999999999997,184.18999999999997,24.253999999999998,184.88299999999998,24.272);
		ctx.bezierCurveTo(185.57399999999998,24.305999999999997,186.29,24.258999999999997,187.00199999999998,24.252);
		ctx.lineTo(187.015,24.352);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(175.509,48.98);
		ctx.bezierCurveTo(175.42899999999997,49.666,175.40099999999998,50.342,175.363,51.032999999999994);
		ctx.bezierCurveTo(175.315,51.712999999999994,175.236,52.42699999999999,175.127,53.10099999999999);
		ctx.bezierCurveTo(175.035,53.74699999999999,175.104,54.392999999999994,175.086,55.00999999999999);
		ctx.bezierCurveTo(175.07500000000002,55.63899999999999,175.13600000000002,56.26299999999999,175.198,56.99199999999999);
		ctx.lineTo(175.108,57.03699999999999);
		ctx.bezierCurveTo(174.546,56.547999999999995,174.217,55.83299999999999,174.089,55.09799999999999);
		ctx.bezierCurveTo(173.949,54.34899999999999,174.154,53.61699999999999,174.346,52.92499999999999);
		ctx.bezierCurveTo(174.553,52.26699999999999,174.719,51.63299999999999,174.868,50.956999999999994);
		ctx.bezierCurveTo(175.036,50.294,175.2,49.61299999999999,175.41,48.959999999999994);
		ctx.lineTo(175.509,48.98);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(180.434,50.587);
		ctx.bezierCurveTo(179.895,51.473000000000006,179.246,52.281000000000006,178.682,53.107000000000006);
		ctx.bezierCurveTo(178.398,53.52100000000001,178.20999999999998,53.98400000000001,177.90599999999998,54.34700000000001);
		ctx.lineTo(176.95299999999997,55.50600000000001);
		ctx.lineTo(176.85499999999996,55.48800000000001);
		ctx.bezierCurveTo(176.67499999999995,54.918000000000006,176.82699999999997,54.324000000000005,177.04899999999995,53.830000000000005);
		ctx.bezierCurveTo(177.27199999999996,53.32000000000001,177.70199999999994,52.96900000000001,178.06599999999995,52.59700000000001);
		ctx.bezierCurveTo(178.79799999999994,51.84700000000001,179.60299999999995,51.217000000000006,180.35599999999994,50.525000000000006);
		ctx.lineTo(180.434,50.587);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(185.946,54.602);
		ctx.bezierCurveTo(185.305,54.452999999999996,184.654,54.394999999999996,184.008,54.394);
		ctx.bezierCurveTo(183.365,54.379,182.72400000000002,54.425,182.108,54.543);
		ctx.bezierCurveTo(181.485,54.658,180.928,54.924,180.372,55.1);
		ctx.bezierCurveTo(179.80800000000002,55.291000000000004,179.288,55.529,178.70200000000003,55.914);
		ctx.lineTo(178.61800000000002,55.859);
		ctx.bezierCurveTo(178.75400000000002,55.135000000000005,179.32300000000004,54.546,179.95300000000003,54.191);
		ctx.bezierCurveTo(180.59400000000002,53.817,181.33600000000004,53.781000000000006,182.01900000000003,53.748000000000005);
		ctx.bezierCurveTo(183.40000000000003,53.69500000000001,184.76100000000002,53.95100000000001,185.97700000000003,54.50600000000001);
		ctx.lineTo(185.946,54.602);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(215.429,19.012);
		ctx.bezierCurveTo(216.66400000000002,17.759,217.95,16.524,219.508,15.58);
		ctx.bezierCurveTo(220.28,15.116,221.11200000000002,14.636,222.05800000000002,14.52);
		ctx.bezierCurveTo(222.98900000000003,14.395,223.97700000000003,14.512,224.78300000000002,14.979);
		ctx.lineTo(224.76200000000003,15.077);
		ctx.bezierCurveTo(223.85300000000004,15.156,223.04500000000002,15.274,222.25500000000002,15.501);
		ctx.bezierCurveTo(221.47700000000003,15.732,220.66100000000003,15.918999999999999,219.88700000000003,16.285);
		ctx.bezierCurveTo(218.34600000000003,17.014,216.91600000000003,18.053,215.49400000000003,19.089);
		ctx.lineTo(215.429,19.012);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(219.022,20.544);
		ctx.bezierCurveTo(219.753,19.795,220.403,19.001,221.064,18.201);
		ctx.bezierCurveTo(221.39499999999998,17.803,221.66299999999998,17.338,222.08599999999998,17.017);
		ctx.bezierCurveTo(222.503,16.694,222.96099999999998,16.4,223.534,16.259);
		ctx.lineTo(223.6,16.334);
		ctx.bezierCurveTo(223.397,16.883,223.10899999999998,17.312,222.792,17.723);
		ctx.bezierCurveTo(222.482,18.137999999999998,222.029,18.419,221.633,18.761);
		ctx.bezierCurveTo(220.839,19.442999999999998,219.996,20.098,219.083,20.621);
		ctx.lineTo(219.022,20.544);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(224.287,25.411);
		ctx.bezierCurveTo(223.85500000000002,25.099,223.574,24.564,223.465,24.020000000000003);
		ctx.bezierCurveTo(223.366,23.470000000000002,223.397,22.910000000000004,223.485,22.370000000000005);
		ctx.bezierCurveTo(223.58100000000002,21.834000000000003,223.662,21.268000000000004,223.973,20.808000000000003);
		ctx.bezierCurveTo(224.276,20.355000000000004,224.668,19.925000000000004,225.226,19.712000000000003);
		ctx.lineTo(225.3,19.779000000000003);
		ctx.bezierCurveTo(225.175,20.336000000000002,225.02800000000002,20.793000000000003,224.86700000000002,21.256000000000004);
		ctx.bezierCurveTo(224.71900000000002,21.715000000000003,224.425,22.113000000000003,224.258,22.571000000000005);
		ctx.bezierCurveTo(224.09,23.024000000000004,223.972,23.498000000000005,223.96300000000002,23.974000000000004);
		ctx.bezierCurveTo(223.93900000000002,24.448000000000004,224.03600000000003,24.941000000000003,224.359,25.342000000000002);
		ctx.lineTo(224.287,25.411);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(226.35,43.862);
		ctx.bezierCurveTo(226.595,45.241,227.06799999999998,46.541000000000004,227.60899999999998,47.805);
		ctx.bezierCurveTo(227.87999999999997,48.439,228.25699999999998,49.028,228.46099999999998,49.692);
		ctx.bezierCurveTo(228.67,50.355,228.85699999999997,51.035,228.891,51.785);
		ctx.lineTo(228.79899999999998,51.82599999999999);
		ctx.bezierCurveTo(228.26399999999998,51.300999999999995,227.878,50.706999999999994,227.54,50.083999999999996);
		ctx.bezierCurveTo(227.196,49.462999999999994,227.052,48.754999999999995,226.855,48.07299999999999);
		ctx.bezierCurveTo(226.465,46.708999999999996,226.207,45.28399999999999,226.25099999999998,43.87199999999999);
		ctx.lineTo(226.35,43.862);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(220.72,43.471);
		ctx.bezierCurveTo(221.274,44.16,221.602,45.01,222.027,45.736999999999995);
		ctx.bezierCurveTo(222.427,46.465999999999994,223.01899999999998,47.081999999999994,223.60299999999998,47.717999999999996);
		ctx.bezierCurveTo(224.20199999999997,48.352,224.84199999999998,49.01499999999999,225.26799999999997,49.769999999999996);
		ctx.lineTo(226.56099999999998,52.00899999999999);
		ctx.lineTo(226.49699999999999,52.084999999999994);
		ctx.bezierCurveTo(225.648,51.71099999999999,224.99499999999998,51.01599999999999,224.44899999999998,50.342999999999996);
		ctx.bezierCurveTo(223.89399999999998,49.662,223.516,48.916,222.986,48.227);
		ctx.bezierCurveTo(222.477,47.522,221.923,46.800999999999995,221.577,45.955);
		ctx.bezierCurveTo(221.249,45.119,221.071,44.278999999999996,220.637,43.525999999999996);
		ctx.lineTo(220.72,43.471);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(215.097,48.236);
		ctx.bezierCurveTo(215.817,48.619,216.60500000000002,48.794,217.399,48.888999999999996);
		ctx.bezierCurveTo(218.193,48.99999999999999,219.002,49.037,219.824,49.102999999999994);
		ctx.bezierCurveTo(220.64100000000002,49.175999999999995,221.513,49.19199999999999,222.322,49.55799999999999);
		ctx.bezierCurveTo(223.133,49.931999999999995,223.792,50.434999999999995,224.36,51.08699999999999);
		ctx.lineTo(224.30900000000003,51.17299999999999);
		ctx.bezierCurveTo(223.473,50.99899999999999,222.705,50.69399999999999,221.98400000000004,50.49799999999999);
		ctx.bezierCurveTo(221.25400000000005,50.31399999999999,220.50800000000004,50.05199999999999,219.71300000000005,49.89399999999999);
		ctx.bezierCurveTo(218.92000000000004,49.73199999999999,218.10500000000005,49.59299999999999,217.29900000000006,49.37699999999999);
		ctx.bezierCurveTo(216.50000000000006,49.14699999999999,215.70300000000006,48.822999999999986,215.04500000000007,48.319999999999986);
		ctx.lineTo(215.097,48.236);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.save();
		ctx.restore();
		ctx.restore();
		ctx.save();
		g=ctx.createRadialGradient(79.8987,32.2599,0,98.4238,41.9541,30.8533);
		g.addColorStop(0,"#D0C085");
		g.addColorStop(0.1715,"#CFB97F");
		g.addColorStop(0.4647,"#CCA870");
		g.addColorStop(0.8418,"#C78B5A");
		g.addColorStop(1,"#C47F51");
		ctx.fillStyle = g;
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 2;
		ctx.miterLimit = 10;
		ctx.beginPath();
		ctx.moveTo(129.146,63.424);
		ctx.bezierCurveTo(110.92999999999998,62.174,97.26699999999998,60.549,67.856,63.424);
		ctx.bezierCurveTo(66.48899999999999,51.998,74.877,35.674,67.856,21.641);
		ctx.bezierCurveTo(91.46199999999999,25.189,105.56899999999999,17.761,129.146,21.641);
		ctx.bezierCurveTo(126.109,32.174,126.377,52.763,129.146,63.424);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(75.016,36.539);
		ctx.bezierCurveTo(74.878,34.706,74.971,32.845,74.655,31.107);
		ctx.bezierCurveTo(74.502,30.22,74.115,29.512999999999998,73.735,28.722);
		ctx.bezierCurveTo(73.357,27.935000000000002,72.891,27.078000000000003,72.745,26.123);
		ctx.lineTo(72.83500000000001,26.080000000000002);
		ctx.bezierCurveTo(73.47300000000001,26.782000000000004,74.06500000000001,27.431,74.60400000000001,28.226000000000003);
		ctx.bezierCurveTo(75.16100000000002,29.011000000000003,75.38900000000001,30.064000000000004,75.44800000000001,31.000000000000004);
		ctx.bezierCurveTo(75.60000000000001,32.906000000000006,75.26400000000001,34.715,75.11600000000001,36.538000000000004);
		ctx.lineTo(75.016,36.538000000000004);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(79.761,34.844);
		ctx.bezierCurveTo(79.152,33.052,78.944,31.130000000000003,78.31099999999999,29.434);
		ctx.bezierCurveTo(77.99199999999999,28.582,77.485,27.875,76.95299999999999,27.241);
		ctx.bezierCurveTo(76.41099999999999,26.594,75.68999999999998,26.095,74.86299999999999,25.582);
		ctx.lineTo(74.88899999999998,25.485);
		ctx.bezierCurveTo(75.86799999999998,25.465,76.88599999999998,25.835,77.66399999999999,26.535999999999998);
		ctx.bezierCurveTo(78.46399999999998,27.235999999999997,78.82399999999998,28.258999999999997,79.073,29.188999999999997);
		ctx.bezierCurveTo(79.576,31.088999999999995,79.53099999999999,32.971,79.85799999999999,34.81999999999999);
		ctx.lineTo(79.761,34.844);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(86.452,28.43);
		ctx.bezierCurveTo(85.744,28.496,85.04299999999999,28.604,84.312,28.629);
		ctx.bezierCurveTo(83.593,28.64,82.79599999999999,28.552,82.093,28.178);
		ctx.bezierCurveTo(81.417,27.828,80.775,27.434,80.286,26.931);
		ctx.bezierCurveTo(79.788,26.429000000000002,79.34700000000001,25.942,78.839,25.389);
		ctx.lineTo(78.883,25.299);
		ctx.bezierCurveTo(79.654,25.364,80.341,25.756999999999998,80.92699999999999,26.163);
		ctx.bezierCurveTo(81.52499999999999,26.566,81.952,27.115000000000002,82.499,27.488);
		ctx.bezierCurveTo(83.00999999999999,27.865,83.654,28.041,84.341,28.13);
		ctx.bezierCurveTo(85.026,28.236,85.74199999999999,28.264,86.451,28.33);
		ctx.lineTo(86.452,28.43);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(72.457,51.734);
		ctx.bezierCurveTo(72.30699999999999,52.408,72.208,53.078,72.09899999999999,53.760000000000005);
		ctx.bezierCurveTo(71.981,54.431000000000004,71.82799999999999,55.133,71.64899999999999,55.793000000000006);
		ctx.bezierCurveTo(71.49099999999999,56.42600000000001,71.49199999999999,57.075,71.41099999999999,57.68800000000001);
		ctx.bezierCurveTo(71.335,58.31200000000001,71.32999999999998,58.93900000000001,71.31599999999999,59.67000000000001);
		ctx.lineTo(71.22299999999998,59.70700000000001);
		ctx.bezierCurveTo(70.71499999999999,59.16100000000001,70.46199999999999,58.41600000000001,70.41099999999999,57.67200000000001);
		ctx.bezierCurveTo(70.34999999999998,56.91200000000001,70.62899999999999,56.20500000000001,70.89099999999999,55.53700000000001);
		ctx.bezierCurveTo(71.16499999999999,54.90400000000001,71.39599999999999,54.29000000000001,71.615,53.634000000000015);
		ctx.bezierCurveTo(71.851,52.99200000000001,72.085,52.332000000000015,72.36099999999999,51.704000000000015);
		ctx.lineTo(72.457,51.734);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(77.188,53.842);
		ctx.bezierCurveTo(76.56,54.667,75.831,55.403999999999996,75.185,56.167);
		ctx.bezierCurveTo(74.85900000000001,56.549,74.624,56.99,74.284,57.319);
		ctx.lineTo(73.21700000000001,58.374);
		ctx.lineTo(73.12000000000002,58.347);
		ctx.bezierCurveTo(73.00100000000002,57.761,73.21200000000002,57.187000000000005,73.48500000000001,56.718);
		ctx.bezierCurveTo(73.76000000000002,56.233000000000004,74.22500000000001,55.929,74.62500000000001,55.596000000000004);
		ctx.bezierCurveTo(75.43100000000001,54.925000000000004,76.29600000000002,54.382000000000005,77.11800000000001,53.772000000000006);
		ctx.lineTo(77.188,53.842);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(82.256,58.406);
		ctx.bezierCurveTo(81.634,58.190999999999995,80.992,58.065999999999995,80.351,57.999);
		ctx.bezierCurveTo(79.713,57.917,79.07,57.896,78.445,57.95);
		ctx.bezierCurveTo(77.814,58,77.23299999999999,58.207,76.66,58.324000000000005);
		ctx.bezierCurveTo(76.08,58.456,75.53699999999999,58.638000000000005,74.91499999999999,58.961000000000006);
		ctx.lineTo(74.838,58.89900000000001);
		ctx.bezierCurveTo(75.047,58.19400000000001,75.675,57.66600000000001,76.338,57.37800000000001);
		ctx.bezierCurveTo(77.015,57.071000000000005,77.756,57.11300000000001,78.44,57.150000000000006);
		ctx.bezierCurveTo(79.819,57.24100000000001,81.14699999999999,57.635000000000005,82.298,58.31400000000001);
		ctx.lineTo(82.256,58.406);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(115.266,26.062);
		ctx.bezierCurveTo(116.62400000000001,24.943,118.03200000000001,23.848000000000003,119.67800000000001,23.071);
		ctx.bezierCurveTo(120.49400000000001,22.689,121.37100000000001,22.298000000000002,122.32400000000001,22.281000000000002);
		ctx.bezierCurveTo(123.26200000000001,22.253000000000004,124.23300000000002,22.471000000000004,124.98600000000002,23.020000000000003);
		ctx.lineTo(124.95500000000001,23.115000000000002);
		ctx.bezierCurveTo(124.043,23.099000000000004,123.22600000000001,23.133000000000003,122.418,23.277);
		ctx.bezierCurveTo(121.619,23.426000000000002,120.789,23.528000000000002,119.98100000000001,23.812);
		ctx.bezierCurveTo(118.373,24.377000000000002,116.843,25.263,115.322,26.145000000000003);
		ctx.lineTo(115.266,26.062);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(118.682,27.958);
		ctx.bezierCurveTo(119.48700000000001,27.288999999999998,120.215,26.566,120.955,25.839);
		ctx.bezierCurveTo(121.325,25.477,121.641,25.041999999999998,122.094,24.767999999999997);
		ctx.bezierCurveTo(122.54299999999999,24.488999999999997,123.03,24.244999999999997,123.61399999999999,24.163999999999998);
		ctx.lineTo(123.67299999999999,24.244999999999997);
		ctx.bezierCurveTo(123.41399999999999,24.769999999999996,123.08299999999998,25.166999999999998,122.72599999999998,25.543);
		ctx.bezierCurveTo(122.37399999999998,25.923,121.89599999999999,26.157,121.46599999999998,26.456);
		ctx.bezierCurveTo(120.60599999999998,27.052,119.69799999999998,27.616,118.73699999999998,28.041);
		ctx.lineTo(118.682,27.958);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(123.414,33.344);
		ctx.bezierCurveTo(123.016,32.99,122.793,32.427,122.74,31.875);
		ctx.bezierCurveTo(122.699,31.317,122.78699999999999,30.764,122.92899999999999,30.236);
		ctx.bezierCurveTo(123.08099999999999,29.713,123.21999999999998,29.158,123.57699999999998,28.733);
		ctx.bezierCurveTo(123.92499999999998,28.314,124.35899999999998,27.926000000000002,124.93599999999998,27.773);
		ctx.lineTo(125.00199999999998,27.847);
		ctx.bezierCurveTo(124.81999999999998,28.388,124.62599999999998,28.827,124.41799999999998,29.271);
		ctx.bezierCurveTo(124.22499999999998,29.712,123.89099999999998,30.078,123.67799999999998,30.517);
		ctx.bezierCurveTo(123.46299999999998,30.948999999999998,123.29599999999998,31.409,123.23899999999999,31.881);
		ctx.bezierCurveTo(123.16499999999999,32.35,123.21199999999999,32.85,123.49099999999999,33.282000000000004);
		ctx.lineTo(123.414,33.344);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(123.554,51.909);
		ctx.bezierCurveTo(123.656,53.306,123.991,54.647,124.399,55.961999999999996);
		ctx.bezierCurveTo(124.603,56.620999999999995,124.917,57.245,125.049,57.927);
		ctx.bezierCurveTo(125.188,58.608,125.305,59.303,125.26,60.053);
		ctx.lineTo(125.164,60.083999999999996);
		ctx.bezierCurveTo(124.685,59.50599999999999,124.364,58.87499999999999,124.09400000000001,58.221);
		ctx.bezierCurveTo(123.816,57.568,123.745,56.849,123.62100000000001,56.150999999999996);
		ctx.bezierCurveTo(123.37400000000001,54.754,123.26400000000001,53.309,123.45400000000001,51.91);
		ctx.lineTo(123.554,51.91);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(117.994,50.938);
		ctx.bezierCurveTo(118.474,51.68,118.713,52.559000000000005,119.06,53.326);
		ctx.bezierCurveTo(119.382,54.095,119.908,54.765,120.422,55.461);
		ctx.bezierCurveTo(120.951,56.152,121.52,56.879,121.86399999999999,57.673);
		ctx.lineTo(122.919,60.035000000000004);
		ctx.lineTo(122.847,60.103);
		ctx.bezierCurveTo(122.04199999999999,59.644,121.464,58.884,120.991,58.159);
		ctx.bezierCurveTo(120.511,57.425,120.213,56.643,119.756,55.903);
		ctx.bezierCurveTo(119.323,55.149,118.846,54.375,118.59,53.495999999999995);
		ctx.bezierCurveTo(118.351,52.63099999999999,118.26,51.776999999999994,117.906,50.983);
		ctx.lineTo(117.994,50.938);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.save();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(111.908,55.095);
		ctx.bezierCurveTo(112.58500000000001,55.55,113.35,55.806,114.131,55.983);
		ctx.bezierCurveTo(114.908,56.175999999999995,115.709,56.296,116.521,56.448);
		ctx.bezierCurveTo(117.32600000000001,56.604,118.19200000000001,56.711,118.959,57.158);
		ctx.bezierCurveTo(119.726,57.614000000000004,120.32900000000001,58.182,120.827,58.89);
		ctx.lineTo(120.768,58.97);
		ctx.bezierCurveTo(119.95400000000001,58.71,119.221,58.327999999999996,118.525,58.059);
		ctx.bezierCurveTo(117.81700000000001,57.8,117.10300000000001,57.461999999999996,116.328,57.224);
		ctx.bezierCurveTo(115.557,56.98,114.76,56.757999999999996,113.98100000000001,56.458999999999996);
		ctx.bezierCurveTo(113.21000000000001,56.147,112.45,55.742999999999995,111.84800000000001,55.175);
		ctx.lineTo(111.908,55.095);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.restore();
		ctx.restore();
		ctx.restore();
		
		
		this.image = canvas;
		
	};
	
	return Jumper;
})();

var Monocle = (function() {
	var Monocle = function(game) {
		this.game = game;
		this.ctx = ctx;
		
		this.init = function() {
			this.x = 200+600*Math.random();
			this.y = 100+500*Math.random();
			this.w = 80;
			this.h = 80;
			this.add = ~~(800*Math.random());
			this.hidden = false;
		};
		
		this.init();
		
	};
	
	Monocle.prototype.collision = function(x,y,r) {
		if (this.hidden) return false;
		if ((x + r < this.x) || (x - r > this.x + this.w) || (y + r < this.y - this.h) || (y - r > this.y) )
			return false;

		
		return true;
	};
	
	Monocle.prototype.hide = function() {
		this.hidden = true;
	};
	
	Monocle.prototype.render = function() {
		if (this.hidden) return;
		
		var x = this.x - this.game.centerX + 350,
			y = (500-this.y) + this.game.centerY - 250;
		
		
		if (x < -800) {
			this.hidden = false;
			this.x = this.game.centerX+350 + this.w;
			this.y = this.game.centerY -250+500*Math.random();
		}			
		
		if (y > 1200 + this.add) {
			this.y += 1200 + this.add;
		}
		
		if (y<0) {
			this.y -= 1200 + this.add;
		}

		if (x >= -this.w) {
			this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
			this.ctx.fillRect(x,y,this.w, this.h);
		}
		
	};
	
	return Monocle;
})();


var Game = (function() {
	var Game = function() {
		var self = this;
		this.screens = {};
		this.paused = false;
		this.playingMode = false;
		this.controls = document.getElementById('game-control');
		
		var bgimage = document.createElement('canvas');
		var bgbimage = document.createElement('canvas');
		var radgrad = ctx.createRadialGradient(100,500,20,100,600, 1900);
		radgrad.addColorStop(0, '#fbd137');
		radgrad.addColorStop(0.25, '#e37c2d');
		radgrad.addColorStop(0.5, '#db4c2c');
		radgrad.addColorStop(0.75, '#771e10');
		radgrad.addColorStop(1, '#48110c');
		
		this.init = function() {
			this.kiwi = new Kiwi(this);
			this.dusts = [new Dust(this), new Dust(this), new Dust(this), new Dust(this), new Dust(this), new Dust(this)];
			this.brains = [new Brain(this), new Brain(this)];
			this.tunnels = [new Tunnel(this)];
			this.jumpers = [new Jumper(this)];
			
			this.screens.start = document.getElementById('start-screen');
			this.screens.finish = document.getElementById('finish-screen');
			
			ctx.fillStyle = radgrad;
			ctx.fillRect(0,0,700,500);
			
			/**
			 * buttons
			 */
			
			document.getElementById('start').addEventListener('click', function(e) {
				self.startLoop();
				e.preventDefault();
				return false;
			}, true);
			
			
			document.getElementById('restart').addEventListener('click', function(e) {
				e.preventDefault();
				self.startLoop();
				return false;
			}, true);
			
			var bgc = bgimage.getContext('2d');
			bgimage.width = 700;
			bgimage.height = 500;
			
			bgc.fillStyle = radgrad;
			bgc.fillRect(0,0,700,500);
			
			var bgbc = bgbimage.getContext('2d');
			bgbimage.width = 700;
			bgbimage.height = 500;
			
			var radgrad2 = ctx.createRadialGradient(100,300,20,700,500, 900);
			radgrad2.addColorStop(0, '#fbd137');
			radgrad2.addColorStop(0.25, '#e37c2d');
			radgrad2.addColorStop(0.5, '#db4c2c');
			radgrad2.addColorStop(0.75, '#771e10');
			radgrad2.addColorStop(1, '#48110c');
			
			bgbc.fillStyle = radgrad2;
			bgbc.fillRect(0,400,700,100);
			
			var grad = bgbc.createLinearGradient(0,400,0,500);
			grad.addColorStop(0, 'rgba(0,0,0,0.1)');
			grad.addColorStop(0.2, 'rgba(0,0,0,0.05)');
			grad.addColorStop(1, 'rgba(0,0,0,0.3)');
			
			bgbc.fillStyle = grad;
			bgbc.fillRect(0,400,700,100);
			
		};
		
		this.run = function() {
			this.init();
			this.startScreen();
		};
		
		this.startScreen = function() {

			this.screens.finish.style.display = 'none';
			this.screens.start.style.display = 'block';
			
			this.stopLoop();
		};
		
		this.finishScreen = function() {
			this.screens.start.style.display = 'none';
			this.screens.finish.style.display = 'block';
			document.getElementById('meters').innerHTML = ~~(this.kiwi.posX / 100)
			this.stopLoop();
		};
		
		this.startLoop = function() {
			
			// reseting
			var i,
			dl = self.dusts.length,
			bl = self.brains.length,
			tl = self.tunnels.length,
			jl = self.jumpers.length;
			
			for (i =0; i<dl; i++) {
				self.dusts[i].init();
			}
			
			for (i =0; i<bl; i++) {
				self.brains[i].init();
			}
			
			for (i =0; i<tl; i++) {
				self.tunnels[i].init();
			}
			
			for (i =0; i<jl; i++) {
				self.jumpers[i].init();
			}
			
			this.screens.start.style.display = 'none';
			this.screens.finish.style.display = 'none';
			this.playingMode = true;
			
			this.kiwi.catapultMode();
			this.loop = this._gameLoop;
			requestAnimationFrame(this.loop);
		};
		
		this.continueGame = function() {
			if (this.playingMode && this.paused) {
				this.paused = false;
				this.loop = this._gameLoop;
				requestAnimationFrame(this.loop);
			}
		};
		
		this.stopLoop = function() {
			this.loop = this._empty;
			this.playingMode = false;
		};
		
		this._empty = function() {
			
		};
		
		this.loop = this._empty;
		
		this.slingBottomRender = function() {
			if (this.centerX > 550 || this.centerY > 600)
				return false;
			
			var x = this.kiwi.cx - this.centerX + 350,
				y = this.kiwi.cy + this.centerY - 250;
			
			ctx.fillStyle = '#964b00';
			ctx.strokeStyle = '#987654';
			ctx.lineWidth = 2;
			ctx.lineJoin = 'round';
			
			ctx.beginPath();
			
			ctx.moveTo(x, y-10);
			ctx.lineTo(x+10,y-10);
			ctx.lineTo(x,y+45);
			ctx.lineTo(x-10,y+45);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
			
			// line
			
			ctx.strokeStyle = 'rgba(40,40,40,0.7)';
			ctx.lineCap = 'round';
			ctx.lineWidth = 4;
			
			ctx.beginPath();
			
			ctx.moveTo(x-3, y);
			ctx.lineTo(x+10, y);
			ctx.stroke();
			
			ctx.beginPath();
			ctx.moveTo(x-4, y+4);
			ctx.lineTo(x+9, y+4);
			ctx.stroke();
			
			ctx.beginPath();			
			ctx.moveTo(x-5, y+8);
			ctx.lineTo(x+8, y+9);
			ctx.stroke();
			
		
		};
		
		this.slingUpRender = function() {
			if (this.centerX > 550 || this.centerY > 600)
				return false;
			var x = this.kiwi.cx - this.centerX + 350,
				y = this.kiwi.cy + this.centerY - 250;
		
			ctx.fillStyle = '#964b00';
			ctx.strokeStyle = '#987654';
			ctx.lineWidth = 2;
			ctx.lineJoin = 'round';
			
			ctx.beginPath();
			
			
			ctx.moveTo(x-10, y-10);
			ctx.lineTo(x-20,y-10);
			ctx.lineTo(x-10,y+45);
			ctx.lineTo(x-10,y+145);
			ctx.lineTo(x,y+145);
			ctx.lineTo(x,y+45);
			
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
			
			//line
			
			ctx.strokeStyle = 'rgba(40,40,40,0.7)';
			ctx.lineCap = 'round';
			ctx.lineWidth = 4;
			
			ctx.beginPath();
			
			ctx.moveTo(x-19, y);
			ctx.lineTo(x-7, y);
			ctx.stroke();
			
			ctx.beginPath();
			ctx.moveTo(x-18, y+4);
			ctx.lineTo(x-6, y+4);
			ctx.stroke();
			
			ctx.beginPath();			
			ctx.moveTo(x-17, y+8);
			ctx.lineTo(x-5, y+9);
			ctx.stroke();
		};
		
		this.islandRender = function() {
			if (this.centerX > 850 || this.centerY > 600)
				return false;
			
			var x = 100 - this.centerX + 350,
				y = 830 + this.centerY - 250;
			
			ctx.strokeStyle = 'rgb(90,60,0)';
			ctx.fillStyle = '#EDC9AF';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(x, y, 450, 0, Math.PI, true);
			ctx.fill();
			ctx.stroke();
		};
		
		this._gameLoop = function() {
			var i,
				dl = self.dusts.length,
				bl = self.brains.length,
				tl = self.tunnels.length,
				jl = self.jumpers.length;
			self.kiwi.move(mouseHandler.x, mouseHandler.y);
			self.centerX = (self.kiwi.posX < 350) ? 350 : self.kiwi.posX;
			self.centerY = (self.kiwi.posY < 250) ? 250 : self.kiwi.posY;
			ctx.drawImage(bgimage, 0, 0);
			ctx.drawImage(bgbimage, 0, ~~((self.centerY - 250)/10));

			
			
			for (i =0; i<dl; i++) {
				self.dusts[i].render();
			}
			
			for (i =0; i<bl; i++) {
				self.brains[i].render();
			}
			
			for (i =0; i<jl; i++) {
				self.jumpers[i].render();
			}
			
			self.slingBottomRender();
			
			self.kiwi.render();
			
			self.slingUpRender();
			self.islandRender();
			
			for (i =0; i<tl; i++) {
				self.tunnels[i].render();
			}
			
			self.kiwi.renderMana();
			
			requestAnimationFrame(self.loop);
		};
		
		this.pause = function() {
			if (this.playingMode) {
				this.paused = true;
				this.loop = this._empty();
			}
		};
		
		
	};
	return Game;
})();

var game = new Game();
game.run();

// events

var isMobileFlag = false;

function isMobile() {
	var el = document.getElementsByTagName('body');
	for (var i in el) {
		el[i].className = 'mobile';
	}
	handleMobile();
	window.addEventListener('resize', handleMobile, true);
	if ('onorientationchange' in window) {
		window.addEventListener('orientationchange', handleMobile, true);
	} else {
		document.getElementById('orientation-handler').addEventListener('resize', handleMobile, true)
	}
	isMobileFlag = true;
	
}

function handleMobile() {
	updateOffset();
	
	if (screen.width > screen.height) {
		if (!landscape) {
			switchXY = true;
		}
		landscape = true;
		portrait = false;
	} else {
		if (!portrait) {
			switchXY = false;
		}
		portrait = true;
		landscape = false;
	}
	
	var canvasWMax = 700,
		canvasHMax = 500;

	var pW = document.documentElement.clientWidth/canvasWMax+200;
	var pH = document.documentElement.clientHeight/canvasHMax;
	var p = Math.min(pW, pH);
	if (p>1) p = 1;
	
	transform(document.getElementById('content'), 'scale('+p+')');

}

function transform(el, val) {
	el.style.transform = val;
	el.style.MozTransform = val;
	el.style.webkitTransform = val;
	el.style.OTransform = val;
}

(function(a,b){if(/android.+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|e\-|e\/|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|xda(\-|2|g)|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))b()})(navigator.userAgent||navigator.vendor||window.opera,isMobile);

var keyboardHandler = {
		up: false,
		down: false,
		left: false,
		right: false,
		handleUp: function(e) {
			var code = e.keyCode || e.charCode;
			
			switch(code) {
				case 65: keyboardHandler.left = false; break;
				case 68: keyboardHandler.right = false; break;
				case 83: keyboardHandler.down = false; break;
				case 87: keyboardHandler.up = false; break;
			}
		},
		handleDown: function(e) {
			var code = e.keyCode || e.charCode;
			
			switch(code) {
				case 65: keyboardHandler.left = true; break;
				case 68: keyboardHandler.right = true; break;
				case 83: keyboardHandler.down = true; break;
				case 87: keyboardHandler.up = true; break;
			}
		}
};

var mouseHandler = {
	x:0,
	y:0,
	down: false,
	startX: null,
	startY: null,
	endX: null,
	endY: null,
	up: false,
	callbackUp: null,
	callbackDown: null,
	callbackClick: null,
	handleUp: function(e) {
		var x = e.pageX - offsetLeft;
		var y = e.pageY - offsetTop;
		mouseHandler.endX = x;
		mouseHandler.endY = y;
		//up = true;
		if (typeof mouseHandler.callbackUp == 'function') {
			mouseHandler.callbackUp(mouseHandler.endX, mouseHandler.endY);
		}
	},
	handleDown: function(e) {
		var x = e.pageX - offsetLeft;
		var y = e.pageY - offsetTop;
		
		mouseHandler.startX = x;
		mouseHandler.startY = y;
		mouseHandler.endX = null;
		mouseHandler.endY = null;
		mouseHandler.down = true;
		
		if (typeof mouseHandler.callbackUp == 'function') {
			mouseHandler.callbackDown(x,y);
		}
	},
	handleClick: function(e) {
		e.preventDefault();
		if (typeof mouseHandler.callbackClick == 'function') {
			mouseHandler.callbackClick();
		}
		return false;
	},
	handleMove: function(e) {
		var x = e.pageX - offsetLeft;
		var y = e.pageY - offsetTop;
		mouseHandler.x = x;
		mouseHandler.y = y;
	}
};

var touchHandler = {
	
	_catapultStart: function(e) {
		mouseHandler.handleDown(e.changedTouches[0]);
		 
	},
	_flyStart: function(e) {
		mouseHandler.handleClick(e);
	},
	_handleStart: function() {
		
	},
	handleStart: function(e) {
		touchHandler._handleStart(e);
		
	},
	handleEnd: function(e) {
		mouseHandler.handleUp(e.changedTouches[0]);
	},
	
	handleMove: function(e) {
		e.preventDefault();
		mouseHandler.handleMove(e.changedTouches[0]);
		
	}
};

touchHandler._handleStart = touchHandler._catapultStart;

deb = document.getElementById('debug');



function updateOffset() {
	offsetTop = canvas.offsetTop + canvas.offsetParent.offsetTop;
	offsetLeft = canvas.offsetLeft + canvas.offsetParent.offsetLeft;
}

updateOffset();

mouseHandler.callbackUp = game.kiwi.handleUp;
mouseHandler.callbackDown = game.kiwi.handleDown;

if (!isMobileFlag) {
	document.addEventListener('keydown', keyboardHandler.handleDown, false);
	document.addEventListener('keyup', keyboardHandler.handleUp, false);
	
	document.addEventListener('mousedown', mouseHandler.handleDown, false);
	document.addEventListener('mouseup', mouseHandler.handleUp, false);
	canvas.addEventListener('click', mouseHandler.handleClick, true);
	
	document.addEventListener('mousemove', mouseHandler.handleMove, false);
} else {
	// tap events
	canvas.addEventListener('touchstart', touchHandler.handleStart, false);
	canvas.addEventListener('touchend', touchHandler.handleEnd, false);
	canvas.addEventListener('touchmove', touchHandler.handleMove, false);
}

document.getElementById('tunnel').getContext('2d').drawImage(game.tunnels[0].image,0,0);
document.getElementById('brain').getContext('2d').drawImage(game.brains[0].image,0,0);
document.getElementById('starfish').getContext('2d').drawImage(game.jumpers[0].image,0,0);

