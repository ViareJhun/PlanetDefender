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

// VK
function vkInit()
{
	vkBridge.send('VKWebAppInit');
}

function showAd()
{
	vkBridge.send("VKWebAppShowNativeAds", {ad_format:"preloader"})
	.then(data => console.log(data.result))
	.catch(error => console.log(error));
}

function groupVK()
{
	vkBridge.send("VKWebAppJoinGroup", {"group_id": 203816953});
	/*
	.then(data => console.log(data.result))
	.catch(error => console.log(error));
	*/
}

function shareVK()
{
	vkBridge.send("VKWebAppShowInviteBox", {})
    .then(data => console.log(data.success))
    .catch(error => console.log(error));
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
	tex_path['restart0'] = 'img/restart0.png';
	tex_path['restart1'] = 'img/restart1.png';
	tex_path['star0'] = 'img/star0.png';
	tex_path['star1'] = 'img/star1.png';
	tex_path['star2'] = 'img/star2.png';
	tex_path['tap_zone'] = 'img/tap_zone.png';
	tex_path['sb'] = 'img/sb.png';
	tex_path['particle'] = 'img/particle.png';
	tex_path['pb0'] = 'img/pb0.png';
	tex_path['pb1'] = 'img/pb1.png';
	tex_path['bb'] = 'img/bb.png';
	
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
			
			mouseUp();
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
		
		mouseUp();
	}
)

// Game
var game_state = 'load';

var version = 2;

var lives = 2;
var asteroids = [];
var defender = [];
var particles = [];
var def_radius = 80;
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
var as_time_max = 60;
var as_time = as_time_max;
var as_speed = 1.5;
var hits = 0;
var score = 0;
var max_score = 0;
var timer_max = 60;
var timer = timer_max;
var score_qual = 1;

var tuts = 0;
var tutorial_time_max = 60 * 3;
var tutorial_time = tutorial_time_max;
var tutorial_alpha = 1;
var tutorial_end = 0;
var tut2_alpha = 0;
var tut2_time_max = 60 * 2.5;
var tut2_time = tut2_time_max;
var tut2_switch = 0;

var background = document.createElement('Canvas');
background.width = surface.width;
background.height = surface.height;
var back_ctx = background.getContext('2d');
var back_loaded = 0;

var foreground = document.createElement('Canvas');
foreground.width = surface.width;
foreground.height = surface.height;
var fore_ctx = foreground.getContext('2d');
var back_draw = 10;

var PAUSE = 0;
var pb_x = surface.width - 40;
var pb_y = 16;
var pb_w = 40;
var pb_h = 40;
var bcon_x = surface.width * 0.5;
var bcon_y = surface.height * 0.2;
var bcon_angle = Math.random() * d360;
var bmen_x = surface.width * 0.5;
var bmen_y = surface.height * 0.8;
var bmen_angle = Math.random() * d360;

var pause_time = 0;
var tomenu_time = 0;

var running = 0;

function genBack()
{
	/*
	back_ctx.drawImage(
		tex['back1'],
		0,
		0
	);
	*/
	
	let stars = 50 + irandom(40);
	
	for (let i = 0; i < stars; i ++)
	{
		back_ctx.save();
		back_ctx.translate(
			irandom(
				surface.width - 15
			),
			irandom(
				surface.height - 15
			)
		);
		let scale = 0.05 + Math.random() * 0.2;
		back_ctx.scale(
			scale,
			scale
		);
		back_ctx.drawImage(
			tex[
				choose(
					[
						'star0',
						'star1',
						'star2'
					]
				)
			],
			0,
			0
		);
		back_ctx.restore();
	}
	
	for (let i = 0; i < stars * 0.4; i ++)
	{
		// Foreground
		fore_ctx.save();
		fore_ctx.translate(
			irandom(
				surface.width - 15
			),
			irandom(
				surface.height - 15
			)
		);
		scale = 0.2 + Math.random() * 0.3;
		fore_ctx.scale(
			scale,
			scale
		);
		fore_ctx.drawImage(
			tex[
				choose(
					[
						'star0',
						'star1',
						'star2'
					]
				)
			],
			0,
			0
		);
		fore_ctx.restore();
	}
	
	back_loaded = 1;
}

