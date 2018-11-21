let grid;
let rowWidth;
let sizeOfGrid;
let mines;
let player = { x: 0, y: 0 };
let playerElem;

let style;

const TILE_RESERVED = -1;
const TILE_EMPTY = 0;
const TILE_MINE = 1 << 0;
const TILE_MARKED = 1 << 1;
const TILE_QUESTION = 1 << 2;

class Random {
	constructor(seed) {
		this.m = 0x80000000;
		this.a = 1103515245;
		this.c = 12345;
		
		this.m = 0x80000000 - 1;
		this.a = 16807;
		this.c = 0;
		
		this.seed = seed;
		this.state = seed;
	}
	
	next() {
		this.state = (this.a * this.state + this.c) % this.m;
		return this.state;
	}
}

let genRNG;
let shuffle = (arr) => {
	let curIndex = arr.length, temp, randomIndex;
	
	while (curIndex > 0) {
		randomIndex = genRNG.next() % curIndex;
		--curIndex;
		
		temp = arr[curIndex];
		arr[curIndex] = arr[randomIndex];
		arr[randomIndex] = temp;
	}
	
	return arr;
};

let placeItem = (grid, val, num, maxAdj) => {
	let sizeOfGrid = grid.length;
	
	let testPos = shuffle([ ...Array(sizeOfGrid).keys() ]);
	for (let i = 0; num && (i < sizeOfGrid); ++i) {
		let item = grid[testPos[i]];
		if (item.val !== TILE_EMPTY)
			continue;
		// TODO(bret): Need to make sure all adjacent _mines_ are also adhering to this guideline
		if (getAdj(grid, item, val, true) > maxAdj)
			continue;
		item.val = val;
		--num;
	}
};

let getGridItem = (grid, rowWidth, x, y) => {
	if ((x < 0) || (x >= rowWidth) || (y < 0) || (y >= rowWidth)) return null;
	return grid[(y * rowWidth) + x];
};

let revealGrid = (grid, rowWidth, x, y) => {
	let queue = [];
	let nextQueue = [];
	let startItem = getGridItem(grid, rowWidth, x, y);
	queue.push(startItem);
	let revealAdj = () => {
		while (queue.length > 0) {
			let item = queue.shift();
			
			if (item.val !== TILE_EMPTY)
				continue;
			if (item.adjCount > 0)
				item.element.addClass('revealed');
			if (item.element.hasClass('revealed'))
				continue;
			
			let adj = getAdjItems(grid, item, true);
			// TODO(bret): Would it make more sense to use adjCount here???
			let mines = adj.reduce((acc, item) => {
				return acc + ((item.val & TILE_MINE) ? 1 : 0);
			}, 0);
			if ((item.val === 0) && (mines === 0)) {
				nextQueue.push(...adj);
			}
			item.element.addClass('revealed');
		}
		let temp = queue;
		queue = nextQueue;
		nextQueue = temp;
		setTimeout(revealAdj, 90);
	};
	revealAdj();
	
	startItem.element.addClass('revealed');
};

let burst = (grid, rowWidth, x, y) => {
	let item = getGridItem(grid, rowWidth, player.x, player.y);
	let adj = getAdjItems(grid, item, true);
	adj.forEach((item) => {
		if (item.val & TILE_MARKED) return;
		let x = item.id % rowWidth;
		let y = Math.floor(item.id / rowWidth);
		revealGrid(grid, rowWidth, x, y);
	});
};

