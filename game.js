// Graphics
var surface = document.getElementById('surface');
var context = surface.getContext('2d');

context.imageSmoothingEnabled = true;

// Utils
const d1 = 1 / 180 * Math.PI;
const d90 = Math.PI * 0.5;
const d45 = Math.PI * 0.25;
const d180 = Math.PI;
const d360 = Math.PI * 2;

function irandom(val)
{
	return Math.floor(Math.random() * val);
}

function choose(arr)
{
	return arr[irandom(arr.length)];
}

function collide(o1, o2, x, y)
{
	return (
		o1.x - o1.half_width + x < o2.x + o2.half_width &&
		o1.x + o1.half_width + x > o2.x - o2.half_width &&
		o1.y - o1.half_height + y < o2.y + o2.half_height &&
		o1.y + o1.half_height + y > o2.y - o2.half_height
	);
}

function distance(x1, y1, x2, y2)
{
	return Math.sqrt(
		(x1 - x2) * (x1 - x2) +
		(y1 - y2) * (y1 - y2)
	);
}

function angleDifference(from, to)
{
	return ((((from - to) % d360) + 1.5 * d360) % d360) - d180; 
}

function pointDirection(xfrom, yfrom, xto, yto)
{
	return -Math.atan2(
		yfrom - yto,
		xfrom - xto
	);
}

// Res
var loaded = 0;
var load_max = 0;
var load_value = 0;

var tex_path = [];
var tex = [];

function loadTextures()
{
	tex_path['cat'] = 'img/neon_cat.png';
	tex_path['planet'] = 'img/planet.png';
	tex_path['back1'] = 'img/back1.png';
	tex_path['asteroid'] = 'img/asteroid.png';
	
	Object.keys(tex_path).forEach(
		(key) =>
		{
			tex[key] = new Image();
			tex[key].src = tex_path[key];
			tex[key].onload = () =>
			{
				load_value ++;
			};
			tex[key].imageRendering = 'pixelated';
		}
	);
	
	load_max += tex.length;
}


// Set Screen
var asp = 1;
var xoffset = 0;
var yoffset = 0;

function setScreen()
{
	asp = innerHeight / surface.height;
	var vw = surface.width * asp;
	var vh = surface.height * asp;
	xoffset = (innerWidth - vw) * 0.5;
	
	if (vw > innerWidth)
	{
		asp = innerWidth / surface.width;
		var vw = surface.width * asp;
		var vh = surface.height * asp;
		
		xoffset = 0;
		yoffset = (innerHeight - vh) * 0.5;
	}
	
	surface.style.width = vw + 'px';
	surface.style.height = vh + 'py';
	
	surface.style.top = yoffset;
	surface.style.left = xoffset;
	surface.style.position = 'fixed';
}


// Input
var mouse_x = 0;
var mouse_y = 0;

var mouse_check = 0;

addEventListener(
	'mousemove',
	(e) =>
	{
		mouse_x = (e.clientX - xoffset) / asp;
		mouse_y = (e.clientY - yoffset) / asp;
	}
);

addEventListener(
	'mousedown',
	(e) =>
	{
		if (e.which == 1)
		{
			mouse_check = 1;
		}
	}
);

addEventListener(
	'mouseup',
	(e) =>
	{
		if (e.which == 1)
		{
			mouse_check = 0;
		}
	}
);

addEventListener(
	'touchmove',
	function (e)
	{
		mouse_x = (e.changedTouches[0].clientX - xoffset) / asp;
		mouse_y = (e.changedTouches[0].clientY - yoffset) / asp;
	}
)

addEventListener(
	'touchstart',
	function (e)
	{
		mouse_check = 1
		
		mouse_x = (e.changedTouches[0].clientX - xoffset) / asp;
		mouse_y = (e.changedTouches[0].clientY - yoffset) / asp;
	}
)

addEventListener(
	'touchend',
	function (e)
	{
		mouse_check = 0;
	}
)

// Game
var game_state = 'load';

var asteroids = [];
var defender = [];
var def_radius = 70;
var main_angle = 0;
var to_angle = 0;
var planet = {
	'x': surface.width * 0.5,
	'y': surface.height * 0.5,
	'half_width': 35,
	'half_height': 35,
	'radius': 50,
	'angle': Math.random() * d360
};
var as_time_max = 30;
var as_time = as_time_max;
var as_speed = 2.0;

function startGame()
{
	defender.push(
		new CreateDefender(1)
	);
	defender.push(
		new CreateDefender(-1)
	);
	
	game_state = 'game';
}

