import random
from typing import List, Set, Tuple

import numpy as np


class NumberLinkGenerator:
    def __init__(self, size: int):
        self.size = size
        self.board = np.zeros((size, size), dtype=int)
        self.paths = []
        self.current_number = 1

    def is_valid_position(self, x: int, y: int) -> bool:
        return 0 <= x < self.size and 0 <= y < self.size

    def get_neighbors(self, x: int, y: int) -> List[Tuple[int, int]]:
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
        neighbors = []
        for dx, dy in directions:
            new_x, new_y = x + dx, y + dy
            if self.is_valid_position(new_x, new_y) and self.board[new_x][new_y] == 0:
                neighbors.append((new_x, new_y))
        return neighbors

    def count_same_color_adjacent(self, x: int, y: int, color: int) -> int:
        count = 0
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
        for dx, dy in directions:
            new_x, new_y = x + dx, y + dy
            if self.is_valid_position(new_x, new_y) and self.board[new_x][new_y] == color:
                count += 1
        return count

    def generate_path(self) -> bool:
        # Start from a random position on the left edge
        start_x = random.randint(0, self.size - 1)
        start_y = 0
        
        if self.board[start_x][start_y] != 0:
            return False

        path = [(start_x, start_y)]
        self.board[start_x][start_y] = self.current_number

        # Try to reach the right edge
        current_x, current_y = start_x, start_y
        while current_y < self.size - 1:
            neighbors = self.get_neighbors(current_x, current_y)
            valid_neighbors = []
            
            for nx, ny in neighbors:
                if self.count_same_color_adjacent(nx, ny, self.current_number) <= 1:
                    valid_neighbors.append((nx, ny))

            if not valid_neighbors:
                # Backtrack - clear the path and return False
                for x, y in path:
                    self.board[x][y] = 0
                return False

            next_pos = random.choice(valid_neighbors)
            path.append(next_pos)
            current_x, current_y = next_pos
            self.board[current_x][current_y] = self.current_number

        if len(path) >= 3:
            self.paths.append(path)
            self.current_number += 1
            return True
        
        # Clear path if it's too short
        for x, y in path:
            self.board[x][y] = 0
        return False

    def generate_puzzle(self) -> bool:
        attempts = 0
        max_attempts = 10000
        
        while len(self.paths) < self.size and attempts < max_attempts:
            if self.generate_path():
                attempts = 0
            else:
                attempts += 1

        return len(self.paths) == self.size

    def print_board(self):
        for row in self.board:
            print(" ".join(str(cell) if cell != 0 else "." for cell in row))

def main():
    size = 5  # You can change this to generate different sized puzzles
    generator = NumberLinkGenerator(size)
    
    if generator.generate_puzzle():
        print(f"Successfully generated a {size}x{size} NumberLink puzzle:")
        generator.print_board()
    else:
        print("Failed to generate a valid puzzle. Try again or adjust parameters.")

if __name__ == "__main__":
    main()