let isMoving = false;
let movePlayer = (grid, rowWidth, player, x, y) => {
	if (isMoving) return;
	isMoving = true;
	
	let newX = player.x + x;
	let newY = player.y + y;
	let numRows = grid.length / rowWidth;
	if ((newX < 0) || (newX == rowWidth) ||
		(newY < 0) || (newY == numRows)) {
		return;
	}
	
	let cur = getGridItem(grid, rowWidth, player.x, player.y);
	let tar = getGridItem(grid, rowWidth, newX, newY);
	
	if (tar.val & TILE_MARKED) return;
	
	//cur.element.removeClass('player');
	//tar.element.addClass('player');
	
	player.x = newX;
	player.y = newY;
	
	let gridElem = document.q('#grid');
	let gridRect = gridElem.getBoundingClientRect();
	
	let tarRect = tar.element.getBoundingClientRect();
	let tarX = (tar.id % rowWidth) + 0.5;
	let tarY = Math.floor(tar.id / rowWidth) + 0.5;
	tarX = (tarX * tarRect.width);
	tarY = (tarY * tarRect.height);
	
	tarX /= gridRect.width;
	tarY /= gridRect.height;
	console.log({ tarX, tarY });
	
	let snapshot = Transition.snapshot(playerElem);
	playerElem.style.left = (tarX * 100) + '%';
	playerElem.style.top = (tarY * 100) + '%';
	Transition.from(playerElem, snapshot, 200).then(() => {
		revealGrid(grid, rowWidth, player.x, player.y);
		isMoving = false;
	});
};

let resizeDOMGrid = () => {
	let header = document.q('header');
	let headerHeight = header.getBoundingClientRect().height;
	
	let wh = window.innerHeight - (headerHeight * 2);
	
	let gridElem = document.getElementById('grid');
	if (wh < window.innerWidth) {
		gridElem.style.width = wh + 'px';
	} else
		gridElem.style.width = '100%';
};

window.on('resize', (e) => {
	resizeDOMGrid();
});

let getAdjItems = (grid, item, corners) => {
	let items = [];
	if (item.left !== null)
		items.push(grid[item.left]);
	if (item.right !== null)
		items.push(grid[item.right]);
	if (item.top !== null)
		items.push(grid[item.top]);
	if (item.bottom !== null)
		items.push(grid[item.bottom]);
	if (corners === true) {
		if (item.upLeft !== null)
			items.push(grid[item.upLeft]);
		if (item.upRight !== null)
			items.push(grid[item.upRight]);
		if (item.downLeft !== null)
			items.push(grid[item.downLeft]);
		if (item.downRight !== null)
			items.push(grid[item.downRight]);
	}
	return items;
};

// TODO(bret): Get rid of this, and instead use filter functions :)
let getAdj = (grid, item, test) => {
	let adj = 0;
	let left, right;
	if (item.left !== null) {
		left = grid[item.left];
		adj += (left.val === test);
		if (left.top !== null)
			adj += (grid[left.top].val === test);
		if (left.bottom !== null)
			adj += (grid[left.bottom].val === test);
	}
	if (item.right !== null) {
		right = grid[item.right];
		adj += (right.val === test);
		if (right.top !== null)
			adj += (grid[right.top].val === test);
		if (right.bottom !== null)
			adj += (grid[right.bottom].val === test);
	}
	if (item.top !== null)
		adj += (grid[item.top].val === test)
	if (item.bottom !== null)
		adj += (grid[item.bottom].val === test)
	return adj;
};

let getMouseToGrid = (x, y) => {
	let gridElem = document.q('#grid');
	let rect = gridElem.getBoundingClientRect();
	let firstTileRect = gridElem.children[0].getBoundingClientRect();
	x -= firstTileRect.x;
	y -= firstTileRect.y;
	
	let elemWidth = firstTileRect.width;
	x = Math.floor(x / elemWidth);
	y = Math.floor(y / elemWidth);
	return { x: x, y: y };
};

let gridClick = (e) => {
	let gridElem = document.q('#grid');
	let coords;
	if (e instanceof TouchEvent) {
		coords = getMouseToGrid(touchStartX, touchStartY);
	} else {
		coords = getMouseToGrid(e.clientX, e.clientY);
	}
	return markGrid(grid, curGame.w, coords, 0, 0);
};