var T1 = Math.random() * d360;
var T2 = Math.random() * d360;

function preLoad()
{
	max_score = localStorage.getItem('dioScore' + version);
	if (max_score == null)
	{
		max_score = 0;
	}
	
	running = localStorage.getItem('dioRun' + version);
	if (running == null)
	{
		running = 0;
	}
	
	running ++;
	
	if (running >= 2)
	{
		showAd();
	}
	localStorage.setItem('dioRun' + version, running);
	
	tuts = localStorage.getItem('dioTut' + version);
	if (tuts == null)
	{
		tuts = 0;
	}
}

function clearObjects()
{
	defender = [];
	asteroids = [];
	particles = [];
	
	lives = 2;
}

function startGame()
{
	defender.push(
		new CreateDefender(1)
	);
	defender.push(
		new CreateDefender(-1)
	);
	
	game_state = 'game';
	
	score = 0;
	score_qual = 1;
	score_draw = 0;
	
	as_speed = 1.5;
	as_time_max = 60;
	
	tutorial_time = tutorial_time_max;
	tutorial_alpha = 1;
	tutorial_end = 0;
	tuts ++;
	if (tuts >= 2)
	{
		tutorial_end = 1;
	}
	localStorage.setItem('dioTut' + version, tuts);
	
	tut2_time = tut2_time_max;
	tut2_alpha = 0;
	tut2_switch = 0;
}

// Menu
var sb_scale = 1;
var sb_to = 1;
var sb_x = surface.width * 0.5;
var sb_y = surface.height * 0.6;
var to_game = 0;

function gotoMenu()
{
	clearObjects();
	
	if (score > max_score)
	{
		max_score = score;
	}
	localStorage.setItem('dioScore' + version, max_score);
	
	game_state = 'menu';
	
	sc_scale = 1;
	sb_to = 1;
	to_game = 0;
	
	tomenu_time = 10;
}

// lose
var restart_time = 60 * 1.5;
var restart_alpha = 0;
var restart_scale = 1;
var restart_to = 1;
var restart_x = surface.width * 0.5;
var restart_y = surface.height * 0.6;
var score_draw = 0;
var to_menu = 0;
var lose_ad = 0;

function loseGame()
{
	if (score > max_score)
	{
		max_score = score;
	}
	localStorage.setItem('dioScore' + version, max_score);
	
	restart_to = 1;
	restart_scale = 1;
	to_menu = 0;
	
	restart_time = 60 * 3;
	restart_alpha = 0;
	score_draw = 0;
	
	clearObjects();
	
	lose_ad = 0;
	
	game_state = 'lose';
}


function mouseUp()
{
	switch (game_state)
	{
		case 'lose':
		{
			if (restart_time <= 0)
			{
				if (
					distance(
						mouse_x,
						mouse_y,
						restart_x,
						restart_y
					) < 128
				)
				{
					to_menu = 1;
				}
			}
		}
		break;
		
		case 'menu':
		{
			if (
				distance(
					mouse_x,
					mouse_y,
					sb_x,
					sb_y
				) < 128
			)
			{
				if (tomenu_time == 0)
				{
					to_game = 1;
				}
			}
		}
		break;
		
		case 'game':
		{
			if (pause_time == 0)
			{
				if (
					mouse_x > pb_x &&
					mouse_y > pb_y &&
					mouse_x < pb_x + pb_w &&
					mouse_y < pb_y + pb_h
				)
				{
					PAUSE = !PAUSE;
					pause_time = 20;
				}
			}
			
			if (PAUSE)
			{
				if (
					distance(
						mouse_x,
						mouse_y,
						bcon_x,
						bcon_y
					) < 140
				)
				{
					PAUSE = 0;
				}
				if (
					distance(
						mouse_x,
						mouse_y,
						bmen_x,
						bmen_y
					) < 140
				)
				{
					if (tomenu_time == 0)
					{
						PAUSE = 0;
						if (choose([true, true]))
						{
							showAd();
						}
						gotoMenu();
						tomenu_time = 15;
					}
				}
			}
		}
		break;
	}
}


