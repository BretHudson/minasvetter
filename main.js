let placeItem = (grid, val, num) => {
	let sizeOfGrid = grid.length;
	for (let i = 0; i < num; ++i) {
		for (;;) {
			let r = Math.floor(Math.random() * sizeOfGrid);
			if (grid[r] !== 0)
				continue;
			grid[r] = val;
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
}

let movePlayer = (grid, rowWidth, player, x, y) => {
	let newX = player.x + x;
	let newY = player.y + y;
	let numRows = grid.length / rowWidth;
	if ((newX < 0) || (newX == rowWidth) ||
		(newY < 0) || (newY == numRows)) {
		console.log('no', newX, newY, player);
		return;
	}
	console.log('good');
	
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

let grid = [];
let mines = 10;
let diamonds = 5;
let sizeOfGrid = 121;
let rowWidth = 11;
let player = {
	x: Math.floor(rowWidth / 2),
	y: Math.floor((sizeOfGrid / rowWidth) / 2)
};

window.on('resize', (e) => {
	resizeDOMGrid();
});

document.on('DOMContentLoaded', (e) => {
	let gridElem = document.q('#grid');
	
	resizeDOMGrid();
	
	// Create a grid, we need 10x10 for starters
	for (let i = 0; i < sizeOfGrid; ++i)
		grid.push(0);
	
	placeItem(grid, 1, mines);
	placeItem(grid, 2, diamonds);
	
	grid = grid.map(val => {
		let className = '.tile.covered';
		switch (val) {
			case 1: className += '.mine'; break;
			case 2: className += '.diamond'; break;
		}
		return {
			val: val,
			left: null, right: null, top: null, bottom: null,
			element: $new(className).element()
		};
	});
	
	grid.forEach((item, index) => {
		if ((index % rowWidth) > 0)
			item.left = index - 1;
		if ((index % rowWidth) < (rowWidth - 1))
			item.right = index + 1;
		if (Math.floor(index / rowWidth) > 0)
			item.top = index - rowWidth;
		if (Math.floor(index / rowWidth) < (sizeOfGrid / rowWidth) - 1)
			item.bottom = index + rowWidth;
		gridElem.appendChild(item.element);
	});
	
	grid.forEach(item => {
		if (item.val !== 1) {
			let adj = 0;
			let left, right;
			if (item.left) {
				left = grid[item.left];
				adj += (left.val === 1);
				if (left.top)
					adj += (grid[left.top].val === 1);
				if (left.bottom)
					adj += (grid[left.bottom].val === 1);
			}
			if (item.right) {
				right = grid[item.right];
				adj += (right.val === 1);
				if (right.top)
					adj += (grid[right.top].val === 1);
				if (right.bottom)
					adj += (grid[right.bottom].val === 1);
			}
			if (item.top)
				adj += (grid[item.top].val === 1)
			if (item.bottom)
				adj += (grid[item.bottom].val === 1)
			if (adj > 0)
				item.element.dataset.adj = adj;
		}
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