let curGame = { w: 0, m: 0, seed: 0 };
let initGame = (w, m, seed) => {
	// Set the RNG's seed
	seed = seed || Math.floor(Math.random() * 1000000);
	genRNG = new Random(seed);
	console.log('Creating game with seed', seed);
	
	// Save it to curGame
	curGame.w = w;
	curGame.m = m;
	curGame.seed = seed;
	
	// Clear out the DOM
	let gridElem = document.q('#grid');
	while (gridElem.firstChild)
		gridElem.removeChild(gridElem.firstChild);
	
	// Set up variables
	grid = [];
	rowWidth = w;
	sizeOfGrid = rowWidth * rowWidth;
	mines = m;
	player.x = Math.floor(rowWidth / 2);
	player.y = Math.floor((sizeOfGrid / rowWidth) / 2);
	
	// Dynamically size the grid
	let size = ('' + (100 / rowWidth)).slice(0, 8) + '%';	
	let css = '.tile{width:' + size + ';height:' + size + '}';
	style.textContent = css;
	
	resizeDOMGrid();
	
	// Initialize the grid array
	for (let i = 0; i < sizeOfGrid; ++i) {
		grid.push({
			val: TILE_EMPTY, adjCount: 0,
			left: null, right: null, top: null, bottom: null,
			upLeft: null, upRight: null,
			downLeft: null, downRight: null
		});
	}
	
	// Connect all the tiles so they have references to each other
	grid.forEach((item, index) => {
		item.id = index;
		if ((index % rowWidth) > 0)
			item.left = index - 1;
		if ((index % rowWidth) < (rowWidth - 1))
			item.right = index + 1;
		if (Math.floor(index / rowWidth) > 0)
			item.top = index - rowWidth;
		if (Math.floor(index / rowWidth) < (sizeOfGrid / rowWidth) - 1)
			item.bottom = index + rowWidth;
		if (item.top !== null) {
			if (item.left !== null)
				item.upLeft = item.top - 1;
			if (item.right !== null)
				item.upRight = item.top + 1;
		}
		if (item.bottom !== null) {
			if (item.left !== null)
				item.downLeft = item.bottom - 1;
			if (item.right !== null)
				item.downRight = item.bottom + 1;
		}
	});
	
	// Create "reserved" spaces that can't be occupied
	//let center = grid[Math.floor(grid.length / 2)];
	let center = getGridItem(grid, rowWidth, player.x, player.y);
	let reservedArea = getAdjItems(grid, center, true)
	reservedArea.push(center);
	reservedArea.forEach(item => { item.val = TILE_RESERVED; });
	
	// Place mines
	placeItem(grid, TILE_MINE, mines, 2);
	
	// Create the DOM elements and set data-adj
	grid.forEach(item => {
		let className = '.tile';
		switch (item.val) {
			case TILE_RESERVED: {
				item.val = TILE_EMPTY;
			} break;
			
			case TILE_MINE: {
				className += '.mine.hide-adj';
			} break;
		}
		
		let adj = getAdj(grid, item, TILE_MINE);
		
		item.element = $new(className).element();
		if (item.val === TILE_EMPTY) {
			item.adjCount = adj;
			item.element.dataset.adj = adj || '';
		}
		gridElem.appendChild(item.element);
	});
	
	let gi = getGridItem(grid, rowWidth, player.x, player.y);
	//gi.element.addClass('player');
	
	// Create player element
	playerElem = $new('.player-elem').element();
	gridElem.appendChild(playerElem);
	
	revealGrid(grid, rowWidth, player.x, player.y);
}

document.on('DOMContentLoaded', (e) => {
	style = $new('style').attr('type', 'text/css').element();
	document.head.appendChild(style);
	initGame(15, 36);
});

let STATE_MOVE = 0;
let STATE_PLACE = 1;
let playerState = STATE_MOVE;

let switchPlayerState = (state) => {
	if (playerState === state) return;
	
	let playerItem = getGridItem(grid, rowWidth, player.x, player.y);
	
	switch (playerState) {
		case STATE_PLACE: {
			playerElem.removeClass('place');
		} break;
	}
	
	switch (state) {
		case STATE_PLACE: {
			playerElem.addClass('place');
		} break;
	}
	
	playerState = state;
}

