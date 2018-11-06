let grid = [];
let mines = 15;
let diamonds = mines;
let sizeOfGrid = 121;
let rowWidth = 11;
let player = {
	x: Math.floor(rowWidth / 2),
	y: Math.floor((sizeOfGrid / rowWidth) / 2)
};

const TILE_RESERVED = -1;
const TILE_EMPTY = 0;
const TILE_MINE = 1;
const TILE_DIAMOND = 2;

let placeItem = (grid, val, num, maxAdj) => {
	let sizeOfGrid = grid.length;
	// TODO(bret): Just create an array of grid.length items [0...n-1] and then sort it randomly, go through one by one
	for (let i = 0; i < num; ++i) {
		for (;;) {
			let r = Math.floor(Math.random() * sizeOfGrid);
			let item = grid[r];
			if (item.val !== TILE_EMPTY)
				continue;
			if (getAdj(grid, item, val) > maxAdj)
				continue;
			item.val = val;
			break;
		}
	}
};

let getGridItem = (grid, rowWidth, x, y) => {
	return grid[(y * rowWidth) + x];
};

let revealGrid = (grid, rowWidth, x, y) => {
	let item = getGridItem(grid, rowWidth, x, y);
	item.element.addClass('revealed');
	// TODO(bret): Recursively do stuff
};

let movePlayer = (grid, rowWidth, player, x, y) => {
	let newX = player.x + x;
	let newY = player.y + y;
	let numRows = grid.length / rowWidth;
	if ((newX < 0) || (newX == rowWidth) ||
		(newY < 0) || (newY == numRows)) {
		return;
	}
	
	let cur = getGridItem(grid, rowWidth, player.x, player.y);
	cur.element.removeClass('player');
	
	player.x = newX;
	player.y = newY;
	
	let tar = getGridItem(grid, rowWidth, player.x, player.y);
	tar.element.addClass('player');
	
	revealGrid(grid, rowWidth, player.x, player.y);
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

let getAdjItems = (grid, item) => {
	let items = [];
	console.log(item);
	if (item.left !== null)
		items.push(grid[item.left]);
	if (item.right !== null)
		items.push(grid[item.right]);
	if (item.top !== null)
		items.push(grid[item.top]);
	if (item.bottom !== null)
		items.push(grid[item.bottom]);
	if (item.upLeft !== null)
		items.push(grid[item.upLeft]);
	if (item.upRight !== null)
		items.push(grid[item.upRight]);
	if (item.downLeft !== null)
		items.push(grid[item.downLeft]);
	if (item.downRight !== null)
		items.push(grid[item.downRight]);
	return items;
};

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

document.on('DOMContentLoaded', (e) => {
	let gridElem = document.q('#grid');
	
	resizeDOMGrid();
	
	// Initialize the grid array
	for (let i = 0; i < sizeOfGrid; ++i) {
		grid.push({
			val: TILE_EMPTY,
			left: null, right: null, top: null, bottom: null,
			upLeft: null, upRight: null,
			downLeft: null, downRight: null
		});
	}
	
	// Connect all the tiles so they have references to each other
	grid.forEach((item, index) => {
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
	let center = grid[Math.floor(grid.length / 2)];
	[center, ...getAdjItems(grid, center)].forEach(item => {
		item.val = TILE_RESERVED;
	});
	
	// Place mines and diamons
	placeItem(grid, TILE_MINE, mines, 2);
	placeItem(grid, TILE_DIAMOND, diamonds, 0);
	
	// Create the DOM elements and set data-adj
	grid.forEach(item => {
		let className = '.tile.covered';
		switch (item.val) {
			case TILE_RESERVED: {
				item.val = TILE_EMPTY;
			} break;
			
			case TILE_MINE: {
				className += '.mine.hide-adj';
			} break;
			
			case TILE_DIAMOND: {
				className += '.diamond.hide-adj';
			} break;
		}
		
		let adj = getAdj(grid, item, TILE_MINE);
		
		//if (item.val !== TILE_MINE) {
		
		item.element = $new(className).element();
		item.element.dataset.adj = adj || '';
		gridElem.appendChild(item.element);
	});
	
	let gi = getGridItem(grid, rowWidth, player.x, player.y);
	gi.element.addClass('player');
	
	revealGrid(grid, rowWidth, player.x, player.y);
});

document.addEventListener('keyup', (e) => {
	switch (e.keyCode) {
		case 37:
		case 65: {
			movePlayer(grid, rowWidth, player, -1, 0);
		} break;
		
		case 38:
		case 87: {
			movePlayer(grid, rowWidth, player, 0, -1);
		} break;
		
		case 39:
		case 68: {
			movePlayer(grid, rowWidth, player, 1, 0);
		} break;
		
		case 40:
		case 83: {
			movePlayer(grid, rowWidth, player, 0, 1);
		} break;
	}
});