// Game Objects
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
			let p = 5 + irandom(5);
			
			for (let i = 0; i < p; i ++)
			{
				particles.push(
					new CreateParticle(
						this.x,
						this.y
					)
				);
			}
				
			lives --;
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
					let p = 5 + irandom(5);
					
					for (let i = 0; i < p; i ++)
					{
						particles.push(
							new CreateParticle(
								this.x,
								this.y
							)
						);
					}
					
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

function CreateParticle(x, y)
{
	this.x = x;
	this.y = y;
	
	this.speed = 1 + Math.random() * 0.5;
	
	this.friction = 0.05;
	
	this.half_width = 19;
	this.half_height = 19;
	
	this.scale = 0.1 + Math.random() * 0.2;
	
	this.dir = Math.random() * d360;
	this.vecx = Math.cos(this.dir) * this.speed;
	this.vecy = -Math.sin(this.dir) * this.speed;
	
	
	this.update = () =>
	{
		this.x += this.vecx;
		this.y += this.vecy;
		
		this.vecx = Math.cos(this.dir) * this.speed;
		this.vecy = -Math.sin(this.dir) * this.speed;
		
		if (this.speed > 0)
		{
			this.speed -= this.friction;
		}
		else
		{
			return 1;
		}
		
		return 0;
	};
	
	this.draw = () =>
	{
		context.save();
		
		context.translate(
			this.x,
			this.y
		);
		
		context.scale(
			this.scale,
			this.scale
		);
		
		context.drawImage(
			tex['particle'],
			-this.half_width,
			-this.half_height
		);
		
		context.restore();
	};
}