let markGrid = (grid, rowWidth, player, x, y) => {
	let item = getGridItem(grid, rowWidth, player.x + x, player.y + y);
	if (!item.element.hasClass('revealed')) {
		if (!item.element.hasClass('marked')) {
			if (item.element.hasClass('question')) {
				item.element.removeClass('question');
				item.val &= TILE_MINE;
			} else {
				item.element.addClass('marked');
				item.val |= TILE_MARKED;
			}
		} else {
			item.element.removeClass('marked');
			item.element.addClass('question');
			item.val |= TILE_QUESTION;
		}
	}
	return true && (item.val & TILE_MARKED);
};

let handleDirection = (x, y) => {
	if (playerState === STATE_MOVE)
		movePlayer(grid, rowWidth, player, x, y);
	else {
		markGrid(grid, rowWidth, player, x, y);
	}
};

let showAllTiles = (show) => {
	let gridElem = document.getElementById('grid');
	if (show)
		gridElem.addClass('show-all');
	else
		gridElem.removeClass('show-all');
};

let inputQueue = [];
let addToQueue = (x, y) => {
	//inputQueue.push([ x, y ]);
	handleDirection(x, y);
};

let lastPress = 0;
document.addEventListener('keydown', (e) => {
	switch (e.keyCode) {
		case 37:
		case 65: {
			addToQueue(-1, 0);
		} break;
		
		case 38:
		case 87: {
			addToQueue(0, -1);
		} break;
		
		case 39:
		case 68: {
			addToQueue(1, 0);
		} break;
		
		case 40:
		case 83: {
			addToQueue(0, 1);
		} break;
		
		case 16:
		case 32: {
			switchPlayerState(STATE_PLACE);
		} break;
		
		case 192: {
			showAllTiles(true);
		} break;
		
		case 82: {
			initGame(curGame.w, curGame.m, curGame.seed);
		} break;
	}
});

let checkElapsed = (now, then) => {
	let elapsed = now - then;
	return ((elapsed < 600) && (elapsed > 0));
};

document.addEventListener('keyup', (e) => {
	switch (e.keyCode) {
		case 16:
		case 32: {
			let now = new Date().getTime();
			if (checkElapsed(now, lastPress)) {
				burst(grid, curGame.w, player.x, player.y);
			}
			lastPress = now;
			switchPlayerState(STATE_MOVE);
		} break;
		
		case 192: {
			showAllTiles(false);
		} break;
	}
});

/// Touch events courtesy of WITS/Ian Jones
// https://raw.githubusercontent.com/WITS/regretris/master/js/main.js
// Touch events
let touchStartX = 0;
let touchStartY = 0;
let touchX = 0;
let touchY = 0;
let lastTouch = 0;
window.on('touchstart', e => {
	// Otherwise, listen for swipes
	if (e.touches.length === 1) {
		touchX = touchStartX = e.touches[0].clientX;
		touchY = touchStartY = e.touches[0].clientY;
		e.preventDefault();
	}
}, {
	passive: false
});
window.on('touchmove', e => {
	touchX = e.touches[0].clientX;
	touchY = e.touches[0].clientY;
});
window.on('touchend', e => {
	let now = new Date().getTime();
	
	if (e.touches.length === 0) {
		// If the user swiped
		const dist = Math.sqrt(
			Math.pow(touchX - touchStartX, 2) +
			Math.pow(touchY - touchStartY, 2)
		);
		if (dist >= 8) {
			// Detect axis
			if (Math.abs(touchX - touchStartX) >
				Math.abs(touchY - touchStartY)) { // Hor
				if (touchX < touchStartX) { // Left
					addToQueue(-1, 0);
				} else { // Right
					addToQueue(1, 0);
				}
			} else { // Vert
				if (touchY < touchStartY) { // Up
					addToQueue(0, -1);
				} else { // Down
					addToQueue(0, 1);
				}
			}
		} else {
			if (checkElapsed(now, lastTouch)) {
				burst(grid, curGame.w, player.x, player.y);
			} else
				gridClick(e)
		}
		
		lastTouch = now;
	}
});