// Graphics
var surface = document.getElementById('surface');
var context = surface.getContext('2d');

context.imageSmoothingEnabled = false;

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
	tex_path['back1'] = 'img/back1.png'
	
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

var defender = [];
var def_radius = 80;
var main_angle = 0;
var to_angle = 0;
var planet = {
	'x': surface.width * 0.5,
	'y': surface.height * 0.5,
	'half_width': 35,
	'half_height': 35,
	'angle': Math.random() * d360
};

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

// Game Update
function gameUpdate()
{
	defender[0].update();
	defender[1].update();
	
	if (mouse_check)
	{
		to_angle = pointDirection(
			surface.width * 0.5,
			surface.height * 0.5,
			mouse_x,
			mouse_y
		);
	}
	
	main_angle += angleDifference(
		to_angle,
		main_angle
	) * 0.2;
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
		}
		break;
	}
	
	requestAnimationFrame(loop);
}

// Start Game
loadTextures();
setScreen();

requestAnimationFrame(loop);