// Game Update
function gameUpdate()
{
	if (PAUSE)
	{
		return 0;
	}
	
	// defenders
	defender[0].update();
	defender[1].update();
	
	if (timer > 0)
	{
		timer --;
	}
	else
	{
		timer = timer_max;
		
		score += score_qual;
	}
	
	// input
	if (mouse_check)
	{
		/*
		to_angle = pointDirection(
			surface.width * 0.5,
			surface.height * 0.5,
			mouse_x,
			mouse_y
		);
		*/
		
		if (mouse_x > planet.x)
		{
			to_angle -= as_speed * d1 * 1.2;
		}
		else
		{
			to_angle += as_speed * d1 * 1.2;
		}
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
	if (tutorial_end)
	{
		if (as_speed < 2)
		{
			as_speed += 0.0005;
		}
		else if (as_speed < 4)
		{
			score_qual = 5;
			
			as_speed += 0.0001;
			
			as_time_max = Math.max(as_time_max - 0.01, 30);
		}
		else
		{
			score_qual = 10;
			
			as_time_max = Math.min(as_time_max + 0.05, 37);
			as_speed += 0.00005;
		}
		
		if (as_time > 0)
		{
			as_time --;
		}
		else
		{
			let side = choose([-1, 1]);
			let len = surface.height * 0.7;
			
			let angle = side * d90 + Math.random() * d45 * 1.15 * choose([-1, 1]);
			
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
	
	particles.forEach(
		(item) =>
		{
			switch (item.update())
			{
				case 1:
				{
					let num = particles.indexOf(item);
					delete particles[num];
					particles.splice(num, 1);
				}
				break
			}
		}
	);
}

// Loop (upd + draw)
function loop()
{
	T1 += 0.02;
	T2 += 0.1;
	
	pause_time = Math.max(pause_time - 1, 0);
	tomenu_time = Math.max(tomenu_time - 1, 0);
	
	// Clear
	if (game_state != 'load')
	{
		context.drawImage(
			tex['back1'],
			0,
			0
		);
		context.drawImage(
			background,
			Math.cos(T2 * 0.05) * 5,
			-Math.sin(T2 * 0.05) * 5
		);
		context.drawImage(
			foreground,
			-Math.cos(T2 * 0.05) * 8,
			Math.sin(T2 * 0.05) * 8
		);
	}
	
	switch (game_state)
	{
		case 'load':
		{
			if (load_value == load_max)
			{
				gotoMenu();
			}
		}
		break;
		
		case 'menu':
		{
			if (back_draw > 0)
			{
				back_draw --;
			}
			else
			{
				if (!back_loaded)
				{
					back_loaded = 1;
					genBack();
				}
			}
			
			sb_to = 1;
			if (mouse_check)
			{
				if (
					distance(
						mouse_x,
						mouse_y,
						sb_x,
						sb_y
					) < 128
				)
				{
					sb_to = 0.8;
				}
			}
			
			if (sb_scale > 0.95)
			{
				if (to_game)
				{
					startGame();
				}
			}
			
			sb_scale += (
				sb_to - sb_scale
			) * 0.1;
			
			context.save();
			context.translate(
				sb_x,
				sb_y
			);
			context.scale(
				sb_scale,
				sb_scale
			);
			context.drawImage(
				tex['sb'],
				-64,
				-64
			);
			context.restore();
			
			
			context.font = 'bold 30px monospace';
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			context.fillStyle = '#FFFFFF';
			context.fillText(
				'DEFEND IO',
				surface.width * 0.5,
				surface.height * 0.15
			);
		}
		break;
		
		case 'game':
		{
			gameUpdate();
			
			particles.forEach(
				(item) =>
				{
					item.draw();
				}
			);
			
			// Planet
			if (!PAUSE)
			{
				planet.angle += 0.01;
			}
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
			
			// GUI
			if (score_draw < score)
			{
				score_draw += Math.max(1, Math.round(score * 0.02));
			}
			else
			{
				score_draw = score;
			}
			
			context.font = '20px monospace';
			context.fillStyle = '#FFFFFF';
			
			context.textAlign = 'left';
			context.textBaseline = 'top';
			
			context.fillText(
				'Счёт:' + score_draw + ' Рекорд:' + max_score,
				8,
				8
			);
			context.fillText(
				'Жизней:' + lives,
				8,
				32
			);
			
			// Tutorial
			if (!tutorial_end)
			{
				if (tutorial_time > 0)
				{
					tutorial_time --;
				}
				else
				{
					tutorial_alpha = Math.max(
						tutorial_alpha - 0.01,
						0
					);
				}
				
				context.globalAlpha = tutorial_alpha;
				
				context.font = '15px monospace';
				context.fillStyle = '#FFFFFF';
				
				context.textAlign = 'center';
				context.textBaseline = 'middle';
				
				context.drawImage(
					tex['tap_zone'],
					0,
					0
				);
				
				context.fillText(
					'Жми сюда,',
					surface.width * 0.25,
					surface.height * 0.5
				);
				context.fillText(
					'чтобы сдвинуть влево',
					surface.width * 0.25,
					surface.height * 0.5 + 32
				);
				
				context.drawImage(
					tex['tap_zone'],
					surface.width * 0.5,
					0
				);
				
				context.fillText(
					'Жми сюда,',
					surface.width * 0.75,
					surface.height * 0.5
				);
				context.fillText(
					'чтобы сдвинуть вправо',
					surface.width * 0.75,
					surface.height * 0.5 + 32
				);
				
				context.globalAlpha = 1;
				
				if (tutorial_alpha == 0)
				{
					if (!tut2_switch)
					{
						if (tut2_alpha < 1)
						{
							tut2_alpha += 0.02;
						}
						else
						{
							tut2_switch = 1
						}
					}
					else
					{
						if (tut2_time > 0)
						{
							tut2_time --;
						}
						else
						{
							if (tut2_alpha > 0)
							{
								tut2_alpha -= 0.02;
							}
							else
							{
								tut2_alpha = 0;
								tutorial_end = 1;
							}
						}
					}
				}
				
				context.globalAlpha = Math.max(tut2_alpha, 0);
				context.fillText(
					'Сбивай астероиды щитами!',
					surface.width * 0.5,
					surface.height * 0.3
				);
				context.fillText(
					'НЕ ДОПУСТИ СТОЛКНОВЕНИЯ АСТЕРОИДА',
					surface.width * 0.5,
					surface.height * 0.3 + 32
				);
				context.fillText(
					'С ПЛАНЕТОЙ',
					surface.width * 0.5,
					surface.height * 0.3 + 64
				);
				
				context.globalAlpha = 1;
			}
			
			if (lives <= 0)
			{
				loseGame();
			}
			
			// Pause
			let _t = 'pb0';
			if (PAUSE)
			{
				_t = 'pb1';
				context.globalAlpha = 0.6;
				context.fillStyle = '#000000';
				context.fillRect(
					0,
					0,
					surface.width,
					surface.height
				);
				context.globalAlpha = 1;
				
				bmen_angle += 0.01;
				bcon_angle += 0.01;
				
				context.fillStyle = '#FFFFFF';
				context.font = 'bold 15px monospace';
				context.textAlign = 'center';
				context.textBaseline = 'middle';
				
				context.save();
				context.translate(
					bcon_x,
					bcon_y
				);
				context.fillText(
					'Продолжить',
					0,
					0
				);
				context.rotate(
					bcon_angle
				);
				context.drawImage(
					tex['bb'],
					-70,
					-70
				);
				context.restore();
				
				context.save();
				context.translate(
					bmen_x,
					bmen_y
				);
				context.fillText(
					'В меню',
					0,
					0
				);
				context.rotate(
					bmen_angle
				);
				context.drawImage(
					tex['bb'],
					-70,
					-70
				);
				context.restore();
			}
			context.drawImage(
				tex[_t],
				pb_x,
				pb_y
			);
		}
		break;
		
		case 'lose':
		{
			// GUI
			
			context.fillStyle = '#FFFFFF';
			context.font = '25px monospace';
			
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			
			context.save();
			
			context.translate(
				surface.width * 0.5,
				surface.height * 0.35
			);
			
			context.rotate(
				Math.sin(T1 * 0.5) * d1 * 15
			);
			
			context.fillText(
				'Вы проиграли!',
				0,
				-12
			);
			
			if (score_draw < score)
			{
				score_draw += Math.max(1, Math.round(score * 0.02));
			}
			else
			{
				score_draw = score;
				
				if (!lose_ad)
				{
					lose_ad = 1;
					showAd();
				}
			}
			
			context.font = '15px monospace';
			
			context.fillText(
				'Вы набрали:' + score_draw + '!',
				0,
				12
			);
			
			context.restore();
			
			// button
			if (restart_time > 0)
			{
				restart_time --;
			}
			else
			{
				restart_alpha = Math.min(
					1,
					restart_alpha += 0.02
				);
				
				context.globalAlpha = restart_alpha;
				
				let color = 0;
				
				restart_to = 1;
				
				if (mouse_check)
				{
					if (
						distance(
							mouse_x,
							mouse_y,
							restart_x,
							restart_y
						) < 128
					)
					{
						restart_to = 0.8;
						color = 1;
					}
				}
				
				restart_scale += (
					restart_to - restart_scale
				) * 0.1;
				
				if (restart_scale > 0.95)
				{
					if (to_menu)
					{
						startGame();
					}
				}
				
				context.save();
				context.translate(
					restart_x,
					restart_y
				);
				context.scale(
					restart_scale,
					restart_scale
				);
				context.drawImage(
					tex['restart' + color],
					-64,
					-64
				);
				context.restore();
				
				context.globalAlpha = 1.0;
			}
		}
		break;
	}
	
	requestAnimationFrame(loop);
}

// Start Game
loadTextures();
setScreen();
preLoad();

requestAnimationFrame(loop);