function CreateDefender(side)
{
	this.x = surface.width * 0.5;
	this.y = surface.height * 0.5;
	
	this.half_width = 19;
	this.half_height = 21;
	
	this.side = side;
	
	
	this.update = () =>
	{
		this.x = surface.width * 0.5 + Math.cos(main_angle + d90 * this.side) * def_radius;
		this.y = surface.height * 0.5 - Math.sin(main_angle + d90 * this.side) * def_radius;
	};
	
	this.draw = () =>
	{
		context.save();
		
		context.translate(
			this.x,
			this.y
		);
		
		context.drawImage(
			tex['cat'],
			-this.half_width,
			-this.half_height
		);
		
		context.restore();
	};
}

function CreateAsteroid(x, y, dir)
{
	this.x = x;
	this.y = y;
	
	this.angle = Math.random() * d360;
	
	this.texture = 'asteroid';
	this.scale = 0.5 + Math.random() * 0.5;
	
	this.half_width = 27 * this.scale;
	this.half_height = 30 * this.scale;
	
	this.dir = dir;
	
	this.vecx = 0;
	this.vecy = 0;
	
	this.speed = as_speed;
	
	this.radius = 5 * this.scale;
	
	
	this.update = () =>
	{
		this.angle += 0.04;
		
		this.vecx = Math.cos(this.dir) * this.speed;
		this.vecy = -Math.sin(this.dir) * this.speed;
		
		this.x += this.vecx;
		this.y += this.vecy;
		
		if (
			distance(
				this.x,
				this.y,
				planet.x,
				planet.y
			) < this.radius + planet.radius
		)
		{
			return 1;
		}
		
		let resul = 0;
		defender.forEach(
			(item) =>
			{
				if (
					collide(
						this,
						item,
						0,
						0
					)
				)
				{
					resul = 1;
				}
			}
		);
		
		return resul;
	};
	
	this.draw = () =>
	{
		context.save();
		context.translate(
			this.x,
			this.y
		);
		
		context.rotate(
			this.angle
		);
		
		context.scale(
			this.scale,
			this.scale
		);
		
		context.drawImage(
			tex[this.texture],
			-this.half_width / this.scale,
			-this.half_height / this.scale
		);
		
		context.restore();
	};
}

// Game Update
function gameUpdate()
{
	// defenders
	defender[0].update();
	defender[1].update();
	
	// input
	if (mouse_check)
	{
		to_angle = pointDirection(
			surface.width * 0.5,
			surface.height * 0.5,
			mouse_x,
			mouse_y
		);
	}
	
	/*
	if (Math.abs(main_angle - to_angle) >= d1 * 10)
	{
		main_angle += Math.sign(angleDifference(
			to_angle,
			main_angle
		)) * d1 * 5;
	}
	else
	{
		main_angle = to_angle;
	}
	*/
	main_angle += angleDifference(
		to_angle,
		main_angle
	) * 0.1;
	
	// asteroids
	asteroids.forEach(
		(item) =>
		{
			switch (item.update())
			{
				case 1:
				{
					let num = asteroids.indexOf(item);
					delete asteroids[num];
					asteroids.splice(num, 1);
				}
				break
			}
		}
	);
	
	if (as_time > 0)
	{
		as_time --;
	}
	else
	{
		let side = choose([-1, 1]);
		let len = surface.height * 0.5;
		
		let angle = side * d90 + Math.random() * d45 * choose([-1, 1]);
		
		let sx = surface.width * 0.5 + Math.cos(angle) * len;
		let sy = surface.height * 0.5 - Math.sin(angle) * len;
		
		asteroids.push(
			new CreateAsteroid(
				sx,
				sy,
				angle + d180
			)
		);
		
		as_time = as_time_max;
	}
}

// Loop (upd + draw)
function loop()
{
	switch (game_state)
	{
		case 'load':
		{
			startGame();
		}
		break;
		
		case 'game':
		{
			gameUpdate();
			
			// Clear
			context.drawImage(
				tex['back1'],
				0,
				0
			);
			
			// Planet
			planet.angle += 0.01;
			context.save();
			context.translate(
				planet.x,
				planet.y
			);
			context.rotate(planet.angle);
			context.drawImage(
				tex['planet'],
				-planet.half_width,
				-planet.half_height
			);
			context.restore();
			
			// Player
			defender[0].draw();
			defender[1].draw();
			
			// asteroids
			asteroids.forEach(
				(item) =>
				{
					item.draw();
				}
			);
		}
		break;
	}
	
	requestAnimationFrame(loop);
}

// Start Game
loadTextures();
setScreen();

requestAnimationFrame(loop);