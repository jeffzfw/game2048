class Game2048 {
    constructor(gridSize = 4) {
        this.gridSize = gridSize;
        this.grid = [];
        this.score = 0;
        this.gameOver = false;
        this.initGrid();
        this.setupEventListeners();
        this.addRandomTile();
        this.addRandomTile();
        this.renderGrid();
    }

    initGrid() {
        this.grid = Array(this.gridSize).fill().map(() => 
            Array(this.gridSize).fill(0)
        );
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;

            switch(e.key) {
                case 'ArrowUp': this.move('up'); break;
                case 'ArrowDown': this.move('down'); break;
                case 'ArrowLeft': this.move('left'); break;
                case 'ArrowRight': this.move('right'); break;
            }
        });

        // Touch event support (basic implementation)
        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;

            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Horizontal swipe
                diffX > 0 ? this.move('right') : this.move('left');
            } else {
                // Vertical swipe
                diffY > 0 ? this.move('down') : this.move('up');
            }
        });
    }

    addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.grid[r][c] === 0) {
                    emptyCells.push({r, c});
                }
            }
        }

        if (emptyCells.length > 0) {
            const {r, c} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
            return {r, c};
        }
        return null;
    }

    move(direction) {
        const rotatedGrid = this.rotateGrid(direction);
        let moved = false;

        // Process each row
        for (let r = 0; r < this.gridSize; r++) {
            // First, remove all zeros and get the numbers
            const row = rotatedGrid[r].filter(cell => cell !== 0);
            const newRow = Array(this.gridSize).fill(0);
            
            // For 'down' direction, we need to fill from the end
            const fillFromEnd = direction === 'down';
            let writeIndex = fillFromEnd ? this.gridSize - 1 : 0;
            let readIndex = fillFromEnd ? row.length - 1 : 0;

            // Process the numbers
            while (fillFromEnd ? readIndex >= 0 : readIndex < row.length) {
                // If we're at the last number or current number is different from next/previous
                const nextIndex = fillFromEnd ? readIndex - 1 : readIndex + 1;
                const isAtEnd = fillFromEnd ? readIndex === 0 : readIndex === row.length - 1;
                
                if (isAtEnd || row[readIndex] !== row[nextIndex]) {
                    newRow[writeIndex] = row[readIndex];
                    readIndex = fillFromEnd ? readIndex - 1 : readIndex + 1;
                } else {
                    // Merge equal numbers
                    newRow[writeIndex] = row[readIndex] * 2;
                    this.score += newRow[writeIndex];
                    readIndex = fillFromEnd ? readIndex - 2 : readIndex + 2;
                }
                writeIndex = fillFromEnd ? writeIndex - 1 : writeIndex + 1;
            }

            // Check if the row changed
            if (JSON.stringify(rotatedGrid[r]) !== JSON.stringify(newRow)) {
                moved = true;
            }
            rotatedGrid[r] = newRow;
        }

        const newGrid = this.unrotateGrid(rotatedGrid, direction);

        if (moved) {
            this.grid = newGrid;
            this.addRandomTile();
            this.renderGrid();
            this.updateScore();
            this.checkGameStatus();
        }
    }

    rotateGrid(direction) {
        let rotated = JSON.parse(JSON.stringify(this.grid));
        
        switch(direction) {
            case 'left': 
                return rotated;
            case 'right': 
                return rotated.map(row => row.reverse());
            case 'up':
                return this.transpose(rotated);
            case 'down':
                return this.transpose(rotated);
        }
    }

    unrotateGrid(grid, direction) {
        switch(direction) {
            case 'left': 
                return grid;
            case 'right': 
                return grid.map(row => row.reverse());
            case 'up':
                return this.transpose(grid);
            case 'down':
                return this.transpose(grid);
        }
    }

    transpose(grid) {
        return grid[0].map((_, colIndex) => grid.map(row => row[colIndex]));
    }

    gridChanged(newGrid) {
        return JSON.stringify(this.grid) !== JSON.stringify(newGrid);
    }

    renderGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const tileValue = this.grid[r][c];
                const tileElement = document.createElement('div');
                
                tileElement.classList.add('tile');
                if (tileValue !== 0) {
                    tileElement.textContent = tileValue;
                    tileElement.classList.add(`tile-${tileValue}`);
                    tileElement.classList.add('new-tile');
                }

                gridElement.appendChild(tileElement);
            }
        }
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
    }

    checkGameStatus() {
        // Check for 2048
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.grid[r][c] === 2048) {
                    alert('Congratulations! You reached 2048!');
                    this.gameOver = true;
                    return;
                }
            }
        }

        // Check if no moves are possible
        const hasEmptyCell = this.grid.some(row => row.includes(0));
        const canMerge = this.checkMergePossible();

        if (!hasEmptyCell && !canMerge) {
            alert('Game Over! No more moves possible.');
            this.gameOver = true;
        }
    }

    checkMergePossible() {
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const current = this.grid[r][c];
                
                // Check adjacent cells for possible merge
                const adjacentCells = [
                    r > 0 ? this.grid[r-1][c] : null,
                    r < this.gridSize - 1 ? this.grid[r+1][c] : null,
                    c > 0 ? this.grid[r][c-1] : null,
                    c < this.gridSize - 1 ? this.grid[r][c+1] : null
                ];

                if (adjacentCells.includes(current)) {
                    return true;
                }
            }
        }
        